import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <Link href="/" className="text-xl font-bold text-white">SignBridge AI</Link>
          <p className="mt-2">
            A communication prototype using signs, speech, text, and an avatar.
          </p>
        </div>

        <nav aria-label="Footer navigation" className="mt-6 flex gap-5 md:mt-0">
          <Link href="/features" className="transition hover:text-white">Features</Link>
          <Link href="/about" className="transition hover:text-white">About</Link>
          <Link href="/contact" className="transition hover:text-white">Contact</Link>
        </nav>

        <div className="mt-6 md:mt-0">
          © 2026 SignBridge AI. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
