"use client";

import {
  useState,
} from "react";

import {
  Mic,
  Square,
} from "lucide-react";

import {
  useTranslation,
} from "@/context/TranslationContext";

import {
  startContinuousRecording,
  stopContinuousRecording,
} from "@/services/audioRecorder";

import { speechToText, translateText } from "@/services/api";


// ============================================================
// PROPS
// ============================================================

interface SpeechPanelProps {
  sendRoomMessage: (data: object) => void;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}


// ============================================================
// COMPONENT
// ============================================================

export default function SpeechPanel({
  sendRoomMessage,
  onTranscript,
  disabled = false,
}: SpeechPanelProps) {

  const {
    setSpeechText,
    setSentence,
    setTranslatedText,
    conversationLanguage,
  } = useTranslation();


  const [
    isListening,
    setIsListening,
  ] = useState(false);

  const [isLive, setIsLive] = useState(false);

  const [language, setLanguage] = useState<"en" | "hi" | "kn">("en");

  async function handleAudio(audioBlob: Blob) {
    const result = await speechToText(audioBlob, language);
    const spokenText = result.text || "";

    if (!spokenText.trim()) return;

    setSpeechText(spokenText);
    onTranscript(spokenText);

    let englishText = language === "en" ? spokenText : "";
    try {
      const englishPromise = language === "en"
        ? Promise.resolve({ text: spokenText })
        : translateText(spokenText, language, "en");
      const displayPromise = conversationLanguage === "en"
        ? englishPromise
        : translateText(spokenText, language, conversationLanguage);
      const [englishResult, displayResult] = await Promise.all([englishPromise, displayPromise]);
      englishText = englishResult.text || spokenText;
      setSentence(englishText);
      setTranslatedText(displayResult.text || spokenText);
    } catch (error) {
      setSentence(englishText || spokenText);
      setTranslatedText(error instanceof Error ? error.message : "Translation unavailable.");
    }

    sendRoomMessage({
      type: "speech",
      text: englishText || spokenText,
      originalText: spokenText,
      sourceLanguage: language,
    });
}


  async function startLiveConversation() {
    try {
      setIsListening(true);
      setIsLive(true);
      await startContinuousRecording(async (audioBlob) => {
        try {
          await handleAudio(audioBlob);
        } catch (error) {
          console.error("Live speech-to-text error:", error);
          setTranslatedText(error instanceof Error ? error.message : "Speech translation failed.");
        }
      });
    } catch (error) {
      console.error("Microphone error:", error);
      setIsListening(false);
      setIsLive(false);
    }
  }

  function stopLiveConversation() {
    stopContinuousRecording();
    setIsListening(false);
    setIsLive(false);
  }


  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor="spoken-language">
        Spoken language
      </label>
      <select
        id="spoken-language"
        value={language}
        onChange={(event) => {
          const nextLanguage = event.target.value as "en" | "hi" | "kn";
          setLanguage(nextLanguage);
        }}
        disabled={isListening || disabled}
        aria-label="Spoken language"
        className="min-w-32 rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 text-white disabled:opacity-60"
      >
        <option value="en">English</option>
        <option value="hi">Hindi — हिन्दी</option>
        <option value="kn">Kannada — ಕನ್ನಡ</option>
      </select>
      <button
        type="button"
        onClick={isLive ? stopLiveConversation : startLiveConversation}
        disabled={disabled && !isLive}
        aria-label={isLive ? "Stop speaking" : "Start speaking"}
        title={isLive ? "Stop speaking" : "Speak in the selected language"}
        className={`flex min-w-32 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:bg-gray-600 ${
          isLive ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
        }`}
      >
        {isLive ? <Square size={18} /> : <Mic size={18} />}
        {isLive ? "Stop" : "Speak"}
      </button>
    </div>
  );
}
