"use client";

import { useState } from "react";
import { Trash2, Volume2 } from "lucide-react";

import { speak } from "@/services/speech";
import { useTranslation } from "@/context/TranslationContext";
import { browserLocale } from "@/services/signLanguage";

export default function TranslationPanel({ compact = false }: { compact?: boolean }) {
  const [showDetails, setShowDetails] = useState(compact);
  const {
    detectedWord,
    sentence,
    confidence,
    speechText,
    clearSentence,
    translatedText,
    conversationLanguage,
    setConversationLanguage,
  } = useTranslation();

  return (
    <section
      aria-label="AI Translation"
      className={compact ? "mt-3 border-t border-slate-700 pt-3" : "mt-5 border-t border-slate-700 pt-5"}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={compact ? "text-base font-bold" : "text-xl font-bold"}>AI Translation</h2>
          {!compact && <p className="mt-1 text-sm text-slate-400">Latest translated message</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="conversation-translation-language">
            Translation output language
          </label>
          <select
            id="conversation-translation-language"
            value={conversationLanguage}
            onChange={(event) => setConversationLanguage(event.target.value as "en" | "hi" | "kn")}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          >
            <option value="en">English</option>
            <option value="hi">Hindi — हिन्दी</option>
            <option value="kn">Kannada — ಕನ್ನಡ</option>
          </select>
          <button
            type="button"
            onClick={() => speak(translatedText, browserLocale(conversationLanguage))}
            disabled={!translatedText}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Volume2 size={18} />
            Speak Output
          </button>
        </div>
      </div>

      <div className={compact ? "mt-2 rounded-xl border border-slate-700 bg-slate-800/70 p-3" : "mt-4 rounded-xl border border-slate-700 bg-slate-800/70 p-4"}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {conversationLanguage === "hi" ? "Hindi output" : conversationLanguage === "kn" ? "Kannada output" : "English output"}
        </p>
        <p aria-live="polite" className={compact ? "max-h-16 overflow-y-auto whitespace-pre-wrap break-words text-sm text-white" : "whitespace-pre-wrap break-words text-lg text-white"}>
          {translatedText || "Your translation will appear here."}
        </p>
      </div>

      {!compact && (
        <button
          type="button"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((open) => !open)}
          className="mt-3 text-sm font-medium text-blue-300 transition hover:text-blue-200"
        >
          {showDetails ? "Hide translation details" : "Show translation details"}
        </button>
      )}

      {showDetails && (
        <div className={compact ? "mt-2 grid grid-cols-2 gap-2" : "mt-3 grid gap-3 sm:grid-cols-2"}>
          <div className={compact ? "rounded-lg bg-slate-800 p-2" : "rounded-xl bg-slate-800 p-4"}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Detected sign</p>
            <p className="line-clamp-2 break-words text-sm text-white">{detectedWord}</p>
          </div>
          <div className={compact ? "rounded-lg bg-slate-800 p-2" : "rounded-xl bg-slate-800 p-4"}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Live speech</p>
            <p className="line-clamp-2 break-words text-sm text-white">{speechText || "Waiting for speech…"}</p>
          </div>
          <div className={compact ? "col-span-2 rounded-lg bg-slate-800 p-2" : "rounded-xl bg-slate-800 p-4 sm:col-span-2"}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Sentence</p>
                <p className={compact ? "line-clamp-2 whitespace-pre-wrap break-words text-sm text-white" : "whitespace-pre-wrap break-words text-white"}>{sentence || "Waiting for a sentence…"}</p>
              </div>
              <p className="shrink-0 text-xs text-blue-300">Confidence: {confidence}%</p>
            </div>
            <div className={compact ? "mt-2 flex flex-wrap gap-2" : "mt-3 flex flex-wrap gap-3"}>
              <button
                type="button"
                onClick={() => speak(translatedText, browserLocale(conversationLanguage))}
                disabled={!translatedText}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Volume2 size={16} />
                Speak Sentence Translation
              </button>
              <button
                type="button"
                onClick={clearSentence}
                disabled={!sentence}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear sentence"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
