"use client";

import { useState } from "react";
import { Mic, Square } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function SpeechPanel() {
  const {
  speechText,
  setSpeechText,
  setSentence,
} = useTranslation();

  const [isListening, setIsListening] = useState(false);

  let recognition: any = null;

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }

      setSpeechText(transcript);
setSentence(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    (window as any).currentRecognition = recognition;
  }

  function stopListening() {
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
    }
  }

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 h-full p-6">

      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Speech Input
        </h2>

        <span
          className={`font-semibold ${
            isListening ? "text-green-400" : "text-red-400"
          }`}
        >
          {isListening ? "Listening..." : "Stopped"}
        </span>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 h-[220px] overflow-auto">

        <p className="text-gray-400 mb-3">
          Live Speech
        </p>

        <p className="text-2xl leading-relaxed">
          {speechText || "Start speaking..."}
        </p>

      </div>

      <div className="flex gap-4 mt-6">

        <button
          onClick={startListening}
          className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Mic size={18} />
          Start
        </button>

        <button
          onClick={stopListening}
          className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Square size={18} />
          Stop
        </button>

      </div>

    </div>
  );
}