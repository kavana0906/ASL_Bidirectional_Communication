import { Cpu, Activity, Languages, CheckCircle } from "lucide-react";

export default function StatusPanel() {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">

      <h2 className="text-2xl font-bold mb-6">
        AI Status
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <Cpu className="mx-auto text-blue-400 mb-2" size={32} />
          <p className="text-gray-400 text-sm">Model</p>
          <h3 className="font-bold text-green-400">
            Online
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <Activity className="mx-auto text-pink-400 mb-2" size={32} />
          <p className="text-gray-400 text-sm">FPS</p>
          <h3 className="font-bold">
            30
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
          <p className="text-gray-400 text-sm">
            Confidence
          </p>
          <h3 className="font-bold">
            95%
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <Languages className="mx-auto text-yellow-400 mb-2" size={32} />
          <p className="text-gray-400 text-sm">
            Language
          </p>
          <h3 className="font-bold">
            English
          </h3>
        </div>

      </div>

    </div>
  );
}