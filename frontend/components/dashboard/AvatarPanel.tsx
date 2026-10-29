"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AvatarScene from "@/components/avatar/AvatarScene";
import { useTranslation } from "@/context/TranslationContext";

const supportedSigns = new Set([
  "bad", "good", "hello", "help", "less", "like", "love", "more", "name", "no", "please", "sorry", "start", "stop", "thank_you", "understand", "we", "when", "where", "why", "yes", "you"
]);

function getSupportedSigns(input: string) {
  return input
    .toLowerCase()
    .replace(/\bthank\s*you\b/g, " thank_you ")
    .replace(/[^a-z_\s]/g, " ")
    .split(/\s+/)
    .filter((word) => supportedSigns.has(word));
}

export default function AvatarPanel({ compact = false }: { compact?: boolean }) {
  const { detectedWord } = useTranslation();

  const [playTrigger, setPlayTrigger] = useState(0);
  const [avatarSign, setAvatarSign] = useState("Waiting...");
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playSigns = useCallback((signs: string[]) => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    if (signs.length === 0) return;

    let index = 0;
    const showNextSign = () => {
      setAvatarSign(signs[index]);
      setPlayTrigger((previous) => previous + 1);
      index += 1;

      if (index < signs.length) {
        playbackTimerRef.current = setTimeout(showNextSign, 3000);
      } else {
        playbackTimerRef.current = null;
      }
    };

    showNextSign();
  }, []);

  useEffect(() => {
    if (!detectedWord || detectedWord === "Waiting..." || detectedWord === "NO_HAND") {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    const signs = getSupportedSigns(detectedWord);
    if (signs.length === 0) {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      setAvatarSign("No matching sign asset");
      return;
    }

    playSigns(signs);
  }, [detectedWord, playSigns]);

  useEffect(() => () => {
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
  }, []);

  const handleGenerateSign = () => {
    playSigns(getSupportedSigns(detectedWord));
  };

  const hasSign = getSupportedSigns(detectedWord).length > 0;

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 ${compact ? "p-3" : "min-h-[680px] p-6"}`}>

      {/* HEADER */}
      <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-6"}`}>

        <h2 className={`font-bold ${compact ? "text-base" : "text-2xl"}`}>
          3D Avatar
        </h2>

        <span className="text-green-400 text-sm">
          ● Ready
        </span>

      </div>

      {/* AVATAR */}
      <div className={`min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-800 ${compact ? "" : "h-[500px]"}`}>

        <AvatarScene
          currentSign={avatarSign}
          playTrigger={playTrigger}
        />

      </div>

      {/* CURRENT SIGN */}
      <div className={compact ? "mt-2 flex items-center justify-between gap-2 text-sm" : "mt-5 text-center"}>

        <p className="text-gray-400">
          Current Sign
        </p>

        <h3 className={`font-bold text-blue-400 ${compact ? "text-base" : "text-2xl"}`}>
          {avatarSign}
        </h3>

      </div>

      {/* GENERATE SIGN */}
      <button
        onClick={handleGenerateSign}
        disabled={!hasSign}
        className={`w-full rounded-xl transition ${compact ? "mt-2 py-2 text-sm" : "mt-6 py-3"} ${
          hasSign
            ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            : "bg-gray-600 cursor-not-allowed opacity-60"
        }`}
      >
        Generate Sign
      </button>

    </div>
  );
}
