"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import TopBar from "@/components/dashboard/TopBar";
import CameraPanel from "@/components/dashboard/CameraPanel";
import TranslationPanel from "@/components/dashboard/TranslationPanel";
import AvatarPanel from "@/components/dashboard/AvatarPanel";
import SpeechPanel from "@/components/dashboard/SpeechPanel";
import NormalMeeting from "@/components/dashboard/NormalMeeting";

import { useTranslation } from "@/context/TranslationContext";

export default function MeetingPage() {
  const searchParams = useSearchParams();

 const roomId = searchParams.get("room") || "UNKNOWN";
const userName = searchParams.get("user") || "Guest";
const mode = searchParams.get("mode") || "asl";

  // ============================================================
  // TRANSLATION CONTEXT
  // ============================================================

  const {
    setDetectedWord,
    appendDetectedSign,
    setSpeechText,
    setSentence,
  } = useTranslation();

  // ============================================================
  // ROOM / WEBSOCKET STATE
  // ============================================================

  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  // ============================================================
  // CHAT STATE
  // ============================================================

  const [messages, setMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState("");

  function addSpeechTranscript(text: string) {
    setMessages((prev) => [...prev, `🎤 You: ${text}`]);
  }

  const socketRef = useRef<WebSocket | null>(null);

  // ============================================================
  // WEBSOCKET CONNECTION
  // ============================================================

  useEffect(() => {
    if (!roomId || roomId === "UNKNOWN") {
      console.log("No room ID found.");
      return;
    }

    console.log(`Connecting to room: ${roomId}`);
    console.log(`User: ${userName}`);

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/${roomId}`
    );

    socketRef.current = socket;

    // ==========================================================
    // CONNECTION OPEN
    // ==========================================================

    socket.onopen = () => {
      console.log("WebSocket connected!");

      setConnected(true);

      // Current user is connected
      setUserCount(1);
    };

    // ==========================================================
    // RECEIVE MESSAGE
    // ==========================================================

    socket.onmessage = (event) => {
      console.log("Message received:");
      console.log(event.data);

      try {
        const data = JSON.parse(event.data);

        console.log("Parsed message:", data);

        // ======================================================
        // USER JOINED
        // ======================================================

        if (data.type === "user_joined") {
          console.log("A user joined the room.");

          setUserCount(data.user_count);
        }

        // ======================================================
        // USER LEFT
        // ======================================================

        else if (data.type === "user_left") {
          console.log("A user left the room.");

          setUserCount(data.user_count);
        }

        // ======================================================
        // CHAT MESSAGE
        // ======================================================

        else if (data.type === "chat") {
          console.log("Chat message received:", data);

          setMessages((prev) => [
            ...prev,
            `${data.user}: ${data.message}`,
          ]);
        }

        // ======================================================
        // REMOTE ASL SIGN
        // ======================================================

        else if (data.type === "sign") {
          console.log("Remote ASL sign received:", data);

          const word = data.word || "";

          if (word) {
            // Show received sign as detected word
            setDetectedWord(word);

            // Use the sender's full sentence snapshot when available.
            // Older sign messages still work by appending the individual word.
            if (typeof data.sentence === "string") {
              setSentence(data.sentence);
            } else {
              appendDetectedSign(word);
            }

            setMessages((prev) => [
      ...prev,
      `🤟 ASL User: ${word}`,
    ]);
          }
        }

        // ======================================================
        // REMOTE SPEECH
        // ======================================================

        else if (data.type === "speech") {
          console.log("Remote speech received:", data);

          const text = data.text || "";

          if (text) {
            // Show received speech
            setSpeechText(text);

            // Add speech to sentence
            setSentence(text);

            // Send received word/text to avatar
            setDetectedWord(text);

            setMessages((prev) => [
      ...prev,
      `🎤 Speech: ${data.originalText || text}`,
    ]);
          }
        }

        // ======================================================
        // OTHER MESSAGE
        // ======================================================

        else {
          console.log("Other room message:", data);
        }

      } catch (error) {
        console.error(
          "Failed to parse WebSocket message:",
          error
        );
      }
    };

    // ==========================================================
    // WEBSOCKET ERROR
    // ==========================================================

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);

      setConnected(false);
    };

    // ==========================================================
    // WEBSOCKET CLOSED
    // ==========================================================

    socket.onclose = () => {
      console.log("WebSocket disconnected.");

      setConnected(false);
    };

    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {
      console.log("Closing WebSocket...");

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };

  }, [
    roomId,
    userName,
    setDetectedWord,
    appendDetectedSign,
    setSpeechText,
    setSentence,
  ]);

  // ============================================================
  // SEND ROOM MESSAGE
  // ============================================================

  function sendRoomMessage(data: object) {
    if (
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.log("WebSocket is not connected.");
      return;
    }

    console.log("Sending room message:", data);

    socketRef.current.send(
      JSON.stringify(data)
    );
  }

  // ============================================================
  // CHAT MESSAGE
  // ============================================================

  function sendMessage() {
    if (!messageInput.trim()) {
      return;
    }

    if (
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.log("WebSocket is not connected.");
      return;
    }

    const message = {
      type: "chat",
      message: messageInput,
      user: userName,
    };

    socketRef.current.send(
      JSON.stringify(message)
    );

    // Show our own message immediately
    setMessages((prev) => [
      ...prev,
      `You: ${messageInput}`,
    ]);

    setMessageInput("");
  }

  // ============================================================
  // UI
  // ============================================================

 return (
  <>
    {mode === "normal" ? (
      <NormalMeeting
        roomId={roomId}
        userName={userName}
        connected={connected}
        userCount={userCount}
        messages={messages}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
        sendRoomMessage={sendRoomMessage}
        onSpeechTranscript={addSpeechTranscript}
      />
    ) : (
      <main className="min-h-screen bg-slate-950 text-white">

        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <TopBar />

        {/* =====================================================
            ROOM INFORMATION
        ===================================================== */}

        <div className="px-5 pt-5">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <div className="grid grid-cols-4 gap-5">

              {/* ROOM */}

              <div>
                <p className="text-slate-400 text-sm">
                  Room
                </p>

                <p className="text-white text-lg font-bold mt-1">
                  {roomId}
                </p>
              </div>

              {/* USER */}

              <div>
                <p className="text-slate-400 text-sm">
                  User
                </p>

                <p className="text-white text-lg font-bold mt-1">
                  {userName}
                </p>
              </div>

              {/* CONNECTION */}

              <div>
                <p className="text-slate-400 text-sm">
                  Connection
                </p>

                <p
                  className={`text-lg font-bold mt-1 ${
                    connected
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  <span className="mr-2">
                    ●
                  </span>

                  {connected
                    ? "Connected"
                    : "Disconnected"}
                </p>
              </div>

              {/* USERS */}

              <div>
                <p className="text-slate-400 text-sm">
                  Users
                </p>

                <p className="text-white text-lg font-bold mt-1">
                  {userCount}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            ROOM CHAT
        ===================================================== */}

        <div className="px-5 pt-5">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <h2 className="text-xl font-bold mb-4">
              Room Communication Test
            </h2>

            {/* CONVERSATION */}

<div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 min-h-[250px] max-h-[400px] overflow-y-auto mb-4">

  {messages.length === 0 ? (
    <div className="flex items-center justify-center h-[200px]">
      <div className="text-center">

        <div className="text-5xl mb-4">
          💬
        </div>

        <p className="text-slate-300 font-medium">
          No messages yet
        </p>

        <p className="text-slate-500 text-sm mt-1">
          Start communicating with the other participant.
        </p>

      </div>
    </div>
  ) : (
    <div className="space-y-3">

      {messages.map((message, index) => {

        const isASL = message.startsWith("🤟");
        const isSpeech = message.startsWith("🎤");
        const isOutgoingSpeech = message.startsWith("🎤 You:");
        const isText = message.startsWith("💬");
        const isYou = message.startsWith("You:");

        return (
          <div
            key={index}
            className={`flex ${
              isYou
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 border ${
                isYou || isOutgoingSpeech
                  ? "bg-blue-600 border-blue-500"
                  : "bg-slate-800 border-slate-700"
              }`}
            >

              <div className="text-xs text-slate-400 mb-1">
                {isASL
                  ? "🤟 Sign Language"
                  : isSpeech
                  ? isOutgoingSpeech ? "🎤 Speech · You" : "🎤 Speech"
                  : isText
                  ? "💬 Text"
                  : isYou
                  ? "You"
                  : "Message"}
              </div>

              <p className="text-white break-words">
                {isOutgoingSpeech ? message.replace("🎤 You: ", "") : message}
              </p>

            </div>

          </div>
        );
      })}

    </div>
  )}

</div>

            {/* INPUT */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <input
                type="text"
                value={messageInput}
                onChange={(e) =>
                  setMessageInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Type a test message..."
                className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <SpeechPanel
                sendRoomMessage={sendRoomMessage}
                onTranscript={addSpeechTranscript}
                disabled={!connected}
              />

              <button
                onClick={sendMessage}
                disabled={!connected}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold"
              >
                Send
              </button>

            </div>

          </div>

        </div>

        {/* =====================================================
            EXISTING ASL MEETING AREA
        ===================================================== */}

        <div className="grid grid-cols-12 gap-5 p-5">

          {/* CAMERA */}

          <div className="col-span-8">

            <CameraPanel
              sendRoomMessage={sendRoomMessage}
            />

          </div>

          {/* RIGHT SIDE */}

          <div className="col-span-4 flex flex-col gap-5">

            {/* AI TRANSLATION */}

            <TranslationPanel />

            {/* 3D AVATAR */}

            <AvatarPanel />

          </div>

        </div>

      </main>
    )}
  </>
);
}
