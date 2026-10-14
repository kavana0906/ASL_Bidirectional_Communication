import Contact from "@/components/home/Contact";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <Contact />
      <Footer />
    </main>
  );
}
