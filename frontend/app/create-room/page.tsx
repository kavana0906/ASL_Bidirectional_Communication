"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateRoomPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [mode, setMode] = useState<"normal" | "asl" | "">("");

  function createRoom() {
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!mode) {
      alert("Please select your communication mode.");
      return;
    }

    const roomId =
      "SB-" + Math.floor(100000 + Math.random() * 900000);

    router.push(
      `/meeting?room=${roomId}&user=${encodeURIComponent(
        name.trim()
      )}&mode=${mode}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4">
            <span className="text-2xl">🌉</span>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Create a Room
          </h1>

          <p className="text-slate-500 text-sm mt-2">
            Start a new SignBridge conversation
          </p>

        </div>

        {/* Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">

          {/* Name */}
          <div className="mb-6">

            <label className="block text-sm text-slate-300 mb-2">
              Your name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
            />

          </div>

          {/* Communication Mode */}
          <div>

            <label className="block text-sm text-slate-300 mb-3">
              Communication mode
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* Speech & Text */}
              <button
                type="button"
                onClick={() => setMode("normal")}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  mode === "normal"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >

                <div className="text-lg mb-2">
                  🎤
                </div>

                <p className="text-sm font-semibold text-white">
                  Speech & Text
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Voice and typing
                </p>

              </button>

              {/* Sign Language */}
              <button
                type="button"
                onClick={() => setMode("asl")}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  mode === "asl"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >

                <div className="text-lg mb-2">
                  🤟
                </div>

                <p className="text-sm font-semibold text-white">
                  Sign Language
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  ASL communication
                </p>

              </button>

            </div>

          </div>

          {/* Create Room */}
          <button
            onClick={createRoom}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 text-sm font-semibold text-white"
          >
            Create Room
            <span className="ml-2">→</span>
          </button>

        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          SignBridge AI • Real-time communication
        </p>

      </div>

    </main>
  );
}