import { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';
import { prisma } from '../config/prisma.client.js';
import { getActivePlatformWeek } from '../config/platformWeeks.js';
import { UserModel } from '../models/UserModel.js';

function cleanText(value, max = 128) {
  const text = String(value || '').trim();
  return text ? text.slice(0, max) : null;
}

function mergeContext(base, override) {
  return {
    role: base?.role ?? override?.role ?? null,
    district: cleanText(base?.district ?? override?.district),
    taluka: cleanText(base?.taluka ?? override?.taluka),
  };
}

async function resolveUserContext(userId) {
  if (!userId) return null;
  const user = await UserModel.findById(userId);
  if (!user) return null;
  return {
    userId: user.id,
    role: user.role,
    district: user.district || null,
    taluka: user.taluka || null,
  };
}

async function touchVisitor({ visitorKey, userId }) {
  if (!visitorKey) return null;
  const now = new Date();
  return prisma.analyticsVisitor.upsert({
    where: { visitorKey },
    update: {
      lastSeenAt: now,
      ...(userId ? { userId } : {}),
    },
    create: {
      visitorKey,
      userId: userId || null,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });
}

export const analyticsTrackingService = {
  async trackEvent(event, { userId = null } = {}) {
    const userContext = await resolveUserContext(userId);
    const visitor = await touchVisitor({ visitorKey: event.visitorKey, userId: userContext?.userId ?? null });
    const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();
    const weekMeta = getActivePlatformWeek(occurredAt);
    const context = mergeContext(userContext, event);

    try {
      await prisma.analyticsEvent.create({
        data: {
          eventId: event.eventId || nanoid(16),
          eventType: event.eventType,
          occurredAt,
          week: weekMeta.id,
          userId: userContext?.userId ?? null,
          visitorId: visitor?.id ?? null,
          role: context.role ?? undefined,
          district: context.district,
          taluka: context.taluka,
          quizId: cleanText(event.quizId, 64),
          sessionId: cleanText(event.sessionId, 64),
          attemptId: cleanText(event.attemptId, 64),
          questionCount: Number.isFinite(event.questionCount) ? Number(event.questionCount) : null,
          success: typeof event.success === 'boolean' ? event.success : null,
          latencyMs: Number.isFinite(event.latencyMs) ? Number(event.latencyMs) : null,
          source: cleanText(event.source, 64),
          metadata: event.metadata ?? null,
        },
      });
      return { accepted: true, deduplicated: false, eventId: event.eventId, week: weekMeta.id };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { accepted: true, deduplicated: true, eventId: event.eventId };
      }
      throw error;
    }
  },
};
