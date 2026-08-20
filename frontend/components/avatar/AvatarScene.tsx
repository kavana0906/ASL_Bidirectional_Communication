"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import AvatarModel from "./AvatarModel";
import AnimationController from "./AnimationController";

interface Props {
  currentSign: string;
}

export default function AvatarScene({ currentSign }: Props) {
  return (
    <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
      <ambientLight intensity={2} />
      <directionalLight position={[3, 3, 3]} intensity={2} />

      <AvatarModel />

      <AnimationController currentSign={currentSign} />

      <Environment preset="city" />

      <OrbitControls
        autoRotate
        autoRotateSpeed={1}
      />
    </Canvas>
  );
}