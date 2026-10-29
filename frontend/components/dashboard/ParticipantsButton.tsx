"use client";

import { useState } from "react";

type ParticipantsButtonProps = {
  userCount: number;
  participants: string[];
  currentUser: string;
};

export default function ParticipantsButton({
  userCount,
  participants,
  currentUser,
}: ParticipantsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const count = participants.length || userCount;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={`Show meeting participants. ${count} users`}
        onClick={() => setIsOpen((open) => !open)}
        className="w-full rounded-lg text-left outline-none transition hover:bg-slate-800/70 focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <span className="block text-sm text-slate-400">
          Users <span className="ml-1 text-xs text-blue-300">View names⌄</span>
        </span>
        <span className="mt-1 block text-lg font-bold text-white">{count}</span>
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="Meeting participants"
          className="absolute left-0 top-full z-30 mt-2 min-w-56 rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-xl"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            In this meeting
          </p>
          {participants.length > 0 ? (
            <ul className="space-y-1">
              {participants.map((participant, index) => (
                <li
                  key={`${participant}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 text-sm text-white"
                >
                  <span className="truncate">{participant || "Guest"}</span>
                  {participant === currentUser && (
                    <span className="shrink-0 text-xs text-blue-300">You</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-2 text-sm text-slate-400">Waiting for participants…</p>
          )}
        </div>
      )}
    </div>
  );
}
