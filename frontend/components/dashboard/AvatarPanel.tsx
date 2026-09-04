"use client";

import { useState } from "react";
import AvatarScene from "@/components/avatar/AvatarScene";
import { useTranslation } from "@/context/TranslationContext";

export default function AvatarPanel() {
  const { detectedWord } = useTranslation();

  const [playTrigger, setPlayTrigger] = useState(0);

  const handleGenerateSign = () => {
    if (
      !detectedWord ||
      detectedWord === "Waiting..." ||
      detectedWord === "NO_HAND"
    ) {
      return;
    }

    setPlayTrigger((prev) => prev + 1);
  };

  const hasSign =
    detectedWord &&
    detectedWord !== "Waiting..." &&
    detectedWord !== "NO_HAND";

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 h-full p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">
          3D Avatar
        </h2>

        <span className="text-green-400 text-sm">
          ● Ready
        </span>

      </div>

      {/* AVATAR */}
      <div className="h-[450px] rounded-2xl overflow-hidden bg-slate-800">

        <AvatarScene
          currentSign={detectedWord}
          playTrigger={playTrigger}
        />

      </div>

      {/* CURRENT SIGN */}
      <div className="mt-5 text-center">

        <p className="text-gray-400">
          Current Sign
        </p>

        <h3 className="text-2xl font-bold text-blue-400">
          {detectedWord || "Waiting..."}
        </h3>

      </div>

      {/* GENERATE SIGN */}
      <button
        onClick={handleGenerateSign}
        disabled={!hasSign}
        className={`mt-6 w-full py-3 rounded-xl transition ${
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