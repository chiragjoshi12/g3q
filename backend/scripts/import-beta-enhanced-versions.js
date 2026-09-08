import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/prisma.client.js';
import { resolveBetaDepartment } from '../src/config/beta-departments.js';
import { QUESTION_TYPE } from '../src/config/question-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputPath = process.argv[2] || '../../Improved.md';
const SOURCE_PATH = path.resolve(__dirname, inputPath);
const GUJARATI_DIGITS = { '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9' };

function collapseWhitespace(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripInlineNote(value) {
  return collapseWhitespace(
    String(value ?? '')
      .replace(/\n---[\s\S]*$/u, '')
      .replace(/\s*\*\(વિગતો:[\s\S]*?\)\*\s*$/u, '')
  );
}

function captureField(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\*\\s+\\*\\*${escaped}:\\*\\*([\\s\\S]*?)(?=\\n\\*\\s+\\*\\*[^\\n]+:\\*\\*|$)`
  );
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

function normalizeQuestionType(rawType) {
  const type = collapseWhitespace(rawType).toLowerCase();
  if (type === 'mcq') return QUESTION_TYPE.SINGLE_CHOICE;
  if (type === 'true/false') return QUESTION_TYPE.TRUE_FALSE;
  if (type === 'match the pair') return QUESTION_TYPE.MATCH_FOLLOWING;
  if (type === 'fill in the blanks') return QUESTION_TYPE.DRAG_INTO_BLANKS;
  if (type === 'order the sequence') return QUESTION_TYPE.DRAG_DROP;
  throw new Error(`Unsupported enhanced beta question type: ${rawType}`);
}

function parseChoiceOptions(optionsBlock) {
  const matches = [...optionsBlock.matchAll(/^([A-D])\.\s*(.+)$/gm)];
  if (!matches.length) throw new Error('Could not parse choice options.');
  return Object.fromEntries(matches.map((match) => [match[1], collapseWhitespace(match[2])]));
}

function parseChoiceAnswer(correctAnswer) {
  const match = correctAnswer.match(/^([A-D])\./i);
  if (!match) throw new Error(`Could not parse choice answer: ${correctAnswer}`);
  return match[1].toUpperCase();
}

function parseMatchFollowing(optionsBlock, correctAnswer) {
  const left = [...optionsBlock.matchAll(/^\s*(\d+)\.\s*(.+)$/gm)].map((match) => ({
    id: `L${match[1]}`,
    label: collapseWhitespace(match[2]),
  }));
  const right = [...optionsBlock.matchAll(/^\s*([A-Z])\.\s*(.+)$/gm)].map((match) => ({
    id: match[1].toUpperCase(),
    label: collapseWhitespace(match[2]),
  }));
  if (!left.length || !right.length) throw new Error('Could not parse match-the-pair structure.');

  const answer = {};
  for (const match of correctAnswer.matchAll(/(\d+)\s*-\s*([A-Z])/gi)) {
    answer[`L${match[1]}`] = match[2].toUpperCase();
  }
  if (Object.keys(answer).length !== left.length) {
    throw new Error(`Could not parse full match-the-pair answer: ${correctAnswer}`);
  }
  return { content: { left, right }, answer };
}

function parseBlankSegments(questionText) {
  const normalized = String(questionText ?? '').replace(/\r/g, '').trim();
  const pattern = /(_{2,}|\([0-9૧-૯]+\))/g;
  const segments = [];
  let cursor = 0;
  let index = 1;
  for (const match of normalized.matchAll(pattern)) {
    if (match.index > cursor) {
      segments.push({ type: 'text', value: collapseWhitespace(normalized.slice(cursor, match.index)) });
    }
    segments.push({ type: 'blank', id: `B${index}` });
    cursor = match.index + match[0].length;
    index += 1;
  }
  if (cursor < normalized.length) {
    segments.push({ type: 'text', value: collapseWhitespace(normalized.slice(cursor)) });
  }
  return segments.filter((segment) => segment.type !== 'text' || segment.value);
}

function parseBlankAnswers(correctAnswer, bank, blankCount) {
  if (!/[૦-૯0-9]\s*[-:]/u.test(correctAnswer)) {
    const normalizedAnswer = collapseWhitespace(correctAnswer);
    const contained = bank
      .map((item) => ({ label: item.label, index: normalizedAnswer.indexOf(collapseWhitespace(item.label)) }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.label);
    if (contained.length >= blankCount) {
      return contained.slice(0, blankCount);
    }
    return normalizedAnswer
      .split(/\s+અને\s+|\s+and\s+/i)
      .map((value) => collapseWhitespace(value))
      .filter(Boolean);
  }
  const numbered = [];
  const numberedPattern =
    /(?:^|,\s*)(?:\(?[0-9૧-૯]+\)?\s*[-:]\s*)(.*?)(?=(?:,\s*\(?[0-9૧-૯]+\)?\s*[-:])|$)/g;
  for (const match of correctAnswer.matchAll(numberedPattern)) {
    numbered.push(collapseWhitespace(match[1]));
  }
  return numbered;
}

function parseDragIntoBlanks(questionText, optionsBlock, correctAnswer) {
  const bankMatch = optionsBlock.match(/\[([\s\S]*?)\]/);
  if (!bankMatch) throw new Error('Could not parse fill-in-the-blanks bank.');
  const bank = bankMatch[1]
    .split('|')
    .map((item) => collapseWhitespace(item))
    .filter(Boolean)
    .map((label, index) => ({ id: `W${index + 1}`, label }));

  const blankIds = parseBlankSegments(questionText)
    .filter((segment) => segment.type === 'blank')
    .map((segment) => segment.id);
  const answerValues = parseBlankAnswers(correctAnswer, bank, blankIds.length);
  const answer = {};
  for (let i = 0; i < blankIds.length; i += 1) {
    const label = answerValues[i];
    const bankItem = bank.find((item) => collapseWhitespace(item.label) === collapseWhitespace(label));
    if (!bankItem) {
      throw new Error(`Could not map blank answer "${label}" into bank options.`);
    }
    answer[blankIds[i]] = bankItem.id;
  }
  if (Object.keys(answer).length !== blankIds.length) {
    throw new Error(`Could not parse full blanks answer: ${correctAnswer}`);
  }
  return { content: { segments: parseBlankSegments(questionText), bank }, answer };
}

function parseDragDrop(optionsBlock, correctAnswer) {
  const items = [...optionsBlock.matchAll(/^\s*(\d+)\.\s*(.+)$/gm)].map((match) => ({
    id: match[1],
    label: collapseWhitespace(match[2]),
  }));
  if (!items.length) throw new Error('Could not parse ordered-sequence items.');
  const answer = [...correctAnswer.matchAll(/\d+/g)].map((match) => match[0]);
  if (answer.length !== items.length) {
    throw new Error(`Could not parse full ordered answer: ${correctAnswer}`);
  }
  return { content: { items }, answer };
}

function toAsciiDigits(value) {
  return String(value ?? '').replace(/[૦-૯]/g, (digit) => GUJARATI_DIGITS[digit] ?? digit);
}

function parseRootNumber(header) {
  const match = header.match(/(?:પ્રશ્ન|Que)\s+([૦-૯0-9]+)/u);
  if (!match) throw new Error(`Could not parse root question number from: ${header}`);
  return Number(toAsciiDigits(match[1]));
}

function variantQueId(rootCode, type) {
  const suffixMap = {
    [QUESTION_TYPE.SINGLE_CHOICE]: 'SC',
    [QUESTION_TYPE.DRAG_INTO_BLANKS]: 'FIB',
    [QUESTION_TYPE.MATCH_FOLLOWING]: 'MAT',
    [QUESTION_TYPE.TRUE_FALSE]: 'TF',
    [QUESTION_TYPE.DRAG_DROP]: 'ORD',
    [QUESTION_TYPE.IMAGE_CHOICE]: 'IMG',
  };
  return `${rootCode}_V_${suffixMap[type] || 'VAR'}`;
}

function buildVariantPayload(block) {
  const sector = collapseWhitespace(captureField(block, 'Sector'));
  const type = normalizeQuestionType(captureField(block, 'Question Type'));
  const questionText = collapseWhitespace(captureField(block, 'Question Text'));
  const optionsBlock = captureField(block, 'Options/Structure');
  const correctAnswer = stripInlineNote(captureField(block, 'Correct Answer'));
  const verification = collapseWhitespace(captureField(block, 'Verification'));

  const base = {
    type,
    promptGu: questionText,
    promptEn: null,
    optionAGu: null,
    optionBGu: null,
    optionCGu: null,
    optionDGu: null,
    optionAEn: null,
    optionBEn: null,
    optionCEn: null,
    optionDEn: null,
    correctOption: null,
    content: { source: 'improved_beta_versions', sector, verification },
    answer: null,
  };

  if (type === QUESTION_TYPE.SINGLE_CHOICE || type === QUESTION_TYPE.TRUE_FALSE) {
    const options = parseChoiceOptions(optionsBlock);
    return {
      ...base,
      optionAGu: options.A ?? null,
      optionBGu: options.B ?? null,
      optionCGu: options.C ?? null,
      optionDGu: options.D ?? null,
      correctOption: parseChoiceAnswer(correctAnswer),
    };
  }

  if (type === QUESTION_TYPE.MATCH_FOLLOWING) {
    const parsed = parseMatchFollowing(optionsBlock, correctAnswer);
    return { ...base, content: { ...base.content, ...parsed.content }, answer: parsed.answer };
  }

  if (type === QUESTION_TYPE.DRAG_INTO_BLANKS) {
    const parsed = parseDragIntoBlanks(questionText, optionsBlock, correctAnswer);
    return { ...base, content: { ...base.content, ...parsed.content }, answer: parsed.answer };
  }

  if (type === QUESTION_TYPE.DRAG_DROP) {
    const parsed = parseDragDrop(optionsBlock, correctAnswer);
    return { ...base, content: { ...base.content, ...parsed.content }, answer: parsed.answer };
  }

  throw new Error(`No variant payload builder for: ${type}`);
}

async function main() {
  const markdown = await fs.readFile(SOURCE_PATH, 'utf8');
  const groups = markdown
    .split(/(?=\*\*(?:પ્રશ્ન|Que)\s+[૦-૯0-9]+)/u)
    .map((group) => group.trim())
    .filter(Boolean);

  const variantsByKey = new Map();

  for (const group of groups) {
    const [headerLine, ...restLines] = group.split('\n');
    const rootNumber = parseRootNumber(headerLine);
    const rootCode = `BETA_Q_${String(rootNumber).padStart(3, '0')}`;
    const rest = restLines.join('\n');
    const formatBlocks = rest.includes('**Format')
      ? rest
          .split(/(?=\*\*Format\s+\d+:)/g)
          .map((block) => block.trim())
          .filter((block) => block.startsWith('**Format'))
      : rest
          .split(/(?=\*\s+\*\*Sector:\*\*)/g)
          .map((block) => block.trim())
          .filter((block) => block.includes('**Question Type:**'));

    for (const block of formatBlocks) {
      let variant;
      try {
        variant = buildVariantPayload(block);
      } catch (error) {
        throw new Error(
          `Failed parsing ${rootCode}: ${error.message}\n${block.slice(0, 400)}`
        );
      }
      variantsByKey.set(`${rootCode}:${variant.type}`, { rootCode, variant });
    }
  }

  const rootsTouched = new Set();
  let imported = 0;

  for (const { rootCode, variant } of variantsByKey.values()) {
    const root = await prisma.betaQuestionRoot.findUnique({ where: { rootCode } });
    if (!root) {
      throw new Error(`Root beta question not found for ${rootCode}. Import beta_que data first.`);
    }
    const betaDepartment = resolveBetaDepartment(root.sector);
    rootsTouched.add(rootCode);
    await prisma.betaQuestionVariant.upsert({
        where: {
          rootId_type: {
            rootId: root.id,
            type: variant.type,
          },
        },
        update: {
          promptGu: variant.promptGu,
          promptEn: variant.promptEn,
          optionAGu: variant.optionAGu,
          optionBGu: variant.optionBGu,
          optionCGu: variant.optionCGu,
          optionDGu: variant.optionDGu,
          optionAEn: variant.optionAEn,
          optionBEn: variant.optionBEn,
          optionCEn: variant.optionCEn,
          optionDEn: variant.optionDEn,
          correctOption: variant.correctOption,
          content: variant.content,
          answer: variant.answer,
        },
        create: {
          rootId: root.id,
          type: variant.type,
          promptGu: variant.promptGu,
          promptEn: variant.promptEn,
          optionAGu: variant.optionAGu,
          optionBGu: variant.optionBGu,
          optionCGu: variant.optionCGu,
          optionDGu: variant.optionDGu,
          optionAEn: variant.optionAEn,
          optionBEn: variant.optionBEn,
          optionCEn: variant.optionCEn,
          optionDEn: variant.optionDEn,
          correctOption: variant.correctOption,
          content: variant.content,
          answer: variant.answer,
        },
      });
    await prisma.bankQuestion.upsert({
      where: { queId: variantQueId(rootCode, variant.type) },
      update: {
        betaDepartmentId: betaDepartment?.id ?? root.departmentId ?? null,
        departmentGu: variant.content?.sector || root.sector || 'Beta',
        departmentEn: variant.content?.sector || root.sector || 'Beta',
        questionGu: variant.promptGu,
        questionEn: variant.promptEn,
        type: variant.type,
        optionAGu: variant.optionAGu,
        optionBGu: variant.optionBGu,
        optionCGu: variant.optionCGu,
        optionDGu: variant.optionDGu,
        optionAEn: variant.optionAEn,
        optionBEn: variant.optionBEn,
        optionCEn: variant.optionCEn,
        optionDEn: variant.optionDEn,
        correctOption: variant.correctOption,
        content: { ...(variant.content || {}), rootCode, source: 'beta_enhanced' },
        answer: variant.answer,
        scope: 'BETA',
        district: null,
        casteCategory: 'GENERAL',
        reviewStatus: 'ACCEPTED',
      },
      create: {
        queId: variantQueId(rootCode, variant.type),
        betaDepartmentId: betaDepartment?.id ?? root.departmentId ?? null,
        departmentGu: variant.content?.sector || root.sector || 'Beta',
        departmentEn: variant.content?.sector || root.sector || 'Beta',
        questionGu: variant.promptGu,
        questionEn: variant.promptEn,
        type: variant.type,
        optionAGu: variant.optionAGu,
        optionBGu: variant.optionBGu,
        optionCGu: variant.optionCGu,
        optionDGu: variant.optionDGu,
        optionAEn: variant.optionAEn,
        optionBEn: variant.optionBEn,
        optionCEn: variant.optionCEn,
        optionDEn: variant.optionDEn,
        correctOption: variant.correctOption,
        content: { ...(variant.content || {}), rootCode, source: 'beta_enhanced' },
        answer: variant.answer,
        scope: 'BETA',
        district: null,
        casteCategory: 'GENERAL',
        reviewStatus: 'ACCEPTED',
      },
    });
    imported += 1;
  }

  const totalVariants = await prisma.betaQuestionVariant.count();
  console.log(
    JSON.stringify(
      {
        processedBlocks: variantsByKey.size,
        imported,
        rootsTouched: rootsTouched.size,
        totalVariants,
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
