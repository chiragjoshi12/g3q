/**
 * One-shot prod backfill: bank_questions → question_roots/variants
 * Uses raw SQL for bank (model removed) + Prisma for roots/variants.
 */
import { PrismaClient } from '@prisma/client';
import {
  buildVariantPayloadFromBankRow,
  legacyTypeToBankType,
} from '../src/config/question-types.js';

const prisma = new PrismaClient();
const BATCH = 250;

function mapRow(r) {
  return {
    id: r.id,
    queId: r.que_id,
    type: r.type,
    departmentId: r.department_id,
    betaDepartmentId: r.beta_department_id,
    departmentGu: r.department_gu,
    departmentEn: r.department_en,
    scope: r.scope || 'GENERAL',
    districtId: r.district_id,
    casteCategory: r.caste_category || 'GENERAL',
    questionGu: r.question_gu,
    questionEn: r.question_en,
    optionAGu: r.option_a_gu,
    optionBGu: r.option_b_gu,
    optionCGu: r.option_c_gu,
    optionDGu: r.option_d_gu,
    optionAEn: r.option_a_en,
    optionBEn: r.option_b_en,
    optionCEn: r.option_c_en,
    optionDEn: r.option_d_en,
    correctOption: r.correct_option,
    content: r.content,
    answer: r.answer,
    reviewStatus: r.review_status,
    reviewedById: r.reviewed_by_id,
    reviewedAt: r.reviewed_at,
    lastEditedById: r.last_edited_by_id,
    lastEditedAt: r.last_edited_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    rootId: r.root_id,
    variantId: r.variant_id,
  };
}

async function main() {
  const totalRow = await prisma.$queryRaw`SELECT COUNT(*) AS c FROM bank_questions`;
  const total = Number(totalRow[0].c);
  console.log(`Backfilling ${total} bank_questions → roots/variants…`);

  let lastId = 0;
  let linked = 0;
  let skipped = 0;

  for (;;) {
    const rawRows = await prisma.$queryRaw`
      SELECT * FROM bank_questions
      WHERE id > ${lastId}
      ORDER BY id ASC
      LIMIT ${BATCH}
    `;
    if (!rawRows.length) break;

    for (const raw of rawRows) {
      const row = mapRow(raw);
      lastId = row.id;

      if (row.variantId && row.rootId) {
        skipped += 1;
        continue;
      }

      const bankType = legacyTypeToBankType(row.type);
      const payload = buildVariantPayloadFromBankRow(row);

      await prisma.$transaction(async (tx) => {
        let root = await tx.questionRoot.findUnique({
          where: { legacyQueId: row.queId },
        });

        if (!root) {
          root = await tx.questionRoot.create({
            data: {
              legacyQueId: row.queId,
              departmentId: row.departmentId,
              scope: row.scope,
              districtId: row.districtId,
              casteCategory: row.casteCategory,
              lastEditedById: row.lastEditedById,
              lastEditedAt: row.lastEditedAt,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            },
          });
        } else {
          root = await tx.questionRoot.update({
            where: { id: root.id },
            data: {
              departmentId: row.departmentId,
              scope: row.scope,
              districtId: row.districtId,
              casteCategory: row.casteCategory,
              lastEditedById: row.lastEditedById,
              lastEditedAt: row.lastEditedAt,
            },
          });
        }

        // Denorm dept columns still exist until department FK migration.
        await tx.$executeRaw`
          UPDATE question_roots
          SET
            beta_department_id = ${row.betaDepartmentId},
            department_gu = ${row.departmentGu},
            department_en = ${row.departmentEn}
          WHERE id = ${root.id}
        `;

        let variant = await tx.questionVariant.findUnique({
          where: { legacyQueId: row.queId },
        });

        if (!variant) {
          const sameType = await tx.questionVariant.findUnique({
            where: { rootId_type: { rootId: root.id, type: bankType } },
          });
          if (sameType) {
            variant = await tx.questionVariant.update({
              where: { id: sameType.id },
              data: {
                legacyQueId: row.queId,
                payload,
                reviewStatus: row.reviewStatus,
                reviewedById: row.reviewedById,
                reviewedAt: row.reviewedAt,
                lastEditedById: row.lastEditedById,
                lastEditedAt: row.lastEditedAt,
              },
            });
          } else {
            variant = await tx.questionVariant.create({
              data: {
                rootId: root.id,
                type: bankType,
                legacyQueId: row.queId,
                payload,
                reviewStatus: row.reviewStatus,
                reviewedById: row.reviewedById,
                reviewedAt: row.reviewedAt,
                lastEditedById: row.lastEditedById,
                lastEditedAt: row.lastEditedAt,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
              },
            });
          }
        } else {
          variant = await tx.questionVariant.update({
            where: { id: variant.id },
            data: {
              rootId: root.id,
              type: bankType,
              payload,
              reviewStatus: row.reviewStatus,
              reviewedById: row.reviewedById,
              reviewedAt: row.reviewedAt,
              lastEditedById: row.lastEditedById,
              lastEditedAt: row.lastEditedAt,
            },
          });
        }

        await tx.$executeRaw`
          UPDATE bank_questions
          SET root_id = ${root.id}, variant_id = ${variant.id}
          WHERE id = ${row.id}
        `;
      });

      linked += 1;
    }

    console.log(`  processed through id=${lastId} (linked=${linked}, skipped=${skipped})`);
  }

  const roots = await prisma.questionRoot.count();
  const variants = await prisma.questionVariant.count();
  const bankLinked = await prisma.$queryRaw`
    SELECT COUNT(*) AS c FROM bank_questions
    WHERE root_id IS NOT NULL AND variant_id IS NOT NULL
  `;

  console.log(
    `Done. roots=${roots}, variants=${variants}, bank_linked=${Number(bankLinked[0].c)}, written=${linked}, already_linked=${skipped}`
  );

  if (Number(bankLinked[0].c) !== total) {
    throw new Error(`Backfill incomplete: linked ${bankLinked[0].c} of ${total}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
