"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Play, Square } from "lucide-react";

import { captureFrame } from "@/services/camera";
import { predictSign } from "@/services/api";
import { useTranslation } from "@/context/TranslationContext";

export default function CameraPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRunning, setIsRunning] = useState(false);

  const {
    setDetectedWord,
    setSentence,
    setConfidence,
  } = useTranslation();

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsRunning(true);
    } catch (error) {
      console.error(error);
      alert("Unable to access camera.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsRunning(false);
  }

  const testCapture = useCallback(async () => {
    if (!videoRef.current || !isRunning) return;

    try {
      // Capture webcam frame
      const imageBlob = await captureFrame(videoRef.current);

      // Send to FastAPI
      const result = await predictSign(imageBlob);

      console.log(result);

      // Update Translation Panel
      setDetectedWord(result.prediction);
      setSentence(`Detected Sign: ${result.prediction}`);
      setConfidence(Math.round(result.confidence * 100));
    } catch (error) {
      console.error(error);
    }
  }, [
    isRunning,
    setDetectedWord,
    setSentence,
    setConfidence,
  ]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Automatic prediction every second
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      testCapture();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, testCapture]);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800">

        <div className="flex items-center gap-3">
          <Camera className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">
            Live Camera
          </h2>
        </div>

        <div
          className={`text-sm font-semibold ${
            isRunning ? "text-green-400" : "text-red-400"
          }`}
        >
          {isRunning ? "● Live" : "● Offline"}
        </div>

      </div>

      {/* Camera Preview */}
      <div className="bg-black h-[420px] flex items-center justify-center">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 p-5 border-t border-slate-800">

        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
        >
          <Play size={18} />
          Start Camera
        </button>

        <button
          onClick={stopCamera}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition"
        >
          <Square size={18} />
          Stop
        </button>

        <button
          onClick={testCapture}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 transition"
        >
          Capture Frame
        </button>

      </div>

    </div>
  );
}