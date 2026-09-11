-- Seed canonical departments + beta extras, backfill question_roots.department_id, drop denormalized dept columns

INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (1, 'general-knowledge', 'General Knowledge', 'સામાન્ય જ્ઞાન', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (2, 'education', 'Education', 'શિક્ષણ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (3, 'science-technology', 'Science and Technology', 'વિજ્ઞાન અને ટેકનોલોજી', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (4, 'governance-law-legislature', 'Governance, Law and Legislature', 'શાસન, કાનૂન અને વિધાન', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (5, 'home-affairs', 'Home Affairs', 'ગૃહ વિભાગ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (6, 'history-culture', 'History and Culture', 'ઇતિહાસ અને સંસ્કૃતિ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (7, 'economics-finance', 'Economics and Finance', 'અર્થશાસ્ત્ર અને નાણા', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (8, 'food-civil-supplies', 'Food and Civil Supplies', 'ખાદ્ય અને નાગરિક પુરવઠો', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (9, 'environment-climate-forest', 'Environment, Climate and Forest', 'પર્યાવરણ, હવામાન અને વન', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (10, 'energy-petrochemicals', 'Energy and Petrochemicals', 'ઊર્જા અને પેટ્રોકેમિકલ્સ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (11, 'industry-labour', 'Industry and Labour', 'ઉદ્યોગ અને શ્રમ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (12, 'social-justice-empowerment', 'Social Justice and Empowerment', 'સામાજિક ન્યાય અને અધિકારીતા', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (13, 'women-child-development', 'Women and Child Development', 'મહિલા અને બાળ વિકાસ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (14, 'revenue', 'Revenue', 'મહેસૂલ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (15, 'rural-urban-development', 'Rural and Urban Development', 'ગ્રામીણ અને શહેરી વિકાસ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (16, 'narmada-water-resources', 'Narmada and Water Resources', 'નર્મદા અને જળ સંસાધન', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (17, 'ports-transport-roads', 'Ports, Transport and Roads', 'બંદરો, પરિવહન અને માર્ગો', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (18, 'language-literature', 'Language and Literature', 'ભાષા અને સાહિત્ય', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (19, 'tribal-development', 'Tribal Development', 'આદિજાતિ વિકાસ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (20, 'youth-sports', 'Youth and Sports', 'યુવા અને રમતગમત', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (21, 'computer-digital', 'Computer and Digital', 'કમ્પ્યુટર અને ડિજિટલ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (22, 'biology', 'Biology', 'જીવવિજ્ઞાન', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (23, 'chemistry', 'Chemistry', 'રસાયણશાસ્ત્ર', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (24, 'physics', 'Physics', 'ભૌતિકશાસ્ત્ર', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (25, 'mathematics', 'Mathematics', 'ગણિત', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (26, 'psychology-sociology', 'Psychology and Sociology', 'મનોજ્ઞાન અને સમાજશાસ્ત્ર', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (27, 'logical-reasoning', 'Logical Reasoning', 'તર્કશક્તિ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (28, 'agriculture', 'Agriculture', 'કૃષિ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (29, 'geography', 'Geography', 'ભૂગોળ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (30, 'health-family-welfare', 'Health and Family Welfare', 'આરોગ્ય અને પરિવાર કલ્યાણ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (31, 'defence', 'Defence', 'રક્ષા', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (32, 'mineral-natural-resources', 'Mineral and Natural Resources', 'ખનિજ અને કુદરતી સંસાધનો', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (33, 'tourism-pilgrimage', 'Tourism and Pilgrimage', 'પર્યટન અને યાત્રાધામ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (34, 'government-schemes-yojanas', 'Government Schemes and Yojanas', 'સરકારી યોજનાઓ', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), `key`=VALUES(`key`), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (35, 'beta-poverty-reduction', 'Poverty Reduction', 'Poverty Reduction', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), updated_at=VALUES(updated_at);
INSERT INTO departments (id, `key`, name_en, name_gu, created_at, updated_at) VALUES (36, 'beta-national-security-international-diplomacy', 'National Security & International Diplomacy', 'National Security & International Diplomacy', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_gu=VALUES(name_gu), updated_at=VALUES(updated_at);

-- Alias map for backfill
CREATE TABLE IF NOT EXISTS `_dept_alias_map` (
  `alias` VARCHAR(255) NOT NULL,
  `department_id` INT NOT NULL,
  PRIMARY KEY (`alias`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT IGNORE INTO `_dept_alias_map` (alias, department_id) VALUES
('General Knowledge', 1),
('સામાન્ય જ્ઞાન', 1),
('general-knowledge', 1),
('GK', 1),
('GK-1', 1),
('GK-2', 1),
('GK-3', 1),
('GK-4', 1),
('GK-5', 1),
('GK-6', 1),
('GK-7', 1),
('GK-8', 1),
('GK-9', 1),
('GK-10', 1),
('GK-11', 1),
('GK-12', 1),
('GK-13', 1),
('GK-14', 1),
('GK-15', 1),
('GK-16', 1),
('GK-17', 1),
('GK-18', 1),
('GK-20', 1),
('GK-21', 1),
('GK-22', 1),
('GK-23', 1),
('Current Affairs/GK', 1),
('Current affairs\\GK', 1),
('LATEST', 1),
('G20', 1),
('G 20', 1),
('Chandrayaan', 1),
('Chandrayaan, Historical events', 1),
('9 years', 1),
('9years', 1),
('NINE YEARS OF MODI GOVT.', 1),
('Load Test Department', 1),
('P.T', 1),
('Ayodhya mandir', 1),
('Paralympics', 1),
('Education', 2),
('શિક્ષણ', 2),
('education', 2),
('EDUACTION', 2),
('What is the primary focus of the G20 Education Summit 2023?', 2),
('Science and Technology', 3),
('વિજ્ઞાન અને ટેકનોલોજી', 3),
('science-technology', 3),
('Science', 3),
('GENERAL SCIENCE', 3),
('Science & Tech.', 3),
('SCIENCE & TECHNOLOGY', 3),
('SCIENCE AND TECHNOLOGY', 3),
('Education, Science and technology', 3),
('Edu, Sci and Techno', 3),
('Educ, Sci and tech', 3),
('Educ, Scie and tech', 3),
('શિક્ષણ, વિજ્ઞાન અને ટેકનોલોજી', 3),
('STEM-1', 3),
('Governance, Law and Legislature', 4),
('શાસન, કાનૂન અને વિધાન', 4),
('governance-law-legislature', 4),
('Constitution', 4),
('CONSTITUSTION', 4),
('Legal', 4),
('Legislative', 4),
('Legislature', 4),
('Parliament', 4),
('PARLIAMENT LEGAL', 4),
('Legal& Home', 4),
('Legal Home Parliament Legislative', 4),
('Home Legal legislative', 4),
('Home,Legal,GAD,Legislative', 4),
('GAD', 4),
('કાનુન', 4),
('વિધાનસભા', 4),
('સંસદ', 4),
('Home Affairs', 5),
('ગૃહ વિભાગ', 5),
('home-affairs', 5),
('Home', 5),
('HOME DEPARTMENT', 5),
('HOME MINISTRY', 5),
('MHA', 5),
('Ministry of Home Affairs', 5),
('HOME LEGAL', 5),
('History and Culture', 6),
('ઇતિહાસ અને સંસ્કૃતિ', 6),
('history-culture', 6),
('HISTORY', 6),
('CULTURE AND HISTORY', 6),
('HISTORY & CULTURE', 6),
('HISTORY AND CULTURE', 6),
('ITIHAS (RAMAYANA-MAHABHARAT)', 6),
('ITIHAS: RAMAYAN- MAHABHARAT', 6),
('Freedom Fighters of India', 6),
('IKS', 6),
('Economics and Finance', 7),
('અર્થશાસ્ત્ર અને નાણા', 7),
('economics-finance', 7),
('ECONOMICS', 7),
('Ecolnomics', 7),
('FINANCE', 7),
('Food and Civil Supplies', 8),
('ખાદ્ય અને નાગરિક પુરવઠો', 8),
('food-civil-supplies', 8),
('Food & Civil Suppl.', 8),
('Food & civil supplies', 8),
('FOOD AND CIVIL', 8),
('Environment, Climate and Forest', 9),
('પર્યાવરણ, હવામાન અને વન', 9),
('environment-climate-forest', 9),
('Environment', 9),
('Forest', 9),
('FOREST AND ENVIRONMENT', 9),
('CLIMATE', 9),
('climate change', 9),
('Climent Change', 9),
('FOREST', 9),
('Energy and Petrochemicals', 10),
('ઊર્જા અને પેટ્રોકેમિકલ્સ', 10),
('energy-petrochemicals', 10),
('ENERGY', 10),
('Energy & Petrochemicals', 10),
('Petro-Chemical & Energy', 10),
('Industry and Labour', 11),
('ઉદ્યોગ અને શ્રમ', 11),
('industry-labour', 11),
('Industry', 11),
('Labour', 11),
('LABOUR AND EMPLOYMENT', 11),
('Department of Industry, Vibrant Gujarat, Labor and Employment & Finance', 11),
('ઉદ્યોગ, વાઇબ્રન્ટ ગુજરાત, શ્રમ અને રોજગાર & નાણાં વિભાગ', 11),
('ઉદ્યોગ, વાયબ્રન્ટ ગુજરાત, શ્રમ અને રોજગાર, અને નાણા વિભાગ', 11),
('KUTIR', 11),
('Kutir Udyog', 11),
('નિયામક, ઔધીગિક સલામતી અને સ્વાસ્થ્ય,ગુજરાત રાજ્ય', 11),
('Social Justice and Empowerment', 12),
('સામાજિક ન્યાય અને અધિકારીતા', 12),
('social-justice-empowerment', 12),
('Department of Social Justice and Empowerment', 12),
('મહિલા બાળ વિભાગ અને સામાજિક ન્યાય', 12),
('Women and Child Development', 13),
('મહિલા અને બાળ વિકાસ', 13),
('women-child-development', 13),
('Women and Child', 13),
('Women and Child development', 13),
('મહિલા અને બાળ', 13),
('Revenue', 14),
('મહેસૂલ', 14),
('revenue', 14),
('Revanue', 14),
('Revenue Department', 14),
('Revenue DEPTT', 14),
('મહેસુલ વિભાગ', 14),
('Rural and Urban Development', 15),
('ગ્રામીણ અને શહેરી વિકાસ', 15),
('rural-urban-development', 15),
('Panchayat & RD', 15),
('Panchayat & Rural Development', 15),
('Panchayat Rural and Urban', 15),
('Rural and Urban development', 15),
('URBAN DEVELOPMENT', 15),
('ગ્રામ્ય અને શહેરી વિકાસ', 15),
('Narmada and Water Resources', 16),
('નર્મદા અને જળ સંસાધન', 16),
('narmada-water-resources', 16),
('Narmada', 16),
('NARMADA & WATER RESOURCES', 16),
('NARMADA AND WATER RESOURCES', 16),
('Narmada, Water, Urban Development', 16),
('Narmada, water, urban devpmt', 16),
('Ports, Transport and Roads', 17),
('બંદરો, પરિવહન અને માર્ગો', 17),
('ports-transport-roads', 17),
('Port and Transport', 17),
('PORT TRANSPORT', 17),
('PORT TRANSPORT, ROADS AND BUILDINGS', 17),
('Road & Building', 17),
('Road and building', 17),
('Language and Literature', 18),
('ભાષા અને સાહિત્ય', 18),
('language-literature', 18),
('MATRUBHASHA ANE KOSH', 18),
('Mother Tongue and Dictionary', 18),
('માતૃભાષા અને શબ્દકોશ', 18),
('Sanskrit', 18),
('Sasnkrit', 18),
('Tribal Development', 19),
('આદિજાતિ વિકાસ', 19),
('tribal-development', 19),
('tribal', 19),
('TRIBAL DEVELOPMENT', 19),
('Youth and Sports', 20),
('યુવા અને રમતગમત', 20),
('youth-sports', 20),
('Youth', 20),
('યુથ', 20),
('sports', 20),
('Computer and Digital', 21),
('કમ્પ્યુટર અને ડિજિટલ', 21),
('computer-digital', 21),
('Digital India', 21),
('Computer', 21),
('Information-Broadcasting', 21),
('Biology', 22),
('જીવવિજ્ઞાન', 22),
('biology', 22),
('Chemistry', 23),
('રસાયણશાસ્ત્ર', 23),
('chemistry', 23),
('Physics', 24),
('ભૌતિકશાસ્ત્ર', 24),
('physics', 24),
('Mathematics', 25),
('ગણિત', 25),
('mathematics', 25),
('Psychology and Sociology', 26),
('મનોજ્ઞાન અને સમાજશાસ્ત્ર', 26),
('psychology-sociology', 26),
('Psychology', 26),
('sociology', 26),
('Logical Reasoning', 27),
('તર્કશક્તિ', 27),
('logical-reasoning', 27),
('Agriculture', 28),
('કૃષિ', 28),
('agriculture', 28),
('KRUSHI', 28),
('Geography', 29),
('ભૂગોળ', 29),
('geography', 29),
('GEOGRAPHY', 29),
('Health and Family Welfare', 30),
('આરોગ્ય અને પરિવાર કલ્યાણ', 30),
('health-family-welfare', 30),
('Health', 30),
('Defence', 31),
('રક્ષા', 31),
('defence', 31),
('Mineral and Natural Resources', 32),
('ખનિજ અને કુદરતી સંસાધનો', 32),
('mineral-natural-resources', 32),
('MINERAL AND NATURAL RESOURCES', 32),
('Tourism and Pilgrimage', 33),
('પર્યટન અને યાત્રાધામ', 33),
('tourism-pilgrimage', 33),
('Gujarat Pavitra Yatradham Vikas Board', 33),
('Government Schemes and Yojanas', 34),
('સરકારી યોજનાઓ', 34),
('government-schemes-yojanas', 34),
('Gov. yojana & scheme', 34),
('STRIDE YOJANA', 34),
('Digital India', 21),
('Finance', 7),
('Poverty Reduction', 35),
('Industry, Manufacturing & Energy', 10),
('Industry, Manufacturing & Energy (e.g., Startup India, Make in India)', 10),
('Railway, Road & Infrastructure', 17),
('Science & Tech', 3),
('Science & Tech (e.g., ISRO achievements)', 3),
('Social & Women Empowerment', 13),
('Health', 30),
('Agriculture', 28),
('National Security & International Diplomacy', 36),
('National Security & International Diplomacy (e.g., foreign policy)', 36);

-- Backfill department_id (separate joins — MySQL cannot reopen a temp/alias map twice)
UPDATE question_roots qr
INNER JOIN `_dept_alias_map` m ON m.alias = qr.department_en
SET qr.department_id = m.department_id
WHERE qr.department_id IS NULL;

UPDATE question_roots qr
INNER JOIN `_dept_alias_map` m ON m.alias = qr.department_gu
SET qr.department_id = m.department_id
WHERE qr.department_id IS NULL;

UPDATE question_roots
SET department_id = CASE beta_department_id
  WHEN 1 THEN 21
  WHEN 2 THEN 7
  WHEN 3 THEN 35
  WHEN 4 THEN 10
  WHEN 5 THEN 17
  WHEN 6 THEN 3
  WHEN 7 THEN 13
  WHEN 8 THEN 30
  WHEN 9 THEN 28
  WHEN 10 THEN 36
  ELSE department_id
END
WHERE department_id IS NULL AND beta_department_id IS NOT NULL;

-- Fallback remaining nulls to General Knowledge (id=1)
UPDATE question_roots SET department_id = 1 WHERE department_id IS NULL;

DROP TABLE IF EXISTS `_dept_alias_map`;



-- Copy beta quiz images onto unified departments (beta_department_id -> department_id map)
INSERT INTO department_quiz_images (department_id, style, image_url, is_active, created_at, updated_at)
SELECT
  CASE beta_department_id
    WHEN 1 THEN 21
    WHEN 2 THEN 7
    WHEN 3 THEN 35
    WHEN 4 THEN 10
    WHEN 5 THEN 17
    WHEN 6 THEN 3
    WHEN 7 THEN 13
    WHEN 8 THEN 30
    WHEN 9 THEN 28
    WHEN 10 THEN 36
    ELSE NULL
  END AS department_id,
  style,
  image_url,
  is_active,
  created_at,
  updated_at
FROM beta_department_quiz_images
WHERE beta_department_id BETWEEN 1 AND 10
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  updated_at = VALUES(updated_at);

-- Drop denormalized / beta FK columns from question_roots
ALTER TABLE question_roots DROP FOREIGN KEY question_roots_beta_department_id_fkey;
ALTER TABLE question_roots DROP INDEX question_roots_beta_department_id_idx;
ALTER TABLE question_roots DROP COLUMN beta_department_id, DROP COLUMN department_gu, DROP COLUMN department_en;