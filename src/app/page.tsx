import Hero from "@/components/hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="transition-all duration-300 ease-out">
        <Hero />
      </div>
    </div>
  );
}
