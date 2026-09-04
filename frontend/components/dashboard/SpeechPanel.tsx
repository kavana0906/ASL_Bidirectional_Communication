"use client";

import {
  useState,
} from "react";

import {
  Mic,
  Square,
} from "lucide-react";

import {
  useTranslation,
} from "@/context/TranslationContext";

import {
  startRecording,
  stopRecording,
} from "@/services/audioRecorder";

import {
  speechToText,
} from "@/services/api";


// ============================================================
// PROPS
// ============================================================

interface SpeechPanelProps {
  sendRoomMessage: (data: object) => void;
}


// ============================================================
// COMPONENT
// ============================================================

export default function SpeechPanel({
  sendRoomMessage,
}: SpeechPanelProps) {

  const {
    speechText,
    setSpeechText,
    setSentence,
  } = useTranslation();


  const [
    isListening,
    setIsListening,
  ] = useState(false);


  // ============================================================
  // START LISTENING
  // ============================================================

  async function startListening() {

    try {

      await startRecording();

      setIsListening(true);

    } catch (error) {

      console.error(
        "Microphone error:",
        error
      );

      alert(
        "Unable to access microphone."
      );

    }
  }


  // ============================================================
  // STOP LISTENING
  // ============================================================

  async function stopListening() {

    try {

      const audioBlob =
        await stopRecording();


      setIsListening(false);


      console.log(
        "Sending audio to Whisper..."
      );


      // ========================================================
      // WHISPER
      // ========================================================

      const result =
        await speechToText(
          audioBlob
        );


      console.log(
        "Whisper result:",
        result
      );


      const text =
        result.text || "";


      // ========================================================
      // UPDATE LOCAL UI
      // ========================================================

      setSpeechText(text);

      setSentence(text);


      // ========================================================
      // SEND SPEECH TO OTHER USER
      // ========================================================

      if (text.trim()) {

        sendRoomMessage({

          type: "speech",

          text: text,

        });


        console.log(
          "Speech text sent to room:",
          text
        );

      }

    } catch (error) {

      console.error(
        "Speech-to-text error:",
        error
      );

      setIsListening(false);

    }
  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="bg-slate-900 rounded-3xl border border-slate-800 h-full p-6">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex justify-between mb-6">

        <h2 className="text-2xl font-bold">
          Speech Input
        </h2>


        <span
          className={`font-semibold ${
            isListening
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {isListening
            ? "Listening..."
            : "Stopped"}
        </span>

      </div>


      {/* ====================================================== */}
      {/* SPEECH TEXT */}
      {/* ====================================================== */}

      <div className="bg-slate-800 rounded-2xl p-6 h-[220px] overflow-auto">

        <p className="text-gray-400 mb-3">
          Live Speech
        </p>

        <p className="text-2xl leading-relaxed">
          {speechText ||
            "Start speaking..."}
        </p>

      </div>


      {/* ====================================================== */}
      {/* CONTROLS */}
      {/* ====================================================== */}

      <div className="flex gap-4 mt-6">

        {/* START */}

        <button
          onClick={startListening}
          disabled={isListening}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-xl flex items-center justify-center gap-2"
        >

          <Mic size={18} />

          Start

        </button>


        {/* STOP */}

        <button
          onClick={stopListening}
          disabled={!isListening}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-xl flex items-center justify-center gap-2"
        >

          <Square size={18} />

          Stop

        </button>

      </div>

    </div>
  );
}