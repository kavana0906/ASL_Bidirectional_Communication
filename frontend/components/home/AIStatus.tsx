import { Camera, Mic, Cpu, UserRound } from "lucide-react";

const statusItems = [
  { icon: Camera, label: "Camera", status: "Ready" },
  { icon: Mic, label: "Microphone", status: "Ready" },
  { icon: Cpu, label: "AI Engine", status: "Online" },
  { icon: UserRound, label: "3D Avatar", status: "Loaded" },
];

export default function AIStatus() {
  return (
    <section className="py-20 px-8 bg-slate-950 text-white">
      <h2 className="text-4xl font-bold text-center mb-12">
        AI System Status
      </h2>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {statusItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl bg-slate-800 border border-slate-700 p-6 hover:border-green-500 transition"
            >
              <div className="flex items-center gap-4">
                <Icon className="text-blue-400" size={32} />
                <span className="text-lg">{item.label}</span>
              </div>

              <span className="text-green-400 font-semibold">
                ● {item.status}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}