import About from "@/components/home/About";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <About />
      <Footer />
    </main>
  );
}
