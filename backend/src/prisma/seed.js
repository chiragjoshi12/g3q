import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mirrors gujarat-gov-quiz/data/*.json exactly, so the seeded backend
// reproduces the same login codes, quiz and questions the frontend's local
// JSON data source already ships with.

const users = {
  students: [
    {
      id: 'stu_1',
      role: 'student',
      udiseCode: '24010100101',
      name: 'રિયા પટેલ',
      institute: 'શ્રી સરસ્વતી વિદ્યાલય, અમદાવાદ',
      schoolId: '24070608844',
      grade: 'ધોરણ 10',
      district: 'અમદાવાદ',
      taluka: 'DASCROI',
      phone: '+91 98765 43210',
      joinedOn: '2025-06-12',
    },
    {
      id: 'stu_2',
      role: 'student',
      udiseCode: '24020200202',
      name: 'હાર્દિક ચૌધરી',
      institute: 'સરકારી માધ્યમિક શાળા, મહેસાણા',
      schoolId: '24020200202',
      grade: 'ધોરણ 12',
      district: 'મહેસાણા',
      taluka: 'MEHSANA',
      phone: '+91 91234 56780',
      joinedOn: '2025-07-02',
    },
  ],
  colleges: [
    {
      id: 'col_1',
      role: 'college',
      abcId: '123456789012',
      name: 'મીરા શાહ',
      institute: 'સરકારી વિનયન કૉલેજ, ગાંધીનગર',
      grade: 'બી.એ. — સેમેસ્ટર 4',
      district: 'ગાંધીનગર',
      phone: '+91 99887 76655',
      joinedOn: '2025-05-20',
    },
    {
      id: 'col_2',
      role: 'college',
      abcId: '987654321098',
      name: 'કરણ ઠક્કર',
      institute: 'એલ. ડી. ઇજનેરી કૉલેજ, અમદાવાદ',
      grade: 'બી.ઈ. — સેમેસ્ટર 6',
      district: 'અમદાવાદ',
      phone: '+91 90909 10101',
      joinedOn: '2025-08-01',
    },
  ],
};

const quizzes = [
  {
    id: 'quiz_gujarat_gk',
    title: 'ગુજરાત સામાન્ય જ્ઞાન',
    subtitle: 'ઇતિહાસ, ભૂગોળ અને સંસ્કૃતિ',
    description:
      'ગુજરાતના ઇતિહાસ, ભૂગોળ, વારસો અને સંસ્કૃતિ પર આધારિત મિશ્ર પ્રકારની પ્રશ્નોત્તરી. દરેક પ્રશ્ન પછી વિગતવાર સમજૂતી મળશે.',
    banner: 'https://i.ibb.co/r2RnQjZB/q3quiz.png',
    category: 'સામાન્ય જ્ઞાન',
    level: 'મધ્યમ',
    totalQuestions: 6,
    durationMinutes: 8,
    totalPoints: 6,
    featured: true,
    tags: ['ગુજરાત', 'ઇતિહાસ', 'ભૂગોળ'],
  },
];

const questions = {
  quiz_gujarat_gk: [
    {
      id: 'q1',
      order: 1,
      type: 'single_choice',
      points: 1,
      prompt: 'ગુજરાત રાજ્યની રાજધાની કયું શહેર છે?',
      options: [
        { id: 'a', label: 'અમદાવાદ' },
        { id: 'b', label: 'ગાંધીનગર' },
        { id: 'c', label: 'સુરત' },
        { id: 'd', label: 'વડોદરા' },
      ],
      answer: ['b'],
    },
    {
      id: 'q3',
      order: 2,
      type: 'match_following',
      points: 1,
      prompt: 'નીચેના સ્થળોને તેમના જિલ્લા સાથે જોડો.',
      left: [
        { id: 'l1', label: 'સ્ટેચ્યુ ઓફ યુનિટી' },
        { id: 'l2', label: 'રાણી કી વાવ' },
        { id: 'l3', label: 'સાબરમતી આશ્રમ' },
        { id: 'l4', label: 'દ્વારકાધીશ મંદિર' },
      ],
      right: [
        { id: 'r1', label: 'પાટણ' },
        { id: 'r2', label: 'દેવભૂમિ દ્વારકા' },
        { id: 'r3', label: 'નર્મદા' },
        { id: 'r4', label: 'અમદાવાદ' },
      ],
      answer: { l1: 'r3', l2: 'r1', l3: 'r4', l4: 'r2' },
    },
    {
      id: 'q4',
      order: 3,
      type: 'image_choice',
      points: 1,
      prompt: "નીચેનામાંથી કયું ચિત્ર 'સ્ટેચ્યુ ઓફ યુનિટી' દર્શાવે છે?",
      options: [
        {
          id: 'a',
          label: 'સોમનાથ મંદિર',
          image:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Somanath_mandir_%28cropped%29.jpg/1280px-Somanath_mandir_%28cropped%29.jpg?utm_source=gu.wikipedia.org&utm_campaign=index&utm_content=thumbnail',
        },
        {
          id: 'b',
          label: 'સ્ટેચ્યુ ઓફ યુનિટી',
          image: 'https://static.abplive.com/wp-content/uploads/sites/7/2020/10/17132101/Statue-of-unity-open-today.jpg?impolicy=abp_cdn&imwidth=1200',
        },
        {
          id: 'c',
          label: 'રાણી કી વાવ',
          image: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Rani_ki_vav_02.jpg',
        },
        {
          id: 'd',
          label: 'એશિયાઈ સિંહ',
          image: 'https://gujarati.opindia.com/wp-content/uploads/sites/7/2023/08/Image-10-08-23-at-7.14-PM.jpeg',
        },
      ],
      answer: ['b'],
    },
    {
      id: 'q6',
      order: 4,
      type: 'drag_drop',
      points: 1,
      prompt: 'નીચેની ઘટનાઓને સમયક્રમ પ્રમાણે (જૂનીથી નવી) ગોઠવો.',
      items: [
        { id: 'i1', label: 'ગુજરાત રાજ્યની સ્થાપના' },
        { id: 'i2', label: 'સ્ટેચ્યુ ઓફ યુનિટીનું ઉદ્ઘાટન' },
        { id: 'i3', label: 'સોમનાથ મંદિરનું પુનઃનિર્માણ' },
        { id: 'i4', label: 'સરદાર સરોવર બંધનું લોકાર્પણ' },
      ],
      answer: ['i3', 'i1', 'i4', 'i2'],
    },
    {
      id: 'q7',
      order: 5,
      type: 'drag_into_blanks',
      points: 1,
      prompt: 'નીચે આપેલા શબ્દોને યોગ્ય ખાલી જગ્યામાં ખેંચીને ગોઠવો.',
      segments: [
        { type: 'text', value: 'ગુજરાતનું સૌથી મોટું શહેર' },
        { type: 'blank', id: 'b1' },
        { type: 'text', value: 'છે અને રાજ્યની સ્થાપના' },
        { type: 'blank', id: 'b2' },
        { type: 'text', value: 'માં થઈ હતી.' },
      ],
      bank: [
        { id: 'w1', label: 'સુરત' },
        { id: 'w2', label: 'અમદાવાદ' },
        { id: 'w3', label: '1947' },
        { id: 'w4', label: '1960' },
      ],
      answer: { b1: 'w2', b2: 'w4' },
    },
    {
      id: 'q8',
      order: 6,
      type: 'single_choice',
      points: 1,
      prompt: 'એશિયાઈ સિંહો માટે પ્રખ્યાત ગીર રાષ્ટ્રીય ઉદ્યાન મુખ્યત્વે કયા જિલ્લામાં આવેલું છે?',
      options: [
        { id: 'a', label: 'કચ્છ' },
        { id: 'b', label: 'ભરૂચ' },
        { id: 'c', label: 'જૂનાગઢ' },
        { id: 'd', label: 'વલસાડ' },
      ],
      answer: ['c'],
    },
  ],
};

const explanations = {
  q1: {
    model: 'GujaratGPT',
    summary: 'ગાંધીનગર ગુજરાતની રાજધાની છે.',
    body: "1 મે, 1960ના રોજ ગુજરાત રાજ્યની સ્થાપના થઈ ત્યારે શરૂઆતમાં અમદાવાદ કામચલાઉ રાજધાની હતું. ત્યાર બાદ સાબરમતી નદીના કિનારે આયોજનબદ્ધ રીતે નવું શહેર વસાવવામાં આવ્યું, જેને રાષ્ટ્રપિતા મહાત્મા ગાંધીના નામ પરથી 'ગાંધીનગર' નામ અપાયું. 1970થી ગાંધીનગર ગુજરાતની કાયમી રાજધાની છે. અમદાવાદ રાજ્યનું સૌથી મોટું શહેર અને આર્થિક કેન્દ્ર છે, પણ તે રાજધાની નથી.",
    keyPoints: [
      'ગુજરાતની સ્થાપના: 1 મે, 1960',
      'કાયમી રાજધાની ગાંધીનગર: 1970થી',
      'અમદાવાદ સૌથી મોટું શહેર છે, રાજધાની નહીં',
    ],
  },
  q3: {
    model: 'GujaratGPT',
    summary: 'દરેક સ્થળ તેના જિલ્લા સાથે આ રીતે જોડાય છે.',
    body: 'સ્ટેચ્યુ ઓફ યુનિટી નર્મદા જિલ્લામાં કેવડિયા ખાતે સરદાર સરોવર બંધ પાસે આવેલું છે. રાણી કી વાવ પાટણ જિલ્લામાં આવેલી 11મી સદીની વાવ છે, જેને યુનેસ્કો વર્લ્ડ હેરિટેજ સાઇટનો દરજ્જો મળેલો છે. સાબરમતી આશ્રમ અમદાવાદમાં સાબરમતી નદીના કિનારે આવેલો છે, જ્યાંથી ગાંધીજીએ દાંડીકૂચ શરૂ કરી હતી. દ્વારકાધીશ મંદિર દેવભૂમિ દ્વારકા જિલ્લામાં આવેલું છે અને તે ચાર ધામમાંનું એક છે.',
    keyPoints: [
      'સ્ટેચ્યુ ઓફ યુનિટી — નર્મદા (કેવડિયા)',
      'રાણી કી વાવ — પાટણ (યુનેસ્કો સાઇટ)',
      'સાબરમતી આશ્રમ — અમદાવાદ',
      'દ્વારકાધીશ મંદિર — દેવભૂમિ દ્વારકા',
    ],
  },
  q4: {
    model: 'GujaratGPT',
    summary: 'સરદાર પટેલની વિશાળ પ્રતિમા દર્શાવતું ચિત્ર સાચો જવાબ છે.',
    body: 'સ્ટેચ્યુ ઓફ યુનિટી સરદાર વલ્લભભાઈ પટેલની 182 મીટર ઊંચી પ્રતિમા છે, જે વિશ્વની સૌથી ઊંચી પ્રતિમા ગણાય છે. તેનું ઉદ્ઘાટન 31 ઓક્ટોબર, 2018ના રોજ થયું હતું. બાકીના વિકલ્પોમાં સોમનાથ મંદિર (શિખરવાળું મંદિર), રાણી કી વાવ (પગથિયાંવાળી વાવ) અને એશિયાઈ સિંહ (ગીરનું પ્રતીક) દર્શાવાયા છે.',
    keyPoints: [
      'ઊંચાઈ: 182 મીટર — વિશ્વની સૌથી ઊંચી પ્રતિમા',
      'ઉદ્ઘાટન: 31 ઓક્ટોબર, 2018',
      'સ્થળ: કેવડિયા, નર્મદા જિલ્લો',
    ],
  },
  q6: {
    model: 'GujaratGPT',
    summary: 'સાચો સમયક્રમ: સોમનાથ (1951) → ગુજરાત સ્થાપના (1960) → સરદાર સરોવર (2017) → સ્ટેચ્યુ ઓફ યુનિટી (2018).',
    body: 'આઝાદી પછી સરદાર પટેલની પહેલથી સોમનાથ મંદિરનું પુનઃનિર્માણ થયું અને 11 મે, 1951ના રોજ તેની પ્રાણપ્રતિષ્ઠા થઈ. ત્યાર બાદ મહાગુજરાત આંદોલનના પરિણામે 1 મે, 1960ના રોજ મુંબઈ રાજ્યમાંથી અલગ ગુજરાત રાજ્યની રચના થઈ. નર્મદા નદી પરના સરદાર સરોવર બંધનું લોકાર્પણ 17 સપ્ટેમ્બર, 2017ના રોજ થયું અને તેની નજીક જ 31 ઓક્ટોબર, 2018ના રોજ સ્ટેચ્યુ ઓફ યુનિટીનું ઉદ્ઘાટન થયું.',
    keyPoints: [
      '1951 — સોમનાથ મંદિરની પ્રાણપ્રતિષ્ઠા',
      '1960 — ગુજરાત રાજ્યની સ્થાપના',
      '2017 — સરદાર સરોવર બંધનું લોકાર્પણ',
      '2018 — સ્ટેચ્યુ ઓફ યુનિટીનું ઉદ્ઘાટન',
    ],
  },
  q7: {
    model: 'GujaratGPT',
    summary: 'સાચું વાક્ય: ગુજરાતનું સૌથી મોટું શહેર અમદાવાદ છે અને રાજ્યની સ્થાપના 1960માં થઈ હતી.',
    body: 'વસ્તી અને વિસ્તારની દૃષ્ટિએ અમદાવાદ ગુજરાતનું સૌથી મોટું શહેર છે. સુરત વસ્તીની દૃષ્ટિએ બીજા ક્રમે આવે છે અને હીરા તથા કાપડ ઉદ્યોગ માટે જાણીતું છે. 1947 એ ભારતની આઝાદીનું વર્ષ છે, જ્યારે ગુજરાત રાજ્યની અલગ રચના તેના તેર વર્ષ પછી 1 મે, 1960ના રોજ થઈ હતી.',
    keyPoints: [
      'અમદાવાદ — ગુજરાતનું સૌથી મોટું શહેર',
      'સુરત — વસ્તીમાં બીજા ક્રમે',
      '1947 આઝાદીનું વર્ષ, 1960 ગુજરાત સ્થાપનાનું',
    ],
  },
  q8: {
    model: 'GujaratGPT',
    summary: 'ગીર રાષ્ટ્રીય ઉદ્યાન મુખ્યત્વે જૂનાગઢ જિલ્લામાં આવેલું છે.',
    body: 'ગીર રાષ્ટ્રીય ઉદ્યાન અને અભયારણ્ય સૌરાષ્ટ્રમાં જૂનાગઢ જિલ્લામાં ફેલાયેલું છે અને તેનો કેટલોક ભાગ ગીર સોમનાથ તથા અમરેલી જિલ્લામાં પણ આવે છે. એશિયાઈ સિંહ (Panthera leo persica) આજે વિશ્વમાં કુદરતી રીતે માત્ર અહીં જ જોવા મળે છે, જેના કારણે ગીર ભારતનું અત્યંત મહત્ત્વનું સંરક્ષિત ક્ષેત્ર ગણાય છે.',
    keyPoints: [
      'મુખ્ય જિલ્લો: જૂનાગઢ',
      'એશિયાઈ સિંહનું વિશ્વમાં એકમાત્ર કુદરતી નિવાસસ્થાન',
      'સ્થાપના: 1965 (અભયારણ્ય)',
    ],
  },
};

async function seedUsers() {
  for (const user of [...users.students, ...users.colleges]) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { ...user, joinedOn: new Date(user.joinedOn) },
    });
  }
  console.log(`Seeded ${users.students.length + users.colleges.length} users.`);
}

async function seedQuizzes() {
  for (const quiz of quizzes) {
    await prisma.quiz.upsert({ where: { id: quiz.id }, update: quiz, create: quiz });

    for (const question of questions[quiz.id] ?? []) {
      await prisma.question.upsert({
        where: { id: question.id },
        update: { ...question, quizId: quiz.id },
        create: { ...question, quizId: quiz.id },
      });

      const explanation = explanations[question.id];
      if (explanation) {
        await prisma.explanation.upsert({
          where: { questionId: question.id },
          update: explanation,
          create: { ...explanation, questionId: question.id },
        });
      }
    }
  }
  console.log(`Seeded ${quizzes.length} quiz(zes) with questions and explanations.`);
}

async function seedAdminAndBank() {
  const { adminAuthService } = await import('../services/adminAuth.service.js');
  await adminAuthService.ensureMasterAdmin();
  console.log('Ensured master admin user.');

  const bankQuestions = [
    {
      queId: 'G3Q_Q_1',
      departmentGu: 'Education, Science and technology',
      departmentEn: 'Education, Science and technology',
      questionGu: 'આઈટી/આઈટીસ નીતિ (2022-27) હેઠળ, ડીબીટીનું પૂરું નામ શું છે ?',
      questionEn: 'Under IT/ITes Policy(2022-27), what is the full form of DBT?',
      optionAGu: 'ડાયરેક્ટ બિલ્ડિંગ ટ્રાન્સફર',
      optionBGu: 'ડાયરેક્ટ બેનિફિટ ટ્રાન્સફર',
      optionCGu: 'ડાયરેક્ટ બેનિફિટ ટ્રેડ',
      optionDGu: 'ડાયરેક્ટ બિઝનેસ ટ્રાન્સફર',
      optionAEn: 'Direct Building Transfer',
      optionBEn: 'Direct Benefit Transfer',
      optionCEn: 'Direct Benefit Trade',
      optionDEn: 'Direct Business Transfer',
      correctOption: 'B',
      scope: 'GENERAL',
      district: null,
      casteCategory: 'GENERAL',
    },
    {
      queId: 'G3Q_Q_2',
      departmentGu: 'શિક્ષણ, વિજ્ઞાન અને ટેકનોલોજી',
      departmentEn: 'Education, Science and technology',
      questionGu: "ઇન્ટરનેટના સંદર્ભમાં 'યુઆરએલ' નો અર્થ શું છે ?",
      questionEn: 'What does "URL" stand for in the context of the internet?',
      optionAGu: 'યુઝર રીક્વેસ્ટેડ લિંક',
      optionBGu: 'યુનિફોર્મ રજિસ્ટ્રેશન લોગ',
      optionCGu: 'યુનિફોર્મ રીસોર્સ લોકેટર',
      optionDGu: 'યુનિવર્સલ રેકોર્ડ લિંક',
      optionAEn: 'User Requested Link',
      optionBEn: 'Uniform Registration Log',
      optionCEn: 'Uniform Resource Locator',
      optionDEn: 'Universal Record Link',
      correctOption: 'C',
      scope: 'GENERAL',
      district: null,
      casteCategory: 'GENERAL',
    },
    {
      queId: 'G3Q_Q_3',
      departmentGu: 'શિક્ષણ, વિજ્ઞાન અને ટેકનોલોજી',
      departmentEn: 'Education, Science and technology',
      questionGu:
        'તમારા ગામની શાળામાં ધોરણ-૯માં ભણતી અનુસૂચિત જાતિની વિદ્યાર્થીનીઓને અભ્યાસમાં સરળતા રહે તે માટે સરકાર દ્વારા કઈ યોજના હેઠળ સાયકલ આપવામાં આવે છે?',
      questionEn:
        'Under which scheme does the government provide bicycles to SC girls studying in Std 9 to make their commute to school easier?',
      optionAGu: 'અનુસૂચિત જાતિની કન્યાઓને મફત શિક્ષણ પૂરું પાડવું',
      optionBGu: 'સરસ્વતી સાધના યોજના',
      optionCGu: 'અનુસૂચિત જાતિના પરિવારોને આર્થિક સહાય પૂરી પાડવી',
      optionDGu: 'કૉલેજના વિદ્યાર્થીઓને શિષ્યવૃત્તિ આપવી',
      optionAEn: 'Providing free education to SC girls',
      optionBEn: 'Sarasvati Sadhana Yojana',
      optionCEn: 'Offering financial assistance to SC families',
      optionDEn: 'Providing scholarships to college students',
      correctOption: 'B',
      scope: 'TARGETED',
      district: null,
      casteCategory: 'SC',
    },
    {
      queId: 'G3Q_Q_4',
      departmentGu: 'Education, Science and technology',
      departmentEn: 'Education, Science and technology',
      questionGu:
        "સમગ્ર શિક્ષા ગુજરાત દ્વારા 'બેટી બચાઓ બેટી પઢાઓ' અભિયાન અંતર્ગત 'દીકરીની સલામ દેશને નામ' કાર્યક્રમની ઉજવણી ક્યારે કરવામાં આવે છે?",
      questionEn:
        "When is the 'Dikri Ni Salam Desh Ne Naam' program celebrated by Samagra Shiksha Gujarat under the 'Beti Bachao Beti Padhao' campaign?",
      optionAGu: '26મી જાન્યુઆરી',
      optionBGu: '15મી ઑગસ્ટ',
      optionCGu: '5મી ઑગસ્ટ',
      optionDGu: '20મી જાન્યુઆરી',
      optionAEn: '26th January',
      optionBEn: '15th August',
      optionCEn: '5th August',
      optionDEn: '20th January',
      correctOption: 'A',
      scope: 'GENERAL',
      district: null,
      casteCategory: 'GENERAL',
    },
    {
      queId: 'G3Q_Q_47',
      departmentGu: 'Freedom Fighters of India',
      departmentEn: 'Freedom Fighters of India',
      questionGu: 'સરદાર પટેલ સ્મારક ભવન અમદાવાદમાં કઈ જગ્યાએ આવેલું છે ?',
      questionEn: 'Sardar Patel Memorial Bhavan is located in which place in Ahmedabad?',
      optionAGu: 'શાહપુર',
      optionBGu: 'શાહીબાગ',
      optionCGu: 'પાલડી',
      optionDGu: 'વાસણા',
      optionAEn: 'Shahpur',
      optionBEn: 'Shahibag',
      optionCEn: 'Paldi',
      optionDEn: 'Vasana',
      correctOption: 'B',
      scope: 'TARGETED',
      district: 'Ahmedabad',
      casteCategory: 'GENERAL',
    },
  ];

  for (const q of bankQuestions) {
    await prisma.bankQuestion.upsert({
      where: { queId: q.queId },
      update: {},
      create: q,
    });
  }
  console.log(`Seeded ${bankQuestions.length} bank questions.`);
}

async function main() {
  await seedUsers();
  await seedQuizzes();
  await seedAdminAndBank();
  // Roster sample from admin/students.json (30 students).
  const { spawnSync } = await import('child_process');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const script = path.resolve(here, '../../scripts/import-students.js');
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error('import-students failed during seed');
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
