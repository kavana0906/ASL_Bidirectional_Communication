"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function JoinRoomPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState<"normal" | "asl" | "">("");

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get("room");
    if (room) setRoomId(room);
  }, []);

  function joinRoom() {
    if (!name.trim() || !roomId.trim()) {
      alert("Please fill all fields.");
      return;
    }

    if (!mode) {
      alert("Please select your communication mode.");
      return;
    }

    router.push(
      `/meeting?room=${encodeURIComponent(
        roomId.trim()
      )}&user=${encodeURIComponent(
        name.trim()
      )}&mode=${mode}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        {/* Header */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.08 }}
          className="mb-8 text-center"
        >

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4">
            <span className="text-2xl">🌉</span>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Join a Room
          </h1>

          <p className="text-slate-500 text-sm mt-2">
            Enter the room details to continue
          </p>

        </motion.div>

        {/* Form */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.18 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl"
        >

          {/* Name */}
          <div className="mb-5">

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

          {/* Room ID */}
          <div className="mb-6">

            <label className="block text-sm text-slate-300 mb-2">
              Room ID
            </label>

            <input
              type="text"
              placeholder="e.g. SB-123456"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
            />

          </div>

          {/* Mode */}
          <div>

            <label className="block text-sm text-slate-300 mb-3">
              Communication mode
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* Speech */}
              <button
                type="button"
                onClick={() => setMode("normal")}
                className={`rounded-xl border px-4 py-4 text-left transition-all duration-200 ${
                  mode === "normal"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-950 hover:-translate-y-1 hover:border-slate-600"
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

              {/* ASL */}
              <button
                type="button"
                onClick={() => setMode("asl")}
                className={`rounded-xl border px-4 py-4 text-left transition-all duration-200 ${
                  mode === "asl"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-slate-800 bg-slate-950 hover:-translate-y-1 hover:border-slate-600"
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

          {/* Join */}
          <button
            onClick={joinRoom}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98]"
          >
            Join Room
            <span className="ml-2">→</span>
          </button>

        </motion.div>

        <p className="text-center text-xs text-slate-600 mt-5">
          SignBridge AI • Real-time communication
        </p>

      </div>

    </main>
  );
}
