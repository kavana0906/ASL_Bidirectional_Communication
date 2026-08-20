import { Camera, BrainCircuit, Languages, UserRound } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Live Sign Detection",
    description: "Capture sign language in real-time using your webcam."
  },
  {
    icon: BrainCircuit,
    title: "AI Recognition",
    description: "Advanced AI accurately recognizes ASL gestures instantly."
  },
  {
    icon: Languages,
    title: "Multi-Language",
    description: "Translate between English, Kannada, Hindi and ASL."
  },
  {
    icon: UserRound,
    title: "3D Avatar",
    description: "Convert speech into expressive sign language using a 3D avatar."
  }
];

export default function Features() {
  return (
    <section className="py-24 px-8 bg-slate-900 text-white">
      <h2 className="text-5xl font-bold text-center mb-16">
        Powerful Features
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-700 bg-slate-800 p-8 hover:border-blue-500 hover:scale-105 transition-all duration-300"
            >
              <Icon size={48} className="text-blue-400 mb-6" />

              <h3 className="text-2xl font-semibold mb-4">
                {feature.title}
              </h3>

              <p className="text-slate-400">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}