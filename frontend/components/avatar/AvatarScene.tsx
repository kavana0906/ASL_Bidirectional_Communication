"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import AvatarModel from "./AvatarModel";

interface Props {
  currentSign: string;
  playTrigger: number;
}

const availableSigns = new Set([
  "bad",
  "good",
  "hello",
  "help",
  "less",
  "like",
  "love",
  "more",
  "name",
  "no",
  "please",
  "sorry",
  "start",
  "stop",
  "thank_you",
  "understand",
  "we",
  "when",
  "where",
  "why",
  "yes",
  "you",
]);

export default function AvatarScene({
  currentSign,
  playTrigger,
}: Props) {

  const normalizedSign =
    currentSign
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, "_") || "hello";

  const isWaiting =
    normalizedSign.startsWith("waiting");

  const hasSignAvatar =
    availableSigns.has(normalizedSign);

  // Keep the HELLO model visible in its idle pose before the first sign.
  const modelSign =
    !isWaiting && hasSignAvatar
      ? normalizedSign
      : "hello";

  const modelPath =
    `/models/remy_asl_${modelSign}.glb`;

  // Only play animation when the sign has its own avatar
  const shouldAnimate = !isWaiting && hasSignAvatar;
  const shouldRenderAvatar = isWaiting || hasSignAvatar;

  console.log("Current sign:", currentSign);
  console.log("Avatar model:", modelPath);
  console.log("Should animate:", shouldAnimate);

  return (
    <Canvas
      camera={{
        position: [0, 1.2, 3.4],
        fov: 40,
      }}
    >
      <ambientLight intensity={2} />

      <directionalLight
        position={[3, 3, 3]}
        intensity={2}
      />

      {shouldRenderAvatar ? (
        <AvatarModel
          modelPath={modelPath}
          playTrigger={playTrigger}
          shouldAnimate={shouldAnimate}
        />
      ) : null}

      <OrbitControls
        enableRotate={true}
        autoRotate={false}
        target={[0, 0.25, 0]}
      />
    </Canvas>
  );
}
