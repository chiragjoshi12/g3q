import { Router } from 'express';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { prisma } from '../config/prisma.client.js';
import { localizedName } from '../services/geography.service.js';

const router = Router();

function normalizeLang(lang) {
  const value = String(lang || 'gu').trim().toLowerCase();
  return ['gu', 'en', 'hi'].includes(value) ? value : 'gu';
}

router.get(
  '/districts',
  asyncHandler(async (req, res) => {
    const lang = normalizeLang(req.query.lang);
    const districts = await prisma.district.findMany({
      orderBy: { id: 'asc' },
      include: {
        talukas: { orderBy: { nameEn: 'asc' } },
      },
    });

    return res.status(200).json({
      lang,
      districts: districts.map((district) => ({
        id: district.id,
        name: localizedName(district, lang),
        nameEn: district.nameEn,
        nameGu: district.nameGu,
        nameHi: district.nameHi,
        talukas: district.talukas.map((taluka) => ({
          id: taluka.id,
          districtId: taluka.districtId,
          name: localizedName(taluka, lang),
          nameEn: taluka.nameEn,
          nameGu: taluka.nameGu,
          nameHi: taluka.nameHi,
        })),
      })),
    });
  })
);

export default router;
