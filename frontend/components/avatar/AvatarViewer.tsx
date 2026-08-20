"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function AvatarPlaceholder() {
  return (
    <mesh rotation={[0.3, 0.5, 0]}>
      <boxGeometry args={[1.2, 2, 1]} />
      <meshStandardMaterial color="#4F46E5" />
    </mesh>
  );
}

export default function AvatarViewer() {
  return (
    <Canvas camera={{ position: [0, 1.5, 5], fov: 45 }}>

      <ambientLight intensity={2} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={2}
      />

      <AvatarPlaceholder />

      <OrbitControls
        enableZoom={false}
      />

    </Canvas>
  );
}