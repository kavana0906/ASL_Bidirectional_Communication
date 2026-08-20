export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h3 className="text-white text-xl font-bold">SignBridge AI</h3>
          <p className="mt-2">
            Bridging Communication Through Artificial Intelligence
          </p>
        </div>

        <div className="mt-6 md:mt-0">
          © 2026 SignBridge AI. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}