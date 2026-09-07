export const LANGUAGE = {
  GUJARATI: "gu",
  ENGLISH: "en",
  HINDI: "hi",
};

export const DEFAULT_LANGUAGE = LANGUAGE.GUJARATI;

export const LANGUAGE_OPTIONS = [
  {
    id: LANGUAGE.GUJARATI,
    nativeLabel: "ગુજરાતી",
    englishLabel: "Gujarati",
    iconSrc: "/language/gujarati.png",
    cardClassName: "from-[#e4f6f1] via-[#edf9f6] to-[#f8fbfa]",
  },
  {
    id: LANGUAGE.ENGLISH,
    nativeLabel: "English",
    englishLabel: "English",
    iconSrc: "/language/english.png",
    cardClassName: "from-[#f7f0db] via-[#fbf7ea] to-[#fffdf8]",
  },
  {
    id: LANGUAGE.HINDI,
    nativeLabel: "हिंदी",
    englishLabel: "Hindi",
    iconSrc: "/language/hindi.png",
    cardClassName: "from-[#ece9fb] via-[#f3f0fe] to-[#fbfaff]",
  },
];

export const LANGUAGE_META = {
  [LANGUAGE.GUJARATI]: {
    htmlLang: "gu",
    locale: "gu-IN",
    speechLocale: "gu-IN",
  },
  [LANGUAGE.ENGLISH]: {
    htmlLang: "en",
    locale: "en-IN",
    speechLocale: "en-IN",
  },
  [LANGUAGE.HINDI]: {
    htmlLang: "hi",
    locale: "hi-IN",
    speechLocale: "hi-IN",
  },
};
