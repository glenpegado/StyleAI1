"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Sparkles, Shirt, TrendingUp } from "lucide-react";
import { useState } from "react";
import { usePrompt } from "@/contexts/PromptContext";
import SignupPaymentDialog from "@/components/signup-payment-dialog";

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const { promptCount, incrementPrompt, hasReachedLimit } = usePrompt();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasReachedLimit) {
      setShowDialog(true);
      return;
    }

    if (searchQuery.trim()) {
      incrementPrompt();

      // Check if this increment reached the limit
      if (promptCount + 1 >= 7) {
        setShowDialog(true);
      } else {
        // Here you would normally process the search
        console.log("Processing search:", searchQuery);
        // For now, just show an alert
        alert(
          `Search processed: "${searchQuery}". Prompts used: ${promptCount + 1}/7`,
        );
      }
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-black to-indigo-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">
                  AI-Powered Fashion Assistant
                </span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-8 tracking-tight">
              Your Personal{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Urban Stylist
              </span>{" "}
              AI
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover complete outfit ideas based on your favorite brands and
              items. Get both high-end options and affordable alternatives that
              match your Gen-Z streetwear style.
            </p>

            {/* AI Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Show me how to style my new Chrome Hearts jewelry"
                  className="w-full px-6 py-4 text-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
                >
                  Style Me
                </button>
              </form>
              <div className="flex justify-between items-center mt-3">
                <p className="text-gray-400 text-sm">
                  Try: "Louis Vuitton bag outfit" or "Carhartt beanie style"
                </p>
                <p className="text-gray-400 text-sm">
                  {promptCount}/7 free prompts used
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-gray-300 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors text-lg font-medium border border-white/20"
              >
                View Dashboard
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 text-gray-300 bg-transparent rounded-lg hover:text-white transition-colors text-lg font-medium"
              >
                See How It Works
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <Shirt className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Complete Outfit Ideas</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <TrendingUp className="w-5 h-5 text-pink-400" />
                <span className="text-sm">Real-time Trends</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-sm">Budget Alternatives</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SignupPaymentDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}
