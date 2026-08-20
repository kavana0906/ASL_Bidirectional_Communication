"use client";

import { useEffect, useState } from "react";
import { checkBackend } from "@/services/api";

export default function TopBar() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await checkBackend();

        if (data.server === "online") {
          setStatus("🟢 Backend Online");
        } else {
          setStatus("🔴 Backend Offline");
        }
      } catch {
        setStatus("🔴 Backend Offline");
      }
    }

    loadStatus();
  }, []);

  return (
    <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-6 py-4">
      <h1 className="text-2xl font-bold text-white">
        SignBridge AI
      </h1>

      <span className="text-green-400 font-semibold">
        {status}
      </span>
    </div>
  );
}