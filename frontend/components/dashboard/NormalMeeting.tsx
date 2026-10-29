"use client";

import { useState } from "react";
import TranslationPanel from "@/components/dashboard/TranslationPanel";
import SpeechPanel from "@/components/dashboard/SpeechPanel";
import CameraPanel from "@/components/dashboard/CameraPanel";
import TopBar from "@/components/dashboard/TopBar";
import ParticipantsButton from "@/components/dashboard/ParticipantsButton";

type NormalMeetingProps = {
  roomId: string;
  userName: string;
  connected: boolean;
  userCount: number;
  participants: string[];
  messages: string[];
  messageInput: string;
  setMessageInput: (value: string) => void;
  sendMessage: () => void;
  sendRoomMessage: (data: object) => void;
  onSpeechTranscript: (text: string) => void;
  onLeaveRoom: () => void;
};

export default function NormalMeeting({
  roomId,
  userName,
  connected,
  userCount,
  participants,
  messages,
  messageInput,
  setMessageInput,
  sendMessage,
  sendRoomMessage,
  onSpeechTranscript,
  onLeaveRoom,
}: NormalMeetingProps) {
  const [inviteCopied, setInviteCopied] = useState(false);

  async function copyInviteLink() {
    const inviteUrl = new URL("/join-room", window.location.origin);
    inviteUrl.searchParams.set("room", roomId);
    await navigator.clipboard.writeText(inviteUrl.toString());
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <TopBar />

      {/* Header */}
      <div className="px-5 pt-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
            Normal user
          </p>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-5 lg:grid-cols-4">
              <div>
                <p className="text-slate-400 text-sm">Room</p>
                <p className="text-white text-lg font-bold mt-1">{roomId}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">User</p>
                <p className="text-white text-lg font-bold mt-1">{userName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Connection</p>
                <p className={`text-lg font-bold mt-1 ${connected ? "text-green-400" : "text-red-400"}`}>
                  <span className="mr-2">●</span>{connected ? "Connected" : "Disconnected"}
                </p>
              </div>
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
                onClick={onLeaveRoom}
                className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                Leave Room
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Communication Area */}
      <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-12">

        <div className="order-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 xl:col-span-6">

          <h1 className="text-2xl font-bold mb-2">
           ● Live Conversation
          </h1>

          <p className="text-slate-400 mb-6">
          </p>

          {/* Conversation */}
<div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 min-h-[380px] max-h-[500px] overflow-y-auto mb-5">

  {messages.length === 0 ? (
    <div className="flex items-center justify-center h-[330px]">
      <div className="text-center">
        <div className="text-5xl mb-4">💬</div>

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
              isYou ? "justify-end" : "justify-start"
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

          {/* Text Input */}
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
              placeholder="Type your message..."
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <SpeechPanel
              sendRoomMessage={sendRoomMessage}
              onTranscript={onSpeechTranscript}
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

          <TranslationPanel />

        </div>

        <div className="order-1 xl:col-span-6">
          <CameraPanel sendRoomMessage={sendRoomMessage} />
        </div>

      </div>

    </main>
  );
}
