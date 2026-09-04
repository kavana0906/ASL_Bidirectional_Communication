"use client";

import { useGLTF } from "@react-three/drei";

interface Props {
  modelPath: string;
}

export default function AvatarModel({
  modelPath,
}: Props) {
  const { scene } = useGLTF(modelPath);

  return (
    <primitive
      object={scene}
      scale={2}
      position={[0, -2.2, 0]}
    />
  );
}