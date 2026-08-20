export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-10 py-6">
      <h1 className="text-2xl font-bold text-white">
        🤟 SignBridge AI
      </h1>

      <div className="flex gap-8 text-white">
        <a href="#" className="hover:text-blue-400 transition">
          Home
        </a>

        <a href="#" className="hover:text-blue-400 transition">
          Features
        </a>

        <a href="#" className="hover:text-blue-400 transition">
          About
        </a>

        <a href="#" className="hover:text-blue-400 transition">
          Contact
        </a>
      </div>
    </nav>
  );
}