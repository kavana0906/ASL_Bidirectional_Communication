"use client";

import AvatarScene from "@/components/avatar/AvatarScene";
import { useTranslation } from "@/context/TranslationContext";

export default function AvatarPanel() {
  const { detectedWord } = useTranslation();

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 h-full p-6">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          3D Avatar
        </h2>

        <span className="text-green-400 text-sm">
          ● Ready
        </span>
      </div>

      <div className="h-[450px] rounded-2xl overflow-hidden bg-slate-800">
        <AvatarScene currentSign={detectedWord} />
      </div>

      <div className="mt-5 text-center">
        <p className="text-gray-400">
          Current Sign
        </p>

        <h3 className="text-2xl font-bold text-blue-400">
          {detectedWord}
        </h3>
      </div>

      <button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl transition">
        Generate Sign
      </button>

    </div>
  );
}