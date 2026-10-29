export type ConversationLanguage = "en" | "hi" | "kn";

const translations: Record<Exclude<ConversationLanguage, "en">, Record<string, string>> = {
  hi: { HELLO: "नमस्ते", HELP: "मदद", GOOD: "अच्छा", BAD: "बुरा", LOVE: "प्यार", MORE: "ज़्यादा", NAME: "नाम", NO: "नहीं", PLEASE: "कृपया", SORRY: "माफ़ कीजिए", START: "शुरू", STOP: "रुको", "THANK YOU": "धन्यवाद", YES: "हाँ", YOU: "आप", WE: "हम", WHERE: "कहाँ", WHEN: "कब", WHY: "क्यों", LIKE: "पसंद", LESS: "कम", UNDERSTAND: "समझना" },
  kn: { HELLO: "ನಮಸ್ಕಾರ", HELP: "ಸಹಾಯ", GOOD: "ಒಳ್ಳೆಯ", BAD: "ಕೆಟ್ಟ", LOVE: "ಪ್ರೀತಿ", MORE: "ಹೆಚ್ಚು", NAME: "ಹೆಸರು", NO: "ಇಲ್ಲ", PLEASE: "ದಯವಿಟ್ಟು", SORRY: "ಕ್ಷಮಿಸಿ", START: "ಪ್ರಾರಂಭ", STOP: "ನಿಲ್ಲಿಸಿ", "THANK YOU": "ಧನ್ಯವಾದಗಳು", YES: "ಹೌದು", YOU: "ನೀವು", WE: "ನಾವು", WHERE: "ಎಲ್ಲಿ", WHEN: "ಯಾವಾಗ", WHY: "ಏಕೆ", LIKE: "ಇಷ್ಟ", LESS: "ಕಡಿಮೆ", UNDERSTAND: "ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ" },
};

export function translateSign(sign: string, language: ConversationLanguage) {
  return language === "en" ? sign : translations[language][sign] || sign;
}

export function browserLocale(language: ConversationLanguage) {
  return { en: "en-US", hi: "hi-IN", kn: "kn-IN" }[language];
}
