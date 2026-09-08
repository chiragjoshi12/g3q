import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/prisma.client.js';
import { BETA_DEPARTMENTS, resolveBetaDepartment } from '../src/config/beta-departments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = path.resolve(
  process.argv[2] || '/Users/chiragjoshi/Downloads/G3Q BG Images'
);
const STORAGE_ACCOUNT_NAME = String(process.env.AZURE_STORAGE_ACCOUNT_NAME || '').trim();
const STORAGE_ACCOUNT_KEY = String(process.env.AZURE_STORAGE_ACCOUNT_KEY || '').trim();
const STORAGE_CONTAINER = String(process.env.AZURE_STORAGE_CONTAINER || 'g3q').trim();
const MAX_DIMENSION = Number(process.env.BETA_BG_MAX_DIMENSION || 1080);
const JPEG_QUALITY = Number(process.env.BETA_BG_JPEG_QUALITY || 55);

function normalizeFilenameStem(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\uFEFF|\u200B|\u200C|\u200D/g, '')
    .replace(/\.[^.]+$/, '')
    .replace(/\bcopy\b/gi, '')
    .replace(/\(\d+\)/g, '')
    .replace(/\s+\d+$/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function isImageFile(name) {
  return /\.(png|jpe?g|webp)$/i.test(name);
}

async function ensureCleanDirectory(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

function optimizeImage(sourcePath, outputPath) {
  execFileSync('sips', [
    '-s',
    'format',
    'jpeg',
    '-s',
    'formatOptions',
    String(JPEG_QUALITY),
    '-Z',
    String(MAX_DIMENSION),
    sourcePath,
    '--out',
    outputPath,
  ]);
}

function uploadBlob(filePath, blobName) {
  execFileSync('az', [
    'storage',
    'blob',
    'upload',
    '--account-name',
    STORAGE_ACCOUNT_NAME,
    '--account-key',
    STORAGE_ACCOUNT_KEY,
    '--container-name',
    STORAGE_CONTAINER,
    '--name',
    blobName,
    '--file',
    filePath,
    '--content-type',
    'image/jpeg',
    '--overwrite',
    'true',
    '--only-show-errors',
  ]);
}

async function main() {
  if (!STORAGE_ACCOUNT_NAME || !STORAGE_ACCOUNT_KEY) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY are required.');
  }

  const tempRoot = path.join(os.tmpdir(), `g3q-beta-bg-${Date.now()}`);
  await ensureCleanDirectory(tempRoot);

  execFileSync('az', [
    'storage',
    'container',
    'create',
    '--account-name',
    STORAGE_ACCOUNT_NAME,
    '--account-key',
    STORAGE_ACCOUNT_KEY,
    '--name',
    STORAGE_CONTAINER,
    '--public-access',
    'blob',
    '--only-show-errors',
  ]);

  const sourceEntries = await fs.readdir(SOURCE_ROOT, { withFileTypes: true });
  const sourceDirectories = new Map();
  for (const entry of sourceEntries) {
    if (!entry.isDirectory()) continue;
    const department = resolveBetaDepartment(entry.name);
    if (department) {
      sourceDirectories.set(department.id, path.join(SOURCE_ROOT, entry.name));
    }
  }

  const missingDepartments = BETA_DEPARTMENTS.filter((department) => !sourceDirectories.has(department.id));
  if (missingDepartments.length) {
    throw new Error(
      `Missing source folders for departments: ${missingDepartments.map((department) => department.nameEn).join(', ')}`
    );
  }

  const rows = [];

  for (const department of BETA_DEPARTMENTS) {
    const sourceDir = sourceDirectories.get(department.id);
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    const imageNames = entries
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, 'en'));

    let version = 0;
    for (const imageName of imageNames) {
      const sourcePath = path.join(sourceDir, imageName);
      const styleStem = normalizeFilenameStem(imageName) || 'image';
      version += 1;
      const fileName = `${String(version).padStart(2, '0')}-${styleStem}.jpg`;
      const outputDir = path.join(tempRoot, department.key);
      const outputPath = path.join(outputDir, fileName);
      const blobName = `${department.key}/${fileName}`;

      await fs.mkdir(outputDir, { recursive: true });
      optimizeImage(sourcePath, outputPath);
      uploadBlob(outputPath, blobName);

      rows.push({
        betaDepartmentId: department.id,
        style: 'default',
        imageUrl: blobName,
        isActive: true,
      });
    }
  }

  await prisma.$transaction([
    prisma.betaDepartmentQuizImage.deleteMany({}),
    prisma.betaDepartmentQuizImage.createMany({ data: rows }),
  ]);

  const counts = await prisma.betaDepartmentQuizImage.groupBy({
    by: ['betaDepartmentId'],
    _count: { _all: true },
    orderBy: { betaDepartmentId: 'asc' },
  });

  console.log(
    JSON.stringify(
      {
        sourceRoot: SOURCE_ROOT,
        storageContainer: STORAGE_CONTAINER,
        uploadedImages: rows.length,
        departments: counts.map((item) => ({
          betaDepartmentId: item.betaDepartmentId,
          count: item._count._all,
          department: resolveBetaDepartment(
            BETA_DEPARTMENTS.find((department) => department.id === item.betaDepartmentId)?.nameEn
          )?.nameEn,
        })),
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
