"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Sparkles,
  Shirt,
  TrendingUp,
  Loader2,
  ShoppingBag,
  Star,
  ExternalLink,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { usePrompt } from "@/contexts/PromptContext";
import SignupPaymentDialog from "@/components/signup-payment-dialog";

interface OutfitItem {
  name: string;
  description: string;
  price: string;
  original_price?: string;
  brand: string;
  website: string;
  website_url: string;
  image_url: string;
  availability: string;
}

interface OutfitSuggestion {
  main_description: string;
  tops: OutfitItem[];
  accessories: OutfitItem[];
  shoes: OutfitItem[];
}

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [outfitSuggestions, setOutfitSuggestions] =
    useState<OutfitSuggestion | null>(null);
  const { promptCount, incrementPrompt, hasReachedLimit } = usePrompt();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasReachedLimit) {
      setShowDialog(true);
      return;
    }

    if (searchQuery.trim()) {
      setIsLoading(true);
      incrementPrompt();

      try {
        const response = await fetch("/api/generate-outfit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to generate outfit";
          try {
            const errorData = await response.json();

            // Handle quota errors specifically
            if (
              errorData.type === "quota_exceeded" ||
              (response.status === 429 &&
                (errorData.error?.includes("quota") ||
                  errorData.error?.includes("exceeded your current quota") ||
                  errorData.details?.includes("quota") ||
                  errorData.error?.includes("billing hard limit")))
            ) {
              errorMessage =
                "💳 OpenAI API quota exceeded!\n\n" +
                "If you just paid for OpenAI:\n" +
                "• Wait 2-3 minutes for your quota to update\n" +
                "• Then try your request again\n\n" +
                "Otherwise:\n" +
                "• Check usage: https://platform.openai.com/account/usage\n" +
                "• Add billing: https://platform.openai.com/account/billing\n\n" +
                "Your quota updates automatically after payment.";
            } else if (response.status === 429) {
              errorMessage =
                "⏳ Rate limit reached\n\n" +
                "Too many requests in a short time. " +
                "Please wait 30-60 seconds and try again.\n\n" +
                "This is different from quota limits - " +
                "it's just temporary traffic control.";
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }

            if (errorData.details) {
              console.error("API Error details:", errorData.details);
            }
          } catch (parseError) {
            console.error("Could not parse error response:", parseError);
            if (response.status === 429) {
              errorMessage =
                "⏳ Service temporarily unavailable due to high demand. Please try again in a few minutes.";
            } else {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setOutfitSuggestions(data);

        // Check if this increment reached the limit
        if (promptCount + 1 >= 7) {
          setShowDialog(true);
        }
      } catch (error) {
        console.error("Error generating outfit:", error);

        let errorMessage =
          "Sorry, there was an error generating your outfit. Please try again.";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Show user-friendly alert with proper formatting
        if (
          errorMessage.includes("AI returned invalid JSON") ||
          errorMessage.includes("Response formatting error")
        ) {
          alert(
            "🤖 AI Response Error\n\n" +
              "The AI service returned a response in an unexpected format. " +
              "This sometimes happens when the service is under high load.\n\n" +
              "Please try your request again with a slightly different wording, " +
              "or wait a moment and retry.",
          );
        } else {
          alert(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderOutfitSection = (
    title: string,
    items: OutfitItem[],
    icon: React.ReactNode,
  ) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-purple-400">{icon}</div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-white mb-1">{item.name}</h4>
                <p className="text-sm text-gray-400">{item.brand}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {item.original_price && (
                    <span className="text-xs text-gray-500 line-through">
                      {item.original_price}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-green-400">
                    {item.price}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.availability === "In Stock"
                        ? "bg-green-400"
                        : item.availability === "Limited Stock"
                          ? "bg-yellow-400"
                          : "bg-orange-400"
                    }`}
                  />
                  <span className="text-xs text-gray-400">
                    {item.availability}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-3">{item.description}</p>

            {/* Product Image */}
            <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700 relative overflow-hidden mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Try a few different fallback strategies
                    if (!target.dataset.fallbackAttempt) {
                      target.dataset.fallbackAttempt = "1";
                      // First fallback: try a generic fashion image
                      target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&auto=format`;
                    } else if (target.dataset.fallbackAttempt === "1") {
                      target.dataset.fallbackAttempt = "2";
                      // Second fallback: try another fashion image
                      target.src = `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop&auto=format`;
                    } else {
                      // Final fallback: show placeholder with item info
                      target.style.display = "none";
                      const placeholder =
                        target.parentElement?.querySelector(
                          ".image-placeholder",
                        );
                      if (placeholder) {
                        (placeholder as HTMLElement).style.display = "flex";
                      }
                    }
                  }}
                />
              ) : (
                <div className="image-placeholder flex flex-col items-center justify-center text-center p-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-gray-400 text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs">{item.brand}</p>
                </div>
              )}
              {/* Hidden placeholder for fallback */}
              <div className="image-placeholder hidden flex-col items-center justify-center text-center p-4">
                <ShoppingBag className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-400 text-sm">{item.name}</p>
                <p className="text-gray-500 text-xs">{item.brand}</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Website and Purchase Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">
                    {item.website.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-gray-300">{item.website}</span>
              </div>
              <a
                href={item.website_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
              >
                <ShoppingBag className="w-3 h-3" />
                Shop
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-black to-indigo-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div
              className={
                outfitSuggestions
                  ? ""
                  : "lg:col-span-2 text-center max-w-4xl mx-auto"
              }
            >
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
                items. Get both high-end options and affordable alternatives
                that match your Gen-Z streetwear style.
              </p>

              {/* AI Search Bar */}
              <div className="max-w-4xl mx-auto mb-12">
                <form onSubmit={handleSearch} className="relative">
                  <textarea
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Show me how to style my new Chrome Hearts jewelry"
                    className="w-full px-6 py-6 text-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none min-h-[80px] max-h-[200px] overflow-y-auto"
                    disabled={isLoading}
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute right-3 bottom-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Styling...
                      </>
                    ) : (
                      "Style Me"
                    )}
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

              {!outfitSuggestions && (
                <>
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
                </>
              )}
            </div>

            {/* Outfit Suggestions Panel */}
            {outfitSuggestions && (
              <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Your Styled Outfit
                  </h2>
                  <p className="text-gray-300 text-lg">
                    {outfitSuggestions.main_description}
                  </p>
                  <button
                    onClick={() => setOutfitSuggestions(null)}
                    className="mt-4 text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    Try Another Search
                  </button>
                </div>

                <div className="space-y-6">
                  {renderOutfitSection(
                    "Tops",
                    outfitSuggestions.tops,
                    <Shirt className="w-5 h-5" />,
                  )}
                  {renderOutfitSection(
                    "Accessories",
                    outfitSuggestions.accessories,
                    <Star className="w-5 h-5" />,
                  )}
                  {renderOutfitSection(
                    "Shoes",
                    outfitSuggestions.shoes,
                    <ShoppingBag className="w-5 h-5" />,
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SignupPaymentDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}
