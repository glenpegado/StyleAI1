import Hero from "@/components/hero";
import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="transition-all duration-300 ease-out">
        <Hero />
      </div>
    </div>
  );
}
