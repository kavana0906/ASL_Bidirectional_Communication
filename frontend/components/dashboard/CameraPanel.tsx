"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  Camera,
  Play,
  Square,
} from "lucide-react";

import {
  captureFrameSequence,
} from "@/services/camera";

import {
  predictSign,
} from "@/services/api";

import {
  useTranslation,
} from "@/context/TranslationContext";


// ============================================================
// PROPS
// ============================================================

interface CameraPanelProps {
  sendRoomMessage: (data: object) => void;
}


// ============================================================
// COMPONENT
// ============================================================

export default function CameraPanel({
  sendRoomMessage,
}: CameraPanelProps) {

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);


  const [isRunning, setIsRunning] =
    useState(false);

  const [isPredicting, setIsPredicting] =
    useState(false);


  const {
    setDetectedWord,
    setConfidence,
    appendDetectedSign,
  } = useTranslation();


  // ============================================================
  // START CAMERA
  // ============================================================

  async function startCamera() {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });


      streamRef.current = stream;


      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;

      }


      setIsRunning(true);

    } catch (error) {

      console.error(
        "Camera error:",
        error
      );

      alert(
        "Unable to access camera."
      );

    }
  }


  // ============================================================
  // STOP CAMERA
  // ============================================================

  function stopCamera() {

    streamRef.current
      ?.getTracks()
      .forEach(
        (track) => track.stop()
      );


    if (videoRef.current) {

      videoRef.current.srcObject =
        null;

    }


    setIsRunning(false);
  }


  // ============================================================
  // PREDICT SIGN
  // ============================================================

  const predictSequence =
    useCallback(async () => {

      if (
        !videoRef.current ||
        !isRunning ||
        isPredicting
      ) {
        return;
      }


      try {

        setIsPredicting(true);


        // Capture chronological frames
        const frameBlobs =
          await captureFrameSequence(
            videoRef.current,
            80,
            75
          );


        // Send frames to ASL model
        const result =
          await predictSign(
            frameBlobs
          );


        console.log(
          "ASL prediction:",
          result
        );


        // ======================================================
        // UPDATE LOCAL TRANSLATION
        // ======================================================

        setDetectedWord(
          result.prediction
        );


        setConfidence(
          Math.round(
            result.confidence * 100
          )
        );


        // ======================================================
        // VALID SIGN
        // ======================================================

        if (
          result.prediction !==
            "COLLECTING_FRAMES" &&
          result.prediction !==
            "NO_HAND"
        ) {

          // Add to local sentence
          appendDetectedSign(
            result.prediction
          );


          // ====================================================
          // SEND SIGN TO OTHER USER
          // ====================================================

          sendRoomMessage({

            type: "sign",

            word:
              result.prediction,

            confidence:
              result.confidence,

          });


          console.log(
            "ASL sign sent to room:",
            result.prediction
          );
        }

      } catch (error) {

        console.error(
          "Sign prediction error:",
          error
        );

      } finally {

        setIsPredicting(false);

      }

    }, [
      isRunning,
      isPredicting,
      setDetectedWord,
      setConfidence,
      appendDetectedSign,
      sendRoomMessage,
    ]);


  // ============================================================
  // CAMERA CLEANUP
  // ============================================================

  useEffect(() => {

    return () => {

      streamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

    };

  }, []);


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex items-center justify-between p-5 border-b border-slate-800">

        <div className="flex items-center gap-3">

          <Camera className="text-blue-400" />

          <h2 className="text-xl font-bold text-white">
            Live Camera
          </h2>

        </div>


        <div
          className={`text-sm font-semibold ${
            isRunning
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {isRunning
            ? "● Live"
            : "● Offline"}
        </div>

      </div>


      {/* ====================================================== */}
      {/* CAMERA PREVIEW */}
      {/* ====================================================== */}

      <div className="bg-black h-[420px] flex items-center justify-center">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

      </div>


      {/* ====================================================== */}
      {/* CONTROLS */}
      {/* ====================================================== */}

      <div className="flex justify-center gap-4 p-5 border-t border-slate-800">

        {/* START CAMERA */}

        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
        >

          <Play size={18} />

          Start Camera

        </button>


        {/* STOP */}

        <button
          onClick={stopCamera}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition"
        >

          <Square size={18} />

          Stop

        </button>


        {/* READ SIGN */}

        <button
          onClick={predictSequence}
          disabled={
            !isRunning ||
            isPredicting
          }
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
        >

          {isPredicting
            ? "Reading Sign..."
            : "Read 60-Frame Sign"}

        </button>

      </div>

    </div>
  );
}