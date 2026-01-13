import { Navbar } from "@/components/LandingPage/Navbar";
import { Hero } from "@/components/LandingPage/Hero";
import { Features } from "@/components/LandingPage/Features";
import { Testimonials } from "@/components/LandingPage/Testimonials";
import { FAQ } from "@/components/LandingPage/FAQ";
import { Footer } from "@/components/LandingPage/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
