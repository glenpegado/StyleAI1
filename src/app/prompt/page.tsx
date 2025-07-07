"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";

export default function PromptPage() {
  const searchParams = useSearchParams();
  const [initialQuery, setInitialQuery] = useState("");
  const [initialCelebrity, setInitialCelebrity] = useState<string | null>(null);

  useEffect(() => {
    const query = searchParams.get("query");
    const celebrity = searchParams.get("celebrity");

    if (query) {
      setInitialQuery(query);
    }
    if (celebrity) {
      setInitialCelebrity(celebrity);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="transition-all duration-300 ease-out">
        <Hero
          showSearch={true}
          initialQuery={initialQuery}
          initialCelebrity={initialCelebrity}
        />
      </div>
    </div>
  );
}
