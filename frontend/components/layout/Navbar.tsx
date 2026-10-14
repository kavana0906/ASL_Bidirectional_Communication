import Link from "next/link";

export default function Navbar() {
  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 px-5 py-5 backdrop-blur sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
      <Link href="/" className="text-xl font-bold text-white sm:text-2xl">
        🤟 SignBridge AI
      </Link>

      <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 text-sm text-white sm:gap-8 sm:text-base">
        <Link href="/" className="transition hover:text-blue-400">
          Home
        </Link>

        <Link href="/features" className="transition hover:text-blue-400">
          Features
        </Link>

        <Link href="/about" className="transition hover:text-blue-400">
          About
        </Link>

        <Link href="/contact" className="transition hover:text-blue-400">
          Contact
        </Link>
      </div>
      </div>
    </nav>
  );
}
