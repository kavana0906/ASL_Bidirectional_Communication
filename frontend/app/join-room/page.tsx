"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinRoomPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  function joinRoom() {
    if (!name.trim() || !roomId.trim()) {
      alert("Please fill all fields.");
      return;
    }

    router.push(
      `/meeting?room=${roomId}&user=${encodeURIComponent(name)}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8">

        <h1 className="text-4xl font-bold text-white mb-2">
          Join Room
        </h1>

        <p className="text-slate-400 mb-8">
          Join an existing SignBridge AI meeting.
        </p>

        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <button
          onClick={joinRoom}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 transition rounded-xl py-3 font-semibold text-white"
        >
          Join Room
        </button>

      </div>

    </main>
  );
}