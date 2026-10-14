import Features from "@/components/home/Features";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <Features />
      <Footer />
    </main>
  );
}
