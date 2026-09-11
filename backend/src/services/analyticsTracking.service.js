import { prisma } from '../config/prisma.client.js';
import { getActivePlatformWeek } from '../config/platformWeeks.js';

const VISITOR_KEY_MAX = 24;

function normalizeVisitorKey(value) {
  const key = String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, VISITOR_KEY_MAX);
  return key || null;
}

/** Keep only useful AI / product signal; drop source=database and similar noise. */
function sanitizeMetadata(eventType, metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;

  if (eventType === 'g3q_ai_query') {
    const model = metadata.model != null ? String(metadata.model).trim().slice(0, 64) : null;
    const queryCount = Number(
      metadata.queryCount ?? metadata.userTurnCount ?? metadata.messageCount
    );
    const out = {};
    if (model) out.model = model;
    if (Number.isFinite(queryCount) && queryCount >= 0) out.queryCount = Math.floor(queryCount);
    return Object.keys(out).length ? out : null;
  }

  return null;
}

async function touchVisitor({ visitorKey, userId }) {
  const key = normalizeVisitorKey(visitorKey);
  if (!key) return null;
  const now = new Date();
  return prisma.analyticsVisitor.upsert({
    where: { visitorKey: key },
    update: {
      lastSeenAt: now,
      ...(userId ? { userId } : {}),
    },
    create: {
      visitorKey: key,
      userId: userId || null,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });
}

export const analyticsTrackingService = {
  async trackEvent(event, { userId = null } = {}) {
    const visitor = await touchVisitor({
      visitorKey: event.visitorKey,
      userId: userId || null,
    });
    if (!visitor) {
      return { accepted: false, reason: 'visitor_required' };
    }

    const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();
    const weekMeta = getActivePlatformWeek(occurredAt);
    const metadata = sanitizeMetadata(event.eventType, event.metadata);

    const row = await prisma.analyticsEvent.create({
      data: {
        eventType: event.eventType,
        occurredAt,
        week: weekMeta.id,
        visitorId: visitor.id,
        metadata: metadata ?? undefined,
      },
    });

    return { accepted: true, id: row.id, week: weekMeta.id };
  },
};
