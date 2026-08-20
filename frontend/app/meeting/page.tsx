"use client";

import { useState } from "react";

import TopBar from "@/components/dashboard/TopBar";
import CameraPanel from "@/components/dashboard/CameraPanel";
import TranslationPanel from "@/components/dashboard/TranslationPanel";
import AvatarPanel from "@/components/dashboard/AvatarPanel";
import SpeechPanel from "@/components/dashboard/SpeechPanel";

export default function MeetingPage() {
  const [currentSign, setCurrentSign] = useState("HELLO");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <TopBar />

      <div className="grid grid-cols-12 gap-5 p-5">
        {/* Left */}
        <div className="col-span-8">
          <CameraPanel />
        </div>

        {/* Right */}
        <div className="col-span-4 flex flex-col gap-5">
          <TranslationPanel/>

          <AvatarPanel currentSign={currentSign} />

          <SpeechPanel />
        </div>
      </div>
    </main>
  );
}