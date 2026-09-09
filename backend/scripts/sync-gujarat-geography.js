import dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DISTRICT_BY_NAME,
  GUJARAT_DISTRICTS,
  NEW_TALUKAS_2025,
  normalizeDistrictName,
} from '../src/config/gujarat-geography.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const prisma = new PrismaClient();

const SUBDISTRICT_CSV_URL =
  'https://raw.githubusercontent.com/planemad/india-local-government-directory/master/administrative/3-subdistrict.csv';

const REMOVED_FROM_BANASKANTHA = new Set(['Bhabhar', 'Deodar', 'Lakhani', 'Suigam', 'Tharad', 'Vav']);

const RENAMED_SUBDISTRICTS = {
  'Anand Rural': 'Anand',
  'Jamnagar Rural': 'Jamnagar',
  'Vadodara Rural': 'Vadodara',
};

const ZERO_CODE_TALUKAS = new Set([
  'Bodeli',
  'Desar',
  'Dholera',
  'Galteshwar',
  'Garudeshwar',
  'Gir Gadhda',
  'Jesar',
  'Jotana',
  'Junagadh City',
  'Khergam',
  'Lakhani',
  'Netrang',
  'Poshina',
  'Sanjeli',
  'Shankheshvar',
  'Saraswati',
  'Subir',
  'Suigam',
  'Thangadh',
  'Vapi',
  'Vaso',
  'Vinchchiya',
  'Waghai',
]);

const NON_TALUKA_SUBDISTRICTS = new Set([
  'Adajan',
  'Anand City',
  'Asarva',
  'Ghatlodiya',
  'Jamnagar City',
  'Katargam',
  'Maninagar',
  'Nadiad City',
  'Puna',
  'Rajkot East',
  'Rajkot South',
  'Rajkot West',
  'Sabarmati',
  'Singvad',
  'Udhna',
  'Vadodara East',
  'Vadodara North',
  'Vadodara South',
  'Vadodara West',
  'Vatva',
  'Vejalpur',
]);

const ZERO_CODE_TALUKA_KEYS = new Set([...ZERO_CODE_TALUKAS].map((name) => name.toLowerCase()));
const NON_TALUKA_SUBDISTRICT_KEYS = new Set(
  [...NON_TALUKA_SUBDISTRICTS].map((name) => name.toLowerCase())
);

const TALUKA_TRANSLATION_OVERRIDES = {
  Amirgadh: { nameGu: 'અમિરગઢ', nameHi: 'अमीरगढ़' },
  Areth: { nameGu: 'અરેઠ', nameHi: 'अरेठ' },
  Bhabhar: { nameGu: 'ભાભર', nameHi: 'भाभर' },
  Chikda: { nameGu: 'ચિકડા', nameHi: 'चिकडा' },
  Danta: { nameGu: 'દાંતા', nameHi: 'दांता' },
  Dantiwada: { nameGu: 'દાંતીવાડા', nameHi: 'दांतीवाडा' },
  Deesa: { nameGu: 'ડીસા', nameHi: 'डीसा' },
  Deodar: { nameGu: 'દિયોદર', nameHi: 'दियोदर' },
  Dharnidhar: { nameGu: 'ધરણીધર', nameHi: 'धरनीधर' },
  Fagvel: { nameGu: 'ફાગવેલ', nameHi: 'फागवेल' },
  Godhar: { nameGu: 'ગોધર', nameHi: 'गोधर' },
  'Guru Govind Limbdi': { nameGu: 'ગુરુ ગોવિંદ લીમડી', nameHi: 'गुरु गोविंद लिमडी' },
  Hadad: { nameGu: 'હડાદ', nameHi: 'हडाद' },
  Kadval: { nameGu: 'કડવાલ', nameHi: 'कडवाल' },
  Kothamba: { nameGu: 'કોઠંબા', nameHi: 'कोठंबा' },
  Lakhani: { nameGu: 'લાખાણી', nameHi: 'लाखाणी' },
  Nanapodha: { nameGu: 'નાનાપોંઢા', nameHi: 'नानापोंढा' },
  Ogad: { nameGu: 'ઓગાડ', nameHi: 'ओगाड' },
  Palanpur: { nameGu: 'પાલનપુર', nameHi: 'पालनपुर' },
  Rah: { nameGu: 'રાહ', nameHi: 'राह' },
  Sathamba: { nameGu: 'સથાંબા', nameHi: 'सथांबा' },
  Shamlaji: { nameGu: 'શામળાજી', nameHi: 'शामलाजी' },
  Suigam: { nameGu: 'સુઈગામ', nameHi: 'सुईगाम' },
  Sukhsar: { nameGu: 'સુખસર', nameHi: 'सुखसर' },
  Tharad: { nameGu: 'થરાદ', nameHi: 'थराद' },
  Ukai: { nameGu: 'ઉકાઈ', nameHi: 'उकाई' },
  Vadgam: { nameGu: 'વડગામ', nameHi: 'वडगाम' },
  Vav: { nameGu: 'વાવ', nameHi: 'वाव' },
};

const TALUKA_TRANSLATION_OVERRIDE_MAP = new Map(
  Object.entries(TALUKA_TRANSLATION_OVERRIDES).map(([name, value]) => [name.toLowerCase(), value])
);

const TRANSLATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nameEn: { type: Type.STRING },
          nameGu: { type: Type.STRING },
          nameHi: { type: Type.STRING },
        },
        required: ['nameEn', 'nameGu', 'nameHi'],
      },
    },
  },
  required: ['items'],
};

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter(Boolean);
  const header = parseCsvLine(lines.shift() || '');
  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return header.reduce((row, key, index) => {
      row[key] = cells[index] ?? '';
      return row;
    }, {});
  });
}

function cleanupTalukaName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/\bTaluka\b/gi, '')
    .trim();
}

function isBaseTalukaRow(row) {
  const census2011 = String(row['Census 2011 code'] || row['Census 2011 Code'] || '').trim();
  const rawName = cleanupTalukaName(row['Sub-district Name'] || row['Sub-District Name'] || '');
  const name = RENAMED_SUBDISTRICTS[rawName] || rawName;
  const rawKey = rawName.toLowerCase();
  const nameKey = name.toLowerCase();
  if (!name) return false;
  if (NON_TALUKA_SUBDISTRICT_KEYS.has(rawKey) || NON_TALUKA_SUBDISTRICT_KEYS.has(nameKey)) return false;
  if (census2011 === '00000') return ZERO_CODE_TALUKA_KEYS.has(rawKey) || ZERO_CODE_TALUKA_KEYS.has(nameKey);
  if (/\b(city|rural)\b/i.test(rawName) && !RENAMED_SUBDISTRICTS[rawName]) return false;
  return true;
}

async function fetchBaseTalukas() {
  const response = await fetch(SUBDISTRICT_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Gujarat subdistrict CSV: ${response.status}`);
  }

  const rows = parseCsv(await response.text());
  const talukas = [];

  for (const row of rows) {
    const stateCode = String(row['State Code'] || '').trim();
    if (stateCode !== '24') continue;
    if (!isBaseTalukaRow(row)) continue;

    const districtName = normalizeDistrictName(row['District Name'] || row['District Name (In English)']);
    if (!districtName || districtName === 'Vav-Tharad') continue;

    const rawTalukaName = cleanupTalukaName(row['Sub-district Name'] || row['Sub-District Name']);
    const talukaName = RENAMED_SUBDISTRICTS[rawTalukaName] || rawTalukaName;
    if (!talukaName) continue;
    if (districtName === 'Banaskantha' && REMOVED_FROM_BANASKANTHA.has(talukaName)) continue;

    talukas.push({ districtName, nameEn: talukaName });
  }

  return talukas;
}

function applyLatestTalukaLayout(baseTalukas) {
  const byKey = new Map();

  for (const row of baseTalukas) {
    byKey.set(`${row.districtName}::${row.nameEn.toLowerCase()}`, row);
  }

  for (const [districtName, talukaNames] of Object.entries(NEW_TALUKAS_2025)) {
    for (const nameEn of talukaNames) {
      byKey.set(`${districtName}::${nameEn.toLowerCase()}`, { districtName, nameEn });
    }
  }

  return [...byKey.values()].sort((a, b) => {
    if (a.districtName !== b.districtName) return a.districtName.localeCompare(b.districtName);
    return a.nameEn.localeCompare(b.nameEn);
  });
}

function parseJsonText(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1].trim() : trimmed);
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required to sync Gujarat geography translations.');
  }
  return new GoogleGenAI({ apiKey });
}

async function translateTalukas(talukas) {
  const pending = talukas.filter((row) => !TALUKA_TRANSLATION_OVERRIDE_MAP.get(row.nameEn.toLowerCase()));
  if (!pending.length) return [];

  const ai = getAiClient();
  const translated = [];

  for (let index = 0; index < pending.length; index += 25) {
    const batch = pending.slice(index, index + 25);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'Transliterate these Gujarat taluka names from English into Gujarati script and Hindi script.',
                'Use standard administrative spellings for Gujarat place names.',
                'Return JSON only with this exact shape: { "items": [{ "nameEn": "...", "nameGu": "...", "nameHi": "..." }] }',
                JSON.stringify(batch.map((row) => row.nameEn)),
              ].join('\n\n'),
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: TRANSLATION_SCHEMA,
      },
    });

    const parsed = parseJsonText(response.text);
    translated.push(...(parsed.items || []));
  }

  return translated;
}

async function buildTalukaRows() {
  const baseTalukas = await fetchBaseTalukas();
  const latestTalukas = applyLatestTalukaLayout(baseTalukas);
  const aiRows = await translateTalukas(latestTalukas);
  const aiByName = new Map(aiRows.map((row) => [row.nameEn, row]));

  return latestTalukas.map((row) => {
    const district = DISTRICT_BY_NAME.get(row.districtName);
    const override = TALUKA_TRANSLATION_OVERRIDE_MAP.get(row.nameEn.toLowerCase());
    const translated = override || aiByName.get(row.nameEn);

    if (!district) {
      throw new Error(`Unknown district for taluka ${row.nameEn}: ${row.districtName}`);
    }
    if (!translated?.nameGu || !translated?.nameHi) {
      throw new Error(`Missing Gujarati/Hindi translation for taluka ${row.nameEn}`);
    }

    return {
      districtId: district.id,
      nameEn: row.nameEn,
      nameGu: translated.nameGu,
      nameHi: translated.nameHi,
    };
  });
}

async function ensureDistrictSchema() {
  const districtColumns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM districts LIKE 'name_hi'`);
  if (!districtColumns.length) {
    await prisma.$executeRawUnsafe(`ALTER TABLE districts ADD COLUMN name_hi VARCHAR(128) NULL`);
  }

  const talukaTables = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE 'talukas'`);
  if (!talukaTables.length) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE talukas (
        id INT NOT NULL AUTO_INCREMENT,
        district_id INT NOT NULL,
        name_en VARCHAR(128) NOT NULL,
        name_gu VARCHAR(128) NOT NULL,
        name_hi VARCHAR(128) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY talukas_district_id_name_en_key (district_id, name_en),
        UNIQUE KEY talukas_district_id_name_gu_key (district_id, name_gu),
        KEY talukas_district_id_idx (district_id),
        CONSTRAINT talukas_district_id_fkey FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  }
}

async function syncDistricts() {
  for (const district of GUJARAT_DISTRICTS) {
    await prisma.district.upsert({
      where: { id: district.id },
      update: district,
      create: district,
    });
  }
}

async function syncTalukas(rows) {
  await prisma.$transaction(async (tx) => {
    await tx.taluka.deleteMany();
    await tx.taluka.createMany({ data: rows });
  });
}

async function main() {
  await ensureDistrictSchema();
  await syncDistricts();
  const talukas = await buildTalukaRows();
  await syncTalukas(talukas);

  const districtCount = await prisma.district.count();
  const talukaCount = await prisma.taluka.count();

  console.log(
    JSON.stringify(
      {
        districtsSeeded: districtCount,
        talukasSeeded: talukaCount,
        sampleTalukas: await prisma.taluka.findMany({
          take: 5,
          orderBy: [{ districtId: 'asc' }, { nameEn: 'asc' }],
          select: {
            districtId: true,
            nameEn: true,
            nameGu: true,
            nameHi: true,
          },
        }),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma error ${error.code}: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
