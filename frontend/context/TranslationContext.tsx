"use client";

import { createContext, useContext, useState } from "react";
import type { ConversationLanguage } from "@/services/signLanguage";

type TranslationContextType = {
  detectedWord: string;
  sentence: string;
  confidence: number;
  speechText: string;
  translatedText: string;
  conversationLanguage: ConversationLanguage;

  setDetectedWord: (word: string) => void;
  setSentence: (sentence: string) => void;
  setConfidence: (confidence: number) => void;
  setSpeechText: (text: string) => void;
  appendDetectedSign: (sign: string) => void;
  clearSentence: () => void;
  appendTranslatedSign: (sign: string) => void;
  setConversationLanguage: (language: ConversationLanguage) => void;
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [detectedWord, setDetectedWord] = useState("Waiting...");
  const [sentence, setSentence] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [speechText, setSpeechText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [conversationLanguage, setConversationLanguage] = useState<ConversationLanguage>("en");

  function appendDetectedSign(sign: string) {
    setSentence((currentSentence) => (
      currentSentence ? `${currentSentence} ${sign}` : sign
    ));
  }

  function clearSentence() {
    setSentence("");
    setTranslatedText("");
  }

  function appendTranslatedSign(sign: string) {
    setTranslatedText((currentText) => (
      currentText ? `${currentText} ${sign}` : sign
    ));
  }

  return (
    <TranslationContext.Provider
      value={{
        detectedWord,
    sentence,
    confidence,
    speechText,
    translatedText,
    conversationLanguage,
    setDetectedWord,
    setSentence,
    setConfidence,
    setSpeechText,
    appendDetectedSign,
    clearSentence,
    appendTranslatedSign,
    setConversationLanguage,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error(
      "useTranslation must be used inside TranslationProvider"
    );
  }

  return context;
}
