import { ArrowRight, Camera, MessageSquareText, Volume2 } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const steps = [
  {
    icon: Camera,
    title: "Capture a sign",
    description: "Allow camera access and show a sign from the model’s supported vocabulary.",
  },
  {
    icon: MessageSquareText,
    title: "Share the message",
    description: "The room relays recognized signs, speech transcripts, and typed messages to connected participants.",
  },
  {
    icon: Volume2,
    title: "Read, hear, or watch",
    description: "Messages appear as text, can be spoken aloud, and can trigger matching avatar animations when available.",
  },
];

export default function About() {
  return (
    <section id="about" className="scroll-mt-24 bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="mb-3 font-semibold uppercase tracking-[0.2em] text-blue-400">About SignBridge</p>
          <h2 className="text-3xl font-bold sm:text-5xl">A prototype for more accessible conversations</h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            SignBridge explores how camera-based sign recognition, speech transcription, text, and a 3D avatar can help people communicate in a shared online room. It is an early-stage project; outputs are limited by the sign model, translation coverage, and animation library included here.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 0.1}>
            <article className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-7 transition-colors hover:border-blue-500">
              <Icon aria-hidden="true" className="mb-5 text-blue-400" size={32} />
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{description}</p>
            </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
          <ArrowRight aria-hidden="true" className="mt-0.5 shrink-0 text-amber-300" size={18} />
          <p>
            SignBridge does not yet translate unrestricted ASL sentences. The current recognition model has 22 sign labels, and the avatar can only play signs for which an animation is available.
          </p>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
