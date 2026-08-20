"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  function createRoom() {
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    // Temporary Room ID
    const roomId = "SB-" + Math.floor(100000 + Math.random() * 900000);

    router.push(`/meeting?room=${roomId}&user=${encodeURIComponent(name)}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8">

        <h1 className="text-4xl font-bold text-white mb-2">
          Create Room
        </h1>

        <p className="text-slate-400 mb-8">
          Start a new SignBridge AI meeting.
        </p>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <button
          onClick={createRoom}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 font-semibold text-white"
        >
          Create Room
        </button>

      </div>

    </main>
  );
}