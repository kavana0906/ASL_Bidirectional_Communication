"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TopBar from "@/components/dashboard/TopBar";
import CameraPanel from "@/components/dashboard/CameraPanel";
import TranslationPanel from "@/components/dashboard/TranslationPanel";
import AvatarPanel from "@/components/dashboard/AvatarPanel";
import SpeechPanel from "@/components/dashboard/SpeechPanel";
import NormalMeeting from "@/components/dashboard/NormalMeeting";
import ParticipantsButton from "@/components/dashboard/ParticipantsButton";
import { roomSocketUrl } from "@/services/api";
import { speak } from "@/services/speech";
import { browserLocale } from "@/services/signLanguage";
import { translateText } from "@/services/api";
import { stopContinuousRecording } from "@/services/audioRecorder";

import { useTranslation } from "@/context/TranslationContext";

export default function MeetingPage() {
  const router = useRouter();
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
    setTranslatedText,
    conversationLanguage,
  } = useTranslation();

  // ============================================================
  // ROOM / WEBSOCKET STATE
  // ============================================================

  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);

  // ============================================================
  // CHAT STATE
  // ============================================================

  const [messages, setMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  function addSpeechTranscript(text: string) {
    setMessages((prev) => [...prev, `🎤 You: ${text}`]);
  }

  const socketRef = useRef<WebSocket | null>(null);
  const conversationLanguageRef = useRef(conversationLanguage);
  conversationLanguageRef.current = conversationLanguage;

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

    const socket = new WebSocket(roomSocketUrl(roomId, userName));

    socketRef.current = socket;

    // ==========================================================
    // CONNECTION OPEN
    // ==========================================================

    socket.onopen = () => {
      console.log("WebSocket connected!");

      setConnected(true);

      // Current user is connected
      setUserCount(1);
      setParticipants([userName]);
    };

    // ==========================================================
    // RECEIVE MESSAGE
    // ==========================================================

    socket.onmessage = async (event) => {
      console.log("Message received:");
      console.log(event.data);

      try {
        const data = JSON.parse(event.data);

        console.log("Parsed message:", data);

        // ======================================================
        // USER JOINED
        // ======================================================

        if (data.type === "room_state" || data.type === "user_joined") {
          console.log("A user joined the room.");

          if (Array.isArray(data.participants)) {
            setParticipants(data.participants);
          }
          setUserCount(data.user_count ?? data.participants?.length ?? 1);
        }

        // ======================================================
        // USER LEFT
        // ======================================================

        else if (data.type === "user_left") {
          console.log("A user left the room.");

          if (Array.isArray(data.participants)) {
            setParticipants(data.participants);
          }
          setUserCount(data.user_count ?? data.participants?.length ?? 1);
        }

        // ======================================================
        // CHAT MESSAGE
        // ======================================================

        else if (data.type === "chat") {
          console.log("Chat message received:", data);

          const sourceText = data.message || "";
          const sourceLanguage = data.sourceLanguage || "auto";
          setMessages((prev) => [...prev, `${data.user}: ${sourceText}`]);
          const [output, english] = await Promise.all([
            translateText(sourceText, sourceLanguage, conversationLanguageRef.current),
            sourceLanguage === "en"
              ? Promise.resolve({ text: sourceText })
              : translateText(sourceText, sourceLanguage, "en"),
          ]);

          setSentence(english.text || sourceText);
          setDetectedWord(english.text || sourceText);
          setTranslatedText(output.text || sourceText);
          speak(output.text || sourceText, browserLocale(conversationLanguageRef.current));
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
            setMessages((prev) => [...prev, `🤟 ASL User: ${word}`]);
            const signSentence = typeof data.sentence === "string" ? data.sentence : word;
            const output = await translateText(signSentence, "en", conversationLanguageRef.current);
            setTranslatedText(output.text || signSentence);
            speak(output.text || signSentence, browserLocale(conversationLanguageRef.current));

            // Use the sender's full sentence snapshot when available.
            // Older sign messages still work by appending the individual word.
            if (typeof data.sentence === "string") {
              setSentence(data.sentence);
            } else {
              appendDetectedSign(word);
            }

          }
        }

        // ======================================================
        // REMOTE SPEECH
        // ======================================================

        else if (data.type === "speech") {
          console.log("Remote speech received:", data);

          const text = data.text || "";
          const originalText = data.originalText || text;
          const sourceLanguage = data.sourceLanguage || "en";

          if (text) {
            setSpeechText(originalText);
            setMessages((prev) => [...prev, `🎤 Speech: ${originalText}`]);
            const output = await translateText(originalText, sourceLanguage, conversationLanguageRef.current);
            // Show received speech
            setTranslatedText(output.text || originalText);

            // Add speech to sentence
            setSentence(text);

            // Send received word/text to avatar
            setDetectedWord(text);
            speak(output.text || originalText, browserLocale(conversationLanguageRef.current));

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
        setTranslatedText(error instanceof Error ? error.message : "Translation unavailable.");
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
    setTranslatedText,
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

  async function leaveRoom() {
    try {
      await stopContinuousRecording();
    } catch (error) {
      console.error("Could not stop the microphone cleanly:", error);
    }

    const socket = socketRef.current;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close(1000, "Participant left the room");
    }
    socketRef.current = null;
    router.replace("/");
  }

  // ============================================================
  // CHAT MESSAGE
  // ============================================================

  async function sendMessage() {
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

    const sourceText = messageInput.trim();
    const message = {
      type: "chat",
      message: sourceText,
      user: userName,
      sourceLanguage: "auto",
    };

    socketRef.current.send(JSON.stringify(message));
    setMessages((prev) => [...prev, `You: ${sourceText}`]);
    setMessageInput("");

    try {
      const output = await translateText(sourceText, "auto", conversationLanguage);
      const english = conversationLanguage === "en"
        ? output
        : await translateText(sourceText, output.source_language || "auto", "en");
      setSentence(english.text || sourceText);
      setDetectedWord(english.text || sourceText);
      setTranslatedText(output.text || sourceText);
    } catch (error) {
      setTranslatedText(error instanceof Error ? error.message : "Translation unavailable.");
    }

  }

  async function copyInviteLink() {
    const inviteUrl = new URL("/join-room", window.location.origin);
    inviteUrl.searchParams.set("room", roomId);
    await navigator.clipboard.writeText(inviteUrl.toString());
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 2000);
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
        participants={participants}
        messages={messages}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
        sendRoomMessage={sendRoomMessage}
        onSpeechTranscript={addSpeechTranscript}
        onLeaveRoom={() => void leaveRoom()}
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

          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
              ASL user
            </p>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid flex-1 grid-cols-2 gap-5 lg:grid-cols-4">

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

              <ParticipantsButton
                userCount={userCount}
                participants={participants}
                currentUser={userName}
              />

              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void copyInviteLink()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                >
                  {inviteCopied ? "Invite link copied" : "Copy invite link"}
                </button>
                <button
                  type="button"
                  onClick={() => void leaveRoom()}
                  className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
                >
                  Leave Room
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            ROOM CHAT
        ===================================================== */}

        <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-12">

          <div className="order-1 xl:col-span-6">
            <CameraPanel sendRoomMessage={sendRoomMessage} />
          </div>

          <div className="order-2 flex min-h-[620px] flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5 xl:col-span-6">

            <h2 className="mb-4 text-xl font-bold">
              Live Conversation
            </h2>

            {/* CONVERSATION */}

<div className="mb-4 min-h-[380px] flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-5">

  {messages.length === 0 ? (
    <div className="flex h-[200px] items-center justify-center">
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
              className={`max-w-[40%] rounded-2xl px-4 py-3 border ${
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

          <div className="order-3 xl:col-span-6">
            <TranslationPanel />
          </div>

          <div className="order-4 min-w-0 xl:col-span-6">
            <AvatarPanel />
          </div>
        </div>

      </main>
    )}
  </>
);
}
