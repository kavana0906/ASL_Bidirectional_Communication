"use client";

import AvatarScene from "./AvatarScene";

interface Props {
  currentSign?: string;
  playTrigger?: number;
}

export default function AvatarViewer({
  currentSign = "HELLO",
  playTrigger = 0,
}: Props) {
  return (
    <div className="w-full h-full">
      <AvatarScene
        currentSign={currentSign}
        playTrigger={playTrigger}
      />
    </div>
  );
}