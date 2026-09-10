export const LANGUAGE = {
  GUJARATI: "gu",
  ENGLISH: "en",
  HINDI: "hi",
};

export const DEFAULT_LANGUAGE = LANGUAGE.GUJARATI;

/** Single language catalog for mobile and desktop. */
export const LANGUAGE_INFO = {
  [LANGUAGE.GUJARATI]: {
    id: LANGUAGE.GUJARATI,
    nativeLabel: "ગુજરાતી",
    englishLabel: "Gujarati",
    glyph: "ગા",
    iconSrc: "/language/gujarati.png",
    iconBg: "bg-[#d68049]",
    panelBg: "bg-[#fde8d4]",
    cardGradient: "from-[#fce0c4] via-[#fdecdc] to-[#fff6ee]",
    htmlLang: "gu",
    locale: "gu-IN",
    speechLocale: "gu-IN",
  },
  [LANGUAGE.ENGLISH]: {
    id: LANGUAGE.ENGLISH,
    nativeLabel: "English",
    englishLabel: "English",
    glyph: "E",
    iconSrc: "/language/english.png",
    iconBg: "bg-[#4075a3]",
    panelBg: "bg-[#dce6f0]",
    cardGradient: "from-[#d0deec] via-[#e2ebf4] to-[#f3f7fb]",
    htmlLang: "en",
    locale: "en-IN",
    speechLocale: "en-IN",
  },
  [LANGUAGE.HINDI]: {
    id: LANGUAGE.HINDI,
    nativeLabel: "हिंदी",
    englishLabel: "Hindi",
    glyph: "हिं",
    iconSrc: "/language/hindi.png",
    iconBg: "bg-[#2a855f]",
    panelBg: "bg-[#d5eee2]",
    cardGradient: "from-[#c8e8d8] via-[#dcefe4] to-[#eef8f2]",
    htmlLang: "hi",
    locale: "hi-IN",
    speechLocale: "hi-IN",
  },
};

export const LANGUAGE_OPTIONS = [
  LANGUAGE_INFO[LANGUAGE.GUJARATI],
  LANGUAGE_INFO[LANGUAGE.ENGLISH],
  LANGUAGE_INFO[LANGUAGE.HINDI],
];

export const LANGUAGE_META = Object.fromEntries(
  LANGUAGE_OPTIONS.map(({ id, htmlLang, locale, speechLocale }) => [
    id,
    { htmlLang, locale, speechLocale },
  ])
);
