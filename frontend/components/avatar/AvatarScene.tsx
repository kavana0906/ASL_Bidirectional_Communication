"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import AvatarModel from "./AvatarModel";
import AnimationController from "./AnimationController";

interface Props {
  currentSign: string;
  playTrigger: number;
}

const availableSigns = new Set([
  "hello",
  "love",
  "more",
  "name",
  "no",
  "please",
  "sorry",
  "thank_you",
  "stop",
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

  const hasAvatar =
    availableSigns.has(normalizedSign);

  // If sign has no GLB, keep showing HELLO avatar
  const modelSign =
    !isWaiting && hasAvatar
      ? normalizedSign
      : "hello";

  const modelPath =
    `/models/remy_asl_${modelSign}.glb`;

  // Only play animation when the sign has its own avatar
  const shouldAnimate =
    !isWaiting && hasAvatar;

  console.log("Current sign:", currentSign);
  console.log("Avatar model:", modelPath);
  console.log("Should animate:", shouldAnimate);

  return (
    <Canvas
      camera={{
        position: [0, 1.5, 4],
        fov: 45,
      }}
    >
      <ambientLight intensity={2} />

      <directionalLight
        position={[3, 3, 3]}
        intensity={2}
      />

      <AvatarModel
        modelPath={modelPath}
      />

      {shouldAnimate && (
        <AnimationController
          modelPath={modelPath}
          playTrigger={playTrigger}
        />
      )}

      <OrbitControls
        enableRotate={true}
        autoRotate={false}
      />
    </Canvas>
  );
}