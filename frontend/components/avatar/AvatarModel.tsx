"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useAnimations, useGLTF } from "@react-three/drei";

interface Props {
  modelPath: string;
  playTrigger: number;
  shouldAnimate: boolean;
}

export default function AvatarModel({
  modelPath,
  playTrigger,
  shouldAnimate,
}: Props) {
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (!shouldAnimate || playTrigger === 0) return;

    const action = Object.values(actions)[0];
    if (!action) return;

    Object.values(actions).forEach((existingAction) => existingAction?.stop());
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
  }, [actions, playTrigger, shouldAnimate]);

  return (
    <primitive
      object={scene}
      scale={2}
      position={[0, -2.2, 0]}
    />
  );
}
