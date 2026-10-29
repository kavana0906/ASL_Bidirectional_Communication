
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
  SignPredictionError,
} from "@/services/api";

import {
  useTranslation,
} from "@/context/TranslationContext";

import {
  translateSign,
} from "@/services/signLanguage";

// ============================================================
// PROPS
// ============================================================

interface CameraPanelProps {
  sendRoomMessage: (data: object) => void;
  compact?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CameraPanel({
  sendRoomMessage,
  compact = false,
}: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Prevents the same consecutive sign from being
  // added to the sentence or sent to the room repeatedly.
  const lastEmittedSignRef = useRef<string | null>(null);
  const predictionBusyRef = useRef(false);
  const predictionUnavailableRef = useRef(false);
  const predictSequenceRef = useRef<() => Promise<void>>(async () => {});

  const [isRunning, setIsRunning] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState("");

  const {
    setDetectedWord,
    setConfidence,
    sentence,
    appendDetectedSign,
    appendTranslatedSign,
    conversationLanguage,
  } = useTranslation();

  // ============================================================
  // START CAMERA
  // ============================================================

  async function startCamera() {
    try {
      predictionUnavailableRef.current = false;
      setPredictionError("");
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsRunning(true);
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera.");
    }
  }

  // ============================================================
  // STOP CAMERA
  // ============================================================

  function stopCamera() {
    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    streamRef.current = null;
    lastEmittedSignRef.current = null;
    setIsRunning(false);
  }

  // ============================================================
  // PREDICT SIGN
  // ============================================================

  const predictSequence = useCallback(async () => {
    if (
      !videoRef.current ||
      !isRunning ||
      predictionUnavailableRef.current ||
      predictionBusyRef.current
    ) {
      return;
    }

    try {
      setPredictionError("");
      predictionBusyRef.current = true;
      setIsPredicting(true);

      // Capture chronological frames.
      const frameBlobs =
        await captureFrameSequence(
          videoRef.current,
          80,
          75
        );

      // Send frames to ASL model.
      const result = await predictSign(frameBlobs);

      console.log("ASL prediction:", result);

      // ========================================================
      // UPDATE LOCAL TRANSLATION
      // ========================================================

      setDetectedWord(result.prediction);

      setConfidence(
        Math.round(result.confidence * 100)
      );

      // ========================================================
      // VALID SIGN + DUPLICATE PREVENTION
      // ========================================================

      const prediction =
        result.prediction?.trim().toUpperCase();

      if (
        prediction === "COLLECTING_FRAMES" ||
        prediction === "NO_HAND"
      ) {
        // A neutral/no-hand result resets the guard,
        // allowing the same sign to be emitted again later.
        lastEmittedSignRef.current = null;
      } else if (
        prediction &&
        prediction !== lastEmittedSignRef.current
      ) {
        // Emit only when the recognized sign changes.
        lastEmittedSignRef.current = prediction;

        // Add sign to the local sentence.
        appendDetectedSign(prediction);

        const formedSentence = sentence
          ? `${sentence} ${prediction}`
          : prediction;

        appendTranslatedSign(
          translateSign(
            prediction,
            conversationLanguage
          )
        );

        const spokenWord = translateSign(prediction, conversationLanguage)
          .replace(/_/g, " ");
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenWord);
        utterance.lang = { en: "en-US", hi: "hi-IN", kn: "kn-IN" }[conversationLanguage];
        window.speechSynthesis.speak(utterance);

        // ======================================================
        // SEND SIGN TO OTHER USER
        // ======================================================

        sendRoomMessage({
          type: "sign",
          word: prediction,
          sentence: formedSentence,
          confidence: result.confidence,
        });

        console.log(
          "ASL sign sent to room:",
          prediction
        );
      }
    } catch (error) {
      console.error(
        "Sign prediction error:",
        error
      );
      setPredictionError(
        error instanceof Error ? error.message : "Sign recognition failed."
      );
      if (error instanceof SignPredictionError && error.status === 503) {
        predictionUnavailableRef.current = true;
      }
    } finally {
      predictionBusyRef.current = false;
      setIsPredicting(false);
    }
  }, [
    isRunning,
    isPredicting,
    setDetectedWord,
    setConfidence,
    sentence,
    appendDetectedSign,
    appendTranslatedSign,
    conversationLanguage,
    sendRoomMessage,
  ]);

  predictSequenceRef.current = predictSequence;

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      void predictSequenceRef.current();
    }, 7000);
    void predictSequenceRef.current();
    return () => window.clearInterval(timer);
  }, [isRunning]);

  // ============================================================
  // CAMERA CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className={`bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden ${compact ? "flex h-full min-h-0 flex-col" : ""}`}>
      {/* HEADER */}

      <div className={`flex items-center justify-between border-b border-slate-800 ${compact ? "p-3" : "p-5"}`}>
        <div className="flex items-center gap-3">
          <Camera className="text-blue-400" />

          <h2 className={`font-bold text-white ${compact ? "text-base" : "text-xl"}`}>
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
          {isRunning ? "● Live" : "● Offline"}
        </div>
      </div>

      {/* CAMERA PREVIEW */}

      <div className={`flex items-center justify-center bg-black ${compact ? "min-h-0 flex-1" : "h-[420px]"}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* CONTROLS */}

      <div className={`flex items-center justify-center gap-2 border-t border-slate-800 ${compact ? "flex-wrap p-2" : "gap-4 p-5"}`}>
        {/* START CAMERA */}

        <button
          onClick={startCamera}
          disabled={isRunning}
          className={`flex items-center gap-2 rounded-xl bg-blue-600 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-3 py-2 text-sm" : "px-5 py-3"}`}
        >
          <Play size={18} />
          Start Camera
        </button>

        {/* STOP */}

        <button
          onClick={stopCamera}
          disabled={!isRunning}
          className={`flex items-center gap-2 rounded-xl bg-red-600 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-3 py-2 text-sm" : "px-5 py-3"}`}
        >
          <Square size={18} />
          Stop
        </button>

        <p className={`text-slate-300 ${compact ? "w-full text-center text-xs" : "text-sm"}`} aria-live="polite">
          {predictionUnavailableRef.current
            ? "ASL recognition is unavailable"
            : isPredicting
              ? "Recognizing sign…"
              : isRunning
                ? "Live recognition is active"
                : "Start the camera for live recognition"}
        </p>
      </div>
      {predictionError ? (
        <p role="alert" className={`text-amber-300 ${compact ? "px-3 pb-2 text-xs" : "px-5 pb-5 text-sm"}`}>
          {predictionError}
        </p>
      ) : null}
    </div>
  );
}
