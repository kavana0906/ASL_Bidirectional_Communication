"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative flex flex-col items-center justify-center h-[85vh] overflow-hidden text-center text-white">

      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px]" />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10"
      >
        <span className="px-5 py-2 rounded-full border border-blue-500 bg-blue-500/10 text-blue-300">
          🚀 AI Powered Communication
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="z-10 mt-8 text-7xl font-extrabold"
      >
        SignBridge AI
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="z-10 mt-6 max-w-3xl text-xl text-slate-300"
      >
        Real-time bidirectional sign language translation using AI,
        Speech Recognition and a 3D Avatar.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="z-10 flex gap-6 mt-12"
      >
        <button
  onClick={() => router.push("/create-room")}
  className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold transition hover:scale-105 hover:bg-blue-700"
>
  Create Room
</button>

<button
  onClick={() => router.push("/join-room")}
  className="rounded-xl bg-purple-600 px-8 py-4 text-lg font-semibold transition hover:scale-105 hover:bg-purple-700"
>
  Join Room
</button>
      </motion.div>

    </section>
  );
}