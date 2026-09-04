"use client";

import { useEffect } from "react";
import * as THREE from "three";
import {
  useGLTF,
  useAnimations,
} from "@react-three/drei";

interface Props {
  modelPath: string;
  playTrigger: number;
}

export default function AnimationController({
  modelPath,
  playTrigger,
}: Props) {
  const { scene, animations } = useGLTF(modelPath);

  const { actions } = useAnimations(
    animations,
    scene
  );

  useEffect(() => {
    // Don't play anything on initial load
    if (playTrigger === 0) {
      return;
    }

    const animationNames = Object.keys(actions);

    console.log(
      "Current model:",
      modelPath
    );

    console.log(
      "Available animations:",
      animationNames
    );

    // No animation inside GLB
    if (animationNames.length === 0) {
      console.warn(
        "No animation found in:",
        modelPath
      );
      return;
    }

    // Use the first animation in the GLB
    const animationName = animationNames[0];

    const action = actions[animationName];

    if (!action) {
      console.warn(
        "Animation not found:",
        animationName
      );
      return;
    }

    console.log(
      "Playing animation:",
      animationName
    );

    // Stop all existing animations
    Object.values(actions).forEach(
      (existingAction) => {
        if (existingAction) {
          existingAction.stop();
        }
      }
    );

    // Start animation from beginning
    action.reset();

    // Play once
    action.setLoop(
      THREE.LoopOnce,
      1
    );

    // Hold final frame
    action.clampWhenFinished = true;

    // Play
    action.play();

  }, [
    modelPath,
    playTrigger,
    actions,
  ]);

  return null;
}