import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/prisma.client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOURCE_PATH = path.resolve(__dirname, '../../Orginal Que.md');

function collapseWhitespace(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function captureField(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\*\\s+\\*\\*${escaped}:\\*\\*([\\s\\S]*?)(?=\\n\\*\\s+\\*\\*[^\\n]+:\\*\\*|$)`
  );
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

function parseRootNumber(block) {
  const match = block.match(/^\*\*Que\s+(\d+)\.\*\*/m);
  if (!match) {
    throw new Error(`Could not parse root number from block: ${block.slice(0, 80)}`);
  }
  return Number(match[1]);
}

async function main() {
  const markdown = await fs.readFile(SOURCE_PATH, 'utf8');
  const blocks = markdown
    .split(/(?=\*\*Que\s+\d+\.\*\*)/g)
    .map((block) => block.trim())
    .filter((block) => block.includes('**Sector:**') && block.includes('**Question Text:**'));

  for (const block of blocks) {
    const rootNumber = parseRootNumber(block);
    const rootCode = `BETA_Q_${String(rootNumber).padStart(3, '0')}`;
    const sector = collapseWhitespace(captureField(block, 'Sector'));
    const rootQuestionGu = collapseWhitespace(captureField(block, 'Question Text'));

    await prisma.betaQuestionRoot.upsert({
      where: { rootCode },
      update: {
        sector,
        rootQuestionGu,
        rootQuestionEn: null,
        verification: null,
        sourceSet: 'original_que_import',
      },
      create: {
        rootCode,
        sector,
        rootQuestionGu,
        rootQuestionEn: null,
        verification: null,
        sourceSet: 'original_que_import',
      },
    });
  }

  const rootCount = await prisma.betaQuestionRoot.count();
  console.log(JSON.stringify({ importedRoots: blocks.length, rootCount }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
