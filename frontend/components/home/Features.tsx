import { Camera, BrainCircuit, Languages, UserRound, Link2 } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const features = [
  {
    icon: Camera,
    title: "Camera-based sign recognition",
    description: "The camera sends a sequence of frames to the ASL model while recognition is active."
  },
  {
    icon: BrainCircuit,
    title: "A focused ASL vocabulary",
    description: "The trained model recognizes 22 individual sign classes. It is a prototype vocabulary, not general sentence translation."
  },
  {
    icon: Languages,
    title: "Speech and text input",
    description: "Transcribe English, Hindi, or Kannada speech, or type a message. Supported English words can drive avatar signs."
  },
  {
    icon: UserRound,
    title: "3D signing avatar",
    description: "The avatar plays an animation when a message contains a sign with an available 3D animation."
  },
  {
    icon: Link2,
    title: "Shared conversation rooms",
    description: "Create a room and share its invite link. Participants exchange recognized signs, transcripts, and typed messages through the same backend."
  }
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-slate-900 px-5 py-20 text-white sm:px-8 sm:py-24">
      <Reveal>
        <h2 className="mb-16 text-center text-4xl font-bold sm:text-5xl">
          What you can do
        </h2>
      </Reveal>

      <Reveal className="mx-auto -mt-10 mb-12 max-w-3xl text-center text-slate-400" delay={0.08}>
        SignBridge brings camera recognition, speech transcription, text, and avatar playback into one shared room. Current recognition and signing coverage is limited to the project’s available model labels and animations.
      </Reveal>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Reveal key={feature.title} delay={index * 0.06}>
            <article className="h-full rounded-2xl border border-slate-700 bg-slate-800 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500">
              <Icon size={48} className="text-blue-400 mb-6" />

              <h3 className="mb-3 text-xl font-semibold">
                {feature.title}
              </h3>

              <p className="leading-7 text-slate-400">
                {feature.description}
              </p>
            </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
