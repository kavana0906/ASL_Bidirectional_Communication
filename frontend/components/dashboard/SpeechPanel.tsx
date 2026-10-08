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
    setConversationLanguage,
  } = useTranslation();


  const [
    isListening,
    setIsListening,
  ] = useState(false);

  const [isLive, setIsLive] = useState(false);

  const [language, setLanguage] = useState<"en" | "hi" | "kn">("en");

  async function handleAudio(audioBlob: Blob) {
    console.log("🔥 handleAudio called - language:", language);
  const result = await speechToText(audioBlob, language);
  const spokenText = result.text || "";

  if (!spokenText.trim()) return;

  let englishText = spokenText;

  // Translate Hindi/Kannada speech into English
  if (language === "hi" || language === "kn") {
    const translation = await translateText(
      spokenText,
      language
    );

    englishText = translation.text || spokenText;

    console.log("Original speech:", spokenText);
    console.log("English translation:", englishText);
  }

  // Display the original spoken text
  setSpeechText(spokenText);
  onTranscript(spokenText);

  // Use English for the ASL pipeline
  setSentence(englishText);

  sendRoomMessage({
    type: "speech",
    text: englishText,
    originalText: spokenText,
    language,
    translatedTo: "en",
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
          setConversationLanguage(nextLanguage);
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
