"use client";

import { useEffect } from "react";

interface Props {
  currentSign: string;
}

const animationMap: Record<string, string> = {
  "HELLO": "hello",
  "THANK YOU": "thank_you",
  "GOOD MORNING": "good_morning",
  "PLEASE": "please",
  "YES": "yes",
  "NO": "no",
};

export default function AnimationController({ currentSign }: Props) {
  useEffect(() => {
    const animation = animationMap[currentSign];

    if (animation) {
      console.log(`Playing animation: ${animation}`);
    } else {
      console.log("No animation available for:", currentSign);
    }
  }, [currentSign]);

  return null;
}