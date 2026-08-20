"use client";

import { useGLTF } from "@react-three/drei";

export default function AvatarModel() {
  const { scene } = useGLTF("/models/avatar.glb");

  return (
    <primitive
      object={scene}
      scale={2}
      position={[0, -2.2, 0]}
    />
  );
}

useGLTF.preload("/models/avatar.glb");