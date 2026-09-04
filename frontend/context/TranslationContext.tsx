"use client";

import { createContext, useContext, useState } from "react";

type TranslationContextType = {
  detectedWord: string;
  sentence: string;
  confidence: number;
  speechText: string;

  setDetectedWord: (word: string) => void;
  setSentence: (sentence: string) => void;
  setConfidence: (confidence: number) => void;
  setSpeechText: (text: string) => void;
  appendDetectedSign: (sign: string) => void;
  clearSentence: () => void;
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

  function appendDetectedSign(sign: string) {
    setSentence((currentSentence) => (
      currentSentence ? `${currentSentence} ${sign}` : sign
    ));
  }

  function clearSentence() {
    setSentence("");
  }

  return (
    <TranslationContext.Provider
      value={{
        detectedWord,
    sentence,
    confidence,
    speechText,
    setDetectedWord,
    setSentence,
    setConfidence,
    setSpeechText,
    appendDetectedSign,
    clearSentence,
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