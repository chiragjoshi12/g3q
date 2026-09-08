export const BETA_LEADERBOARD_TALUKA = 'અમદાવાદ';

function entry(rank, name, institute, grade, bestPercentage, taluka = BETA_LEADERBOARD_TALUKA) {
  return {
    rank,
    userId: `beta_lb_${String(rank).padStart(2, '0')}_${name.length}`,
    name,
    institute,
    grade,
    taluka,
    district: 'અમદાવાદ',
    bestPercentage,
    totalCorrect: Math.max(5, Math.round((bestPercentage / 100) * 15)),
    totalWrong: Math.max(0, 15 - Math.round((bestPercentage / 100) * 15)),
    totalTimeMs: 60000 + rank * 3200,
    sessionsCompleted: 1,
    you: false,
  };
}

export const BETA_SCHOOL_LEADERBOARD = [
  entry(1, 'દેવ પટેલ', 'શ્રી સરસ્વતી વિદ્યાલય, અમદાવાદ', 'ધોરણ 10', 98),
  entry(2, 'જિયા શાહ', 'કેન્દ્રીય વિદ્યાલય, ગાંધીનગર', 'ધોરણ 9', 96),
  entry(3, 'હાર્દિક ચૌધરી', 'સરકારી હાઇસ્કૂલ, મહેસાણા', 'ધોરણ 11', 95),
  entry(4, 'કિયા દવે', 'શ્રી કે.કે. વિદ્યામંદિર, સુરત', 'ધોરણ 8', 93),
  entry(5, 'અંશ ઠાકર', 'મોડર્ન સ્કૂલ, રાજકોટ', 'ધોરણ 10', 92),
  entry(6, 'માહી સોની', 'જ્ઞાનદીપ શાળા, વડોદરા', 'ધોરણ 9', 91),
  entry(7, 'પ્રણવ જોષી', 'શ્રી સ્વામિનારાયણ સ્કૂલ, ભાવનગર', 'ધોરણ 8', 89),
  entry(8, 'ધ્વની પરીખ', 'અદિત્ય વિદ્યાલય, આણંદ', 'ધોરણ 10', 88),
  entry(9, 'યશ પંચાલ', 'નગર પ્રાથમિક શાળા, પાલનપુર', 'ધોરણ 7', 86),
  entry(10, 'હેના પટેલ', 'શ્રી વિદ્યા મંદિર, નડિયાદ', 'ધોરણ 9', 85),
];

export const BETA_COLLEGE_LEADERBOARD = [
  entry(1, 'મીરા શાહ', 'સરકારી વિનયન કૉલેજ, ગાંધીનગર', 'બી.એ. - સેમેસ્ટર 4', 99),
  entry(2, 'કરણ ઠક્કર', 'એલ.ડી. ઇજનેરી કૉલેજ, અમદાવાદ', 'બી.ઈ. - સેમેસ્ટર 6', 97),
  entry(3, 'પૂર્વી દેસાઈ', 'એમ.એસ. યુનિવર્સિટી, વડોદરા', 'બી.કોમ. - સેમેસ્ટર 2', 96),
  entry(4, 'રોહન ત્રિવેદી', 'વી.એન.એસ.જી.યુ., સુરત', 'બી.ટેક. - સેમેસ્ટર 5', 95),
  entry(5, 'સ્મિતા રાવળ', 'ગુજરાત યુનિવર્સિટી, અમદાવાદ', 'એમ.એ. - સેમેસ્ટર 1', 93),
  entry(6, 'જયદીપ સોલંકી', 'સૌરાષ્ટ્ર યુનિવર્સિટી, રાજકોટ', 'બી.એસસી. - સેમેસ્ટર 3', 92),
  entry(7, 'ઇશા વોરા', 'એસ.પી. યુનિવર્સિટી, વિદ્યાનગર', 'બી.બી.એ. - સેમેસ્ટર 4', 90),
  entry(8, 'મિતેશ ચાવડા', 'હેમચંદ્રાચાર્ય યુનિવર્સિટી, પાટણ', 'બી.એડ. - સેમેસ્ટર 1', 89),
  entry(9, 'કાજલ પંચાલ', 'ભાવનગર યુનિવર્સિટી, ભાવનગર', 'બી.કોમ. - સેમેસ્ટર 6', 88),
  entry(10, 'નિલય ભટ્ટ', 'કચ્છ યુનિવર્સિટી, ભૂજ', 'બી.એ. - સેમેસ્ટર 5', 86),
];

export const BETA_CITIZEN_LEADERBOARD = [
  entry(1, 'રાજેશ પટેલ', 'Beta Quiz Participant', 'ઘાટલોડિયા', 97, 'ઘાટલોડિયા'),
  entry(2, 'સીમા દેસાઈ', 'Beta Quiz Participant', 'મણિનગર', 95, 'મણિનગર'),
  entry(3, 'વિક્રમ શાહ', 'Beta Quiz Participant', 'ચાંદખેડા', 94, 'ચાંદખેડા'),
  entry(4, 'પ્રિયા જોષી', 'Beta Quiz Participant', 'સાણંદ', 92, 'સાણંદ'),
  entry(5, 'અમિત ઠાકોર', 'Beta Quiz Participant', 'બાવળા', 90, 'બાવળા'),
  entry(6, 'નયના મહેતા', 'Beta Quiz Participant', 'દસ્ક્રોઇ', 89, 'દસ્ક્રોઇ'),
  entry(7, 'હર્ષ રાઠોડ', 'Beta Quiz Participant', 'ધોળકા', 87, 'ધોળકા'),
  entry(8, 'કિરણ ચૌહાણ', 'Beta Quiz Participant', 'ધંધૂકા', 86, 'ધંધૂકા'),
  entry(9, 'દીપક સોલંકી', 'Beta Quiz Participant', 'વીરમગામ', 84, 'વીરમગામ'),
  entry(10, 'મનીષા વ્યાસ', 'Beta Quiz Participant', 'દેતરોજ', 83, 'દેતરોજ'),
];
