import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/prisma.client.js';
import { resolveBetaDepartment } from '../src/config/beta-departments.js';
import { QUESTION_TYPE } from '../src/config/question-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputPath = process.argv[2] || '../../beta_que.md';
const SOURCE_PATH = path.resolve(__dirname, inputPath);

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

function parseRootNumber(block, fallbackIndex) {
  const match = block.match(/^\*\*(?:Que\s+)?(\d+)\.\*\*/m);
  return match ? Number(match[1]) : fallbackIndex + 1;
}

function captureField(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\*\\s+\\*\\*${escaped}:\\*\\*([\\s\\S]*?)(?=\\n\\*\\s+\\*\\*[^\\n]+:\\*\\*|$)`
  );
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

function captureFirstField(block, labels) {
  for (const label of labels) {
    const value = captureField(block, label);
    if (value) return value;
  }
  return '';
}

function normalizeQuestionType(rawType) {
  const type = collapseWhitespace(rawType).toLowerCase();
  if (type === 'mcq') return QUESTION_TYPE.SINGLE_CHOICE;
  if (type === 'true/false') return QUESTION_TYPE.TRUE_FALSE;
  if (type === 'match the pair') return QUESTION_TYPE.MATCH_FOLLOWING;
  if (type === 'fill in the blanks') return QUESTION_TYPE.DRAG_INTO_BLANKS;
  if (type === 'order the sequence') return QUESTION_TYPE.DRAG_DROP;
  throw new Error(`Unsupported beta question type: ${rawType}`);
}

function parseChoiceOptions(optionsBlock) {
  const matches = [...optionsBlock.matchAll(/^([A-D])\.\s*(.+)$/gm)];
  if (!matches.length) {
    throw new Error('Could not parse choice options.');
  }
  return Object.fromEntries(matches.map((match) => [match[1], collapseWhitespace(match[2])]));
}

function parseChoiceAnswer(correctAnswer) {
  const match = correctAnswer.match(/^([A-D])\./i);
  if (!match) {
    throw new Error(`Could not parse choice answer: ${correctAnswer}`);
  }
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

  if (!left.length || !right.length) {
    throw new Error('Could not parse match-the-pair structure.');
  }

  const answer = {};
  for (const match of correctAnswer.matchAll(/(\d+)\s*-\s*([A-Z])/gi)) {
    answer[`L${match[1]}`] = match[2].toUpperCase();
  }

  if (Object.keys(answer).length !== left.length) {
    throw new Error(`Could not parse full match-the-pair answer: ${correctAnswer}`);
  }

  return {
    content: { left, right },
    answer,
  };
}

function parseBlankSegments(questionText) {
  const normalized = String(questionText ?? '').replace(/\r/g, '').trim();
  const pattern = /(_{2,}|\([0-9૧-૯]+\))/g;
  const segments = [];
  let cursor = 0;
  let index = 1;

  for (const match of normalized.matchAll(pattern)) {
    if (match.index > cursor) {
      segments.push({
        type: 'text',
        value: collapseWhitespace(normalized.slice(cursor, match.index)),
      });
    }
    segments.push({ type: 'blank', id: `B${index}` });
    cursor = match.index + match[0].length;
    index += 1;
  }

  if (cursor < normalized.length) {
    segments.push({
      type: 'text',
      value: collapseWhitespace(normalized.slice(cursor)),
    });
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
  if (!bankMatch) {
    throw new Error('Could not parse fill-in-the-blanks bank.');
  }
  const bank = bankMatch[1]
    .split('|')
    .map((item) => collapseWhitespace(item))
    .filter(Boolean)
    .map((label, index) => ({ id: `W${index + 1}`, label }));

  const segments = parseBlankSegments(questionText);
  const blankIds = segments.filter((segment) => segment.type === 'blank').map((segment) => segment.id);
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

  return {
    content: { segments, bank },
    answer,
  };
}

function parseDragDrop(optionsBlock, correctAnswer) {
  const items = [...optionsBlock.matchAll(/^\s*(\d+)\.\s*(.+)$/gm)].map((match) => ({
    id: match[1],
    label: collapseWhitespace(match[2]),
  }));
  if (!items.length) {
    throw new Error('Could not parse ordered-sequence items.');
  }
  const answer = [...correctAnswer.matchAll(/\d+/g)].map((match) => match[0]);
  if (answer.length !== items.length) {
    throw new Error(`Could not parse full ordered answer: ${correctAnswer}`);
  }
  return {
    content: { items },
    answer,
  };
}

function toBankQuestion(block, index) {
  const rootNumber = parseRootNumber(block, index);
  const sector = collapseWhitespace(captureField(block, 'Sector'));
  const betaDepartment = resolveBetaDepartment(sector);
  const rawType = collapseWhitespace(captureField(block, 'Question Type'));
  const questionText = collapseWhitespace(captureField(block, 'Question Text'));
  const optionsBlock = captureField(block, 'Options/Structure');
  const correctAnswer = stripInlineNote(
    captureFirstField(block, ['Correct Answer', 'Correct Answer Correction'])
  );
  const verification = collapseWhitespace(captureField(block, 'Verification'));
  const type = normalizeQuestionType(rawType);
  const base = {
    queId: `BETA_Q_${String(rootNumber).padStart(3, '0')}`,
    betaDepartmentId: betaDepartment?.id ?? null,
    departmentGu: sector || 'Beta',
    departmentEn: sector || 'Beta',
    questionGu: questionText,
    questionEn: null,
    type,
    scope: 'BETA',
    district: null,
    casteCategory: 'GENERAL',
    reviewStatus: 'ACCEPTED',
  };

  if (type === QUESTION_TYPE.SINGLE_CHOICE || type === QUESTION_TYPE.TRUE_FALSE) {
    const options = parseChoiceOptions(optionsBlock);
    return {
      ...base,
      optionAGu: options.A ?? null,
      optionBGu: options.B ?? null,
      optionCGu: options.C ?? null,
      optionDGu: options.D ?? null,
      optionAEn: null,
      optionBEn: null,
      optionCEn: null,
      optionDEn: null,
      correctOption: parseChoiceAnswer(correctAnswer),
      content: { source: 'beta_original', rootCode: `BETA_Q_${String(rootNumber).padStart(3, '0')}`, verification },
      answer: null,
    };
  }

  if (type === QUESTION_TYPE.MATCH_FOLLOWING) {
    const parsed = parseMatchFollowing(optionsBlock, correctAnswer);
    return {
      ...base,
      optionAGu: null,
      optionBGu: null,
      optionCGu: null,
      optionDGu: null,
      optionAEn: null,
      optionBEn: null,
      optionCEn: null,
      optionDEn: null,
      correctOption: null,
      content: { ...parsed.content, source: 'beta_original', rootCode: `BETA_Q_${String(rootNumber).padStart(3, '0')}`, verification },
      answer: parsed.answer,
    };
  }

  if (type === QUESTION_TYPE.DRAG_INTO_BLANKS) {
    const parsed = parseDragIntoBlanks(questionText, optionsBlock, correctAnswer);
    return {
      ...base,
      optionAGu: null,
      optionBGu: null,
      optionCGu: null,
      optionDGu: null,
      optionAEn: null,
      optionBEn: null,
      optionCEn: null,
      optionDEn: null,
      correctOption: null,
      content: { ...parsed.content, source: 'beta_original', rootCode: `BETA_Q_${String(rootNumber).padStart(3, '0')}`, verification },
      answer: parsed.answer,
    };
  }

  if (type === QUESTION_TYPE.DRAG_DROP) {
    const parsed = parseDragDrop(optionsBlock, correctAnswer);
    return {
      ...base,
      optionAGu: null,
      optionBGu: null,
      optionCGu: null,
      optionDGu: null,
      optionAEn: null,
      optionBEn: null,
      optionCEn: null,
      optionDEn: null,
      correctOption: null,
      content: { ...parsed.content, source: 'beta_original', rootCode: `BETA_Q_${String(rootNumber).padStart(3, '0')}`, verification },
      answer: parsed.answer,
    };
  }

  throw new Error(`No importer path for beta question type: ${rawType}`);
}

async function main() {
  throw new Error('This importer still targets bank_questions (dropped). Re-point it at question_roots/question_variants.');
  const markdown = await fs.readFile(SOURCE_PATH, 'utf8');
  const blocks = markdown
    .split(/(?=\*\*(?:Que\s+)?[0-9]+\.\*\*)/g)
    .map((block) => block.trim())
    .filter((block) => block.includes('**Question Type:**'));

  const rows = blocks.map((block, index) => toBankQuestion(block, index));

  for (const row of rows) {
    const bankQuestion = await prisma.bankQuestion.upsert({
      where: { queId: row.queId },
      update: row,
      create: row,
    });

    const root = await prisma.betaQuestionRoot.upsert({
      where: { rootCode: row.queId },
      update: {
        sector: row.departmentEn,
        departmentId: row.betaDepartmentId ?? null,
        rootQuestionGu: row.questionGu,
        rootQuestionEn: row.questionEn,
        verification: row.content?.verification ?? null,
        sourceSet: 'beta_markdown_import',
      },
      create: {
        rootCode: row.queId,
        sector: row.departmentEn,
        rootQuestionGu: row.questionGu,
        rootQuestionEn: row.questionEn,
        verification: row.content?.verification ?? null,
        sourceSet: 'beta_markdown_import',
      },
    });

    await prisma.betaQuestionVariant.upsert({
      where: {
        rootId_type: {
          rootId: root.id,
          type: row.type,
        },
      },
      update: {
        rootId: root.id,
        type: row.type,
        promptGu: row.questionGu,
        promptEn: row.questionEn,
        optionAGu: row.optionAGu,
        optionBGu: row.optionBGu,
        optionCGu: row.optionCGu,
        optionDGu: row.optionDGu,
        optionAEn: row.optionAEn,
        optionBEn: row.optionBEn,
        optionCEn: row.optionCEn,
        optionDEn: row.optionDEn,
        correctOption: row.correctOption,
        content: row.content ?? null,
        answer: row.answer ?? null,
        sourceBankQueId: bankQuestion.queId,
      },
      create: {
        rootId: root.id,
        type: row.type,
        promptGu: row.questionGu,
        promptEn: row.questionEn,
        optionAGu: row.optionAGu,
        optionBGu: row.optionBGu,
        optionCGu: row.optionCGu,
        optionDGu: row.optionDGu,
        optionAEn: row.optionAEn,
        optionBEn: row.optionBEn,
        optionCEn: row.optionCEn,
        optionDEn: row.optionDEn,
        correctOption: row.correctOption,
        content: row.content ?? null,
        answer: row.answer ?? null,
        sourceBankQueId: bankQuestion.queId,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        imported: rows.length,
        scope: 'BETA',
        first: rows[0]?.queId ?? null,
        last: rows[rows.length - 1]?.queId ?? null,
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
