"use client";

import { Trash2, Volume2 } from "lucide-react";

import { speak } from "@/services/speech";
import { useTranslation } from "@/context/TranslationContext";

export default function TranslationPanel() {
  const {
    detectedWord,
    sentence,
    confidence,
    speechText,
    clearSentence,
  } = useTranslation();

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 h-full p-6">

      <h2 className="text-2xl font-bold mb-6">
        AI Translation
      </h2>

      {/* Detected Sign */}
      <div className="bg-slate-800 rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-sm mb-2">
          Detected Sign
        </p>

        <h3 className="text-3xl font-bold text-green-400">
          {detectedWord}
        </h3>
      </div>

      {/* Live Speech */}
      <div className="bg-slate-800 rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-sm mb-2">
          Live Speech
        </p>

        <p className="text-xl">
          {speechText || "Waiting for speech..."}
        </p>
      </div>

      {/* Sentence */}
      <div className="bg-slate-800 rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-sm mb-2">
          Sentence
        </p>

        <p className="text-xl">
          {sentence || "Waiting..."}
        </p>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => speak(sentence)}
            disabled={!sentence}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 py-3 transition"
          >
            <Volume2 size={18} />
            Speak Sentence
          </button>

          <button
            onClick={clearSentence}
            disabled={!sentence}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-3 transition"
            aria-label="Clear sentence"
          >
            <Trash2 size={18} />
            Clear
          </button>
        </div>
      </div>

      {/* Confidence */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <p className="text-gray-400 text-sm mb-2">
          Confidence
        </p>

        <h3 className="text-2xl font-bold text-blue-400">
          {confidence}%
        </h3>
      </div>

    </div>
  );
}