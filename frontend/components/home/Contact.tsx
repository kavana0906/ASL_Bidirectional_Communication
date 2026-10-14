import Link from "next/link";
import { Headphones, KeyRound, MessagesSquare } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const helpItems = [
  {
    icon: KeyRound,
    title: "Joining a room",
    description: "Open the invite link, enter your name, choose a mode, and join. You can also enter the room code manually.",
  },
  {
    icon: Headphones,
    title: "Camera and microphone access",
    description: "Allow browser permissions when prompted. Camera and microphone access generally requires HTTPS outside localhost.",
  },
  {
    icon: MessagesSquare,
    title: "Support for this instance",
    description: "This project has no public support address configured. If you joined from an invite, contact the person who shared it; for a self-hosted copy, contact its administrator.",
  },
];

export default function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 bg-slate-900 px-5 py-20 text-white sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="mb-3 font-semibold uppercase tracking-[0.2em] text-blue-400">Contact & help</p>
          <h2 className="text-3xl font-bold sm:text-5xl">Need help getting started?</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Here are the basics for joining and using a SignBridge conversation.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {helpItems.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 0.1}>
            <article className="h-full rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-blue-500">
              <Icon aria-hidden="true" className="mb-4 text-blue-400" size={30} />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{description}</p>
            </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex flex-wrap justify-center gap-4" delay={0.2}>
          <Link href="/create-room" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700">
            Create a room
          </Link>
          <Link href="/join-room" className="rounded-xl border border-slate-600 px-6 py-3 font-semibold transition hover:border-blue-400 hover:text-blue-300">
            Join a room
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
