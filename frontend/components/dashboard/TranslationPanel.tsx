"use client";

import { useTranslation } from "@/context/TranslationContext";

export default function TranslationPanel() {
  const {
    detectedWord,
    sentence,
    confidence,
    speechText,
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