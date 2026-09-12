/**
 * Encrypt any plaintext `users.mobile` values (10-digit) and set mobile_hash.
 * Safe to re-run. Duplicate mobiles: keep first encrypted, clear later duplicates.
 * Usage: node scripts/encrypt-user-mobiles.js
 */
import 'dotenv/config';
import { prisma } from '../src/config/prisma.client.js';
import {
  encryptMobile,
  hashMobile,
  isValidIndianMobile,
  normalizeMobileDigits,
} from '../src/utils/mobileCrypto.js';

async function main() {
  const rows = await prisma.user.findMany({
    where: { mobile: { not: null } },
    select: { id: true, mobile: true, mobileHash: true },
    orderBy: { createdAt: 'asc' },
  });

  const seenHashes = new Set(
    rows.filter((row) => row.mobileHash).map((row) => row.mobileHash)
  );

  let updated = 0;
  let cleared = 0;
  for (const row of rows) {
    const alreadyEncrypted = row.mobile?.includes(':') && row.mobileHash;
    if (alreadyEncrypted) continue;

    const digits = normalizeMobileDigits(row.mobile);
    if (!isValidIndianMobile(digits)) {
      await prisma.user.update({
        where: { id: row.id },
        data: { mobile: null, mobileHash: null },
      });
      cleared += 1;
      console.warn(`Cleared invalid mobile on user ${row.id}`);
      continue;
    }

    const nextHash = hashMobile(digits);
    if (seenHashes.has(nextHash)) {
      await prisma.user.update({
        where: { id: row.id },
        data: { mobile: null, mobileHash: null },
      });
      cleared += 1;
      console.warn(`Cleared duplicate mobile on user ${row.id}`);
      continue;
    }

    await prisma.user.update({
      where: { id: row.id },
      data: {
        mobile: encryptMobile(digits),
        mobileHash: nextHash,
      },
    });
    seenHashes.add(nextHash);
    updated += 1;
  }

  console.log(`Encrypted ${updated}; cleared ${cleared}; scanned ${rows.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
