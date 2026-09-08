import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/prisma.client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputPath = process.argv[2] || '../../explantion.md';
const SOURCE_PATH = path.resolve(__dirname, inputPath);

function stripMarkdown(value) {
  return String(value ?? '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

function parseJson(value) {
  if (value == null) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function buildExplanationPayload(block) {
  const lines = String(block)
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const header = lines.shift() || '';
  const match = header.match(/\*\*Que No -\s*(\d+)\*\*/i);
  if (!match) {
    throw new Error(`Could not parse explanation header: ${header}`);
  }

  const explanationLines = lines.filter((line) => line !== '---');
  const rootCode = `BETA_Q_${String(Number(match[1])).padStart(3, '0')}`;
  const summary = stripMarkdown(explanationLines[0] || '');
  const body = explanationLines.join('\n');

  return {
    rootCode,
    explanation: {
      model: 'G3Q Beta',
      summary,
      body,
      keyPoints: explanationLines,
    },
  };
}

async function mergeExplanationIntoRows(modelName, where, explanation) {
  const rows = await prisma[modelName].findMany({
    where,
    select: { id: true, content: true },
  });

  for (const row of rows) {
    const content = parseJson(row.content);
    await prisma[modelName].update({
      where: { id: row.id },
      data: {
        content: {
          ...content,
          explanation,
        },
      },
    });
  }

  return rows.length;
}

async function main() {
  const markdown = await fs.readFile(SOURCE_PATH, 'utf8');
  const blocks = markdown
    .split(/(?=\*\*Que No -\s*\d+\*\*)/g)
    .map((block) => block.trim())
    .filter(Boolean);

  let rootCount = 0;
  let bankQuestionUpdates = 0;
  let sessionQuestionUpdates = 0;

  for (const block of blocks) {
    const { rootCode, explanation } = buildExplanationPayload(block);
    bankQuestionUpdates += await mergeExplanationIntoRows(
      'bankQuestion',
      {
        scope: 'BETA',
        queId: { startsWith: rootCode },
      },
      explanation
    );
    sessionQuestionUpdates += await mergeExplanationIntoRows(
      'quizSessionQuestion',
      {
        bankQueId: { startsWith: rootCode },
      },
      explanation
    );
    rootCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        importedRoots: rootCount,
        bankQuestionUpdates,
        sessionQuestionUpdates,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
