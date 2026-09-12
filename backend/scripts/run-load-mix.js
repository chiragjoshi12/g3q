import { performance } from 'node:perf_hooks';
import { prisma } from '../src/config/prisma.client.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { decryptMobile } from '../src/utils/mobileCrypto.js';

const BASE_URL = process.env.LOAD_TEST_BASE_URL || 'http://localhost:4000';
const SESSION_USER_LIMIT = Number(process.env.LOAD_TEST_SESSION_USERS || 2000);
const SESSION_CONCURRENCY = Number(process.env.LOAD_TEST_SESSION_CONCURRENCY || 200);
const OTP_CONCURRENCY = Number(process.env.LOAD_TEST_OTP_CONCURRENCY || 100);
const OTP_SECONDS = Number(process.env.LOAD_TEST_OTP_SECONDS || 20);
const LEADERBOARD_CONCURRENCY = Number(process.env.LOAD_TEST_LEADERBOARD_CONCURRENCY || 200);
const LEADERBOARD_SECONDS = Number(process.env.LOAD_TEST_LEADERBOARD_SECONDS || 20);

function createStats(name) {
  return {
    name,
    startedAt: new Date().toISOString(),
    requests: 0,
    ok: 0,
    failed: 0,
    networkErrors: 0,
    statusCounts: {},
    latencies: [],
    samples: [],
  };
}

function record(stats, { status, latencyMs, sample }) {
  stats.requests += 1;
  if (typeof status === 'number') {
    stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;
    if (status >= 200 && status < 300) stats.ok += 1;
    else stats.failed += 1;
  } else {
    stats.networkErrors += 1;
    stats.failed += 1;
  }
  stats.latencies.push(latencyMs);
  if (sample && stats.samples.length < 5) stats.samples.push(sample);
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round(sorted[index]);
}

function summarize(stats, durationMs) {
  const totalLatency = stats.latencies.reduce((sum, value) => sum + value, 0);
  return {
    requests: stats.requests,
    ok: stats.ok,
    failed: stats.failed,
    networkErrors: stats.networkErrors,
    statusCounts: stats.statusCounts,
    throughputPerSec: Number((stats.requests / Math.max(durationMs / 1000, 1)).toFixed(2)),
    latencyMs: {
      avg: stats.latencies.length ? Math.round(totalLatency / stats.latencies.length) : null,
      p50: percentile(stats.latencies, 50),
      p95: percentile(stats.latencies, 95),
      p99: percentile(stats.latencies, 99),
      max: stats.latencies.length ? Math.round(Math.max(...stats.latencies)) : null,
    },
    samples: stats.samples,
  };
}

async function requestJson(url, options = {}) {
  const started = performance.now();
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return {
      ok: response.ok,
      status: response.status,
      body,
      latencyMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: { message: error?.message || String(error) },
      latencyMs: Math.round(performance.now() - started),
    };
  }
}

async function runTimeboxedWorkers({ concurrency, seconds, work }) {
  const started = performance.now();
  const endAt = started + seconds * 1000;
  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    while (performance.now() < endAt) {
      await work(workerIndex);
    }
  });
  await Promise.all(workers);
  return Math.round(performance.now() - started);
}

async function runOtpLoad(mobiles) {
  const stats = createStats('otp');
  const durationMs = await runTimeboxedWorkers({
    concurrency: OTP_CONCURRENCY,
    seconds: OTP_SECONDS,
    work: async (workerIndex) => {
      const mobile = mobiles[workerIndex % mobiles.length];
      const result = await requestJson(`${BASE_URL}/api/auth/otp/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'citizen', mobile }),
      });
      record(stats, {
        status: result.status,
        latencyMs: result.latencyMs,
        sample: result.ok ? null : result.body,
      });
    },
  });
  return summarize(stats, durationMs);
}

async function runLeaderboardLoad() {
  const stats = createStats('leaderboard');
  const durationMs = await runTimeboxedWorkers({
    concurrency: LEADERBOARD_CONCURRENCY,
    seconds: LEADERBOARD_SECONDS,
    work: async () => {
      const result = await requestJson(`${BASE_URL}/api/leaderboard?limit=10`);
      record(stats, {
        status: result.status,
        latencyMs: result.latencyMs,
        sample: result.ok ? null : result.body,
      });
    },
  });
  return summarize(stats, durationMs);
}

function buildSubmission(questions) {
  const answers = {};
  const timings = {};
  for (const question of questions || []) {
    const optionId = Array.isArray(question.options) && question.options[0]?.id ? question.options[0].id : 'a';
    answers[question.id] = optionId;
    timings[question.id] = 5000;
  }
  return { answers, timings };
}

async function runSessionFlow(users) {
  const startStats = createStats('session_start');
  const submitStats = createStats('session_submit');
  let cursor = 0;
  const started = performance.now();

  const workers = Array.from({ length: Math.min(SESSION_CONCURRENCY, users.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= users.length) break;

      const user = users[index];
      const headers = {
        'content-type': 'application/json',
        authorization: `Bearer ${user.token}`,
      };

      const startResult = await requestJson(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ count: 15, language: 'gu' }),
      });

      record(startStats, {
        status: startResult.status,
        latencyMs: startResult.latencyMs,
        sample: startResult.ok ? null : startResult.body,
      });

      if (!startResult.ok || !startResult.body?.sessionId) continue;

      const payload = buildSubmission(startResult.body.questions);
      const submitResult = await requestJson(`${BASE_URL}/api/sessions/${startResult.body.sessionId}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          answers: payload.answers,
          timings: payload.timings,
          startedAt: startResult.body.startedAt,
        }),
      });

      record(submitStats, {
        status: submitResult.status,
        latencyMs: submitResult.latencyMs,
        sample: submitResult.ok ? null : submitResult.body,
      });
    }
  });

  await Promise.all(workers);
  const durationMs = Math.round(performance.now() - started);
  return {
    usersProcessed: users.length,
    start: summarize(startStats, durationMs),
    submit: summarize(submitStats, durationMs),
  };
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: { startsWith: 'load_stu_' } },
        { id: { startsWith: 'load_col_' } },
        { id: { startsWith: 'load_cit_' } },
      ],
    },
    orderBy: { id: 'asc' },
    take: SESSION_USER_LIMIT,
    select: {
      id: true,
      role: true,
      mobile: true,
    },
  });

  if (!users.length) {
    throw new Error('No load-test users found. Run prepare-load-test-data.js first.');
  }

  const citizenMobiles = users
    .filter((user) => user.role === 'citizen' && user.mobile)
    .map((user) => decryptMobile(user.mobile))
    .filter(Boolean);
  if (!citizenMobiles.length) {
    throw new Error('No load-test citizen mobiles found for OTP load.');
  }

  const usersWithTokens = users.map((user) => ({
    ...user,
    token: generateAccessToken({ id: user.id, role: user.role }),
  }));

  const overallStarted = performance.now();
  const [otp, leaderboard, sessionFlow] = await Promise.all([
    runOtpLoad(citizenMobiles),
    runLeaderboardLoad(),
    runSessionFlow(usersWithTokens),
  ]);
  const overallDurationMs = Math.round(performance.now() - overallStarted);

  console.log(
    JSON.stringify(
      {
        config: {
          baseUrl: BASE_URL,
          sessionUsers: usersWithTokens.length,
          sessionConcurrency: SESSION_CONCURRENCY,
          otpConcurrency: OTP_CONCURRENCY,
          otpSeconds: OTP_SECONDS,
          leaderboardConcurrency: LEADERBOARD_CONCURRENCY,
          leaderboardSeconds: LEADERBOARD_SECONDS,
        },
        overallDurationMs,
        results: {
          otp,
          leaderboard,
          sessionFlow,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
