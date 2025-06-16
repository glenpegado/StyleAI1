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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  bottoms: OutfitItem[];
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateOutfit = async (query: string) => {
    if (hasReachedLimit) {
      setShowDialog(true);
      return;
    }

    // Show loading state immediately
    setOutfitSuggestions({ loading: true } as any);
    setIsLoading(true);

    // Increment prompt count after successful API call to prevent issues with auto-reset
    // incrementPrompt();

    try {
      const response = await fetch("/api/generate-outfit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
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

      // Increment prompt count after successful generation
      incrementPrompt();

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
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await generateOutfit(searchQuery);
    }
  };

  const handleStyleClick = async (query: string) => {
    setSearchQuery(query); // Update search query to match the clicked style
    await generateOutfit(query);
  };

  // Auto-scroll effect with infinite loop
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current && isAutoScrolling) {
          const container = scrollContainerRef.current;
          const maxScrollLeft = container.scrollWidth - container.clientWidth;

          // Check if we've reached the end
          if (container.scrollLeft >= maxScrollLeft - 1) {
            // Instantly reset to beginning for seamless loop
            container.scrollLeft = 0;
          } else {
            // Scroll right by 1 pixel for smooth movement
            container.scrollLeft += 1;
          }
        }
      }, 30); // Adjust speed by changing interval (lower = faster)
    };

    if (isAutoScrolling) {
      startAutoScroll();
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling]);

  const scrollLeft = () => {
    setIsAutoScrolling(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
    // Resume auto-scroll after 3 seconds
    setTimeout(() => setIsAutoScrolling(true), 3000);
  };

  const scrollRight = () => {
    setIsAutoScrolling(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
    // Resume auto-scroll after 3 seconds
    setTimeout(() => setIsAutoScrolling(true), 3000);
  };

  const handleCarouselMouseEnter = () => {
    setIsAutoScrolling(false);
  };

  const handleCarouselMouseLeave = () => {
    setIsAutoScrolling(true);
  };

  const [currentItemIndices, setCurrentItemIndices] = useState<{
    [key: number]: number;
  }>({});

  const navigateItem = (
    itemIndex: number,
    direction: "prev" | "next",
    allItems: OutfitItem[],
  ) => {
    const currentIndex = currentItemIndices[itemIndex] || 0;
    let newIndex;

    if (direction === "next") {
      newIndex = currentIndex + 1 >= allItems.length ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex - 1 < 0 ? allItems.length - 1 : currentIndex - 1;
    }

    setCurrentItemIndices((prev) => ({
      ...prev,
      [itemIndex]: newIndex,
    }));
  };

  const renderOutfitItems = (
    outfitData: OutfitSuggestion,
    celebrityName?: string,
  ) => {
    // Use the structured data from API response
    const groupedItems = {
      tops: outfitData.tops || [],
      bottoms: outfitData.bottoms || [],
      shoes: outfitData.shoes || [],
      accessories: outfitData.accessories || [],
    };

    const allCategories = Object.entries(groupedItems).filter(
      ([_, items]) => items.length > 0,
    );
    const displayItems = allCategories.map(([category, categoryItems]) => {
      const currentIndex =
        currentItemIndices[
          allCategories.findIndex(([cat]) => cat === category)
        ] || 0;
      return categoryItems[currentIndex] || categoryItems[0];
    });

    const totalPrice = displayItems.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[$,]/g, "")) || 0;
      return sum + price;
    }, 0);

    return (
      <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl p-6 shadow-xl w-96 h-auto min-h-[500px] mx-auto border border-violet-100">
        {/* Celebrity Header */}
        {celebrityName && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrityName}`}
                alt={celebrityName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">
                {celebrityName}
              </h3>
              <p className="text-gray-600 text-sm">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="ml-auto">
              <button className="p-2 hover:bg-violet-100 rounded-full transition-colors">
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Items List with Swipeable Alternatives */}
        <div className="space-y-4">
          {allCategories.map(([category, categoryItems], categoryIndex) => {
            const currentIndex = currentItemIndices[categoryIndex] || 0;
            const currentItem = categoryItems[currentIndex] || categoryItems[0];
            const hasAlternatives = categoryItems.length > 1;

            return (
              <div key={categoryIndex} className="relative">
                <a
                  href={currentItem.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 py-3 px-2 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer group"
                >
                  {/* Navigation Buttons */}
                  {hasAlternatives && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigateItem(categoryIndex, "prev", categoryItems);
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigateItem(categoryIndex, "next", categoryItems);
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </>
                  )}

                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-cyan-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ml-2">
                    {currentItem.image_url ? (
                      <img
                        src={currentItem.image_url}
                        alt={currentItem.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&auto=format`;
                        }}
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-gray-500" />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 mr-2 w-48">
                    <h4 className="font-semibold text-gray-800 text-base truncate">
                      {currentItem.brand}
                    </h4>
                    <p className="text-gray-600 text-sm truncate">
                      {currentItem.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-semibold text-gray-800 text-base truncate">
                        {currentItem.price}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-gray-500 text-xs truncate max-w-16">
                          {currentItem.website}
                        </p>
                        {hasAlternatives && (
                          <div className="flex gap-1">
                            {categoryItems.map((_, index) => (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  index === currentIndex
                                    ? "bg-violet-500"
                                    : "bg-violet-200"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* External Link Icon */}
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="border-t border-violet-200 pt-4 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-base">Total:</span>
            <span className="font-bold text-gray-800 text-xl">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-cyan-50">
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
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-cyan-100 rounded-full border border-violet-200">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="text-violet-800 text-sm font-medium">
                    AI-Powered Fashion Assistant
                  </span>
                </div>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-gray-800 mb-8 tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600">
                  Urban Stylist
                </span>{" "}
                AI
              </h1>

              <p className="text-xl text-gray-600 mb-12 max-w-xl mx-auto leading-relaxed">
                AI-powered outfit suggestions with budget alternatives
              </p>

              {/* AI Search Bar */}
              <div className="max-w-4xl mx-auto mb-12">
                <form onSubmit={handleSearch} className="relative">
                  <textarea
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Show me how to style my new Chrome Hearts jewelry"
                    className="w-full px-6 py-6 text-lg bg-white border border-violet-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-300 resize-none min-h-[80px] max-h-[200px] overflow-y-auto shadow-lg"
                    disabled={isLoading}
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute right-3 bottom-3 px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
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
                <div className="flex justify-end items-center mt-3">
                  <p className="text-gray-500 text-sm">{promptCount}/7 free</p>
                </div>
              </div>

              {/* Trending Styles Carousel */}
              <div className="max-w-7xl mx-auto mb-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Trending
                  </h3>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                  {/* Left Arrow */}
                  <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 border border-violet-200 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <ChevronLeft className="w-5 h-5 text-violet-600" />
                  </button>

                  {/* Right Arrow */}
                  <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 border border-violet-200 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <ChevronRight className="w-5 h-5 text-violet-600" />
                  </button>

                  {/* Scrollable Container */}
                  <div
                    ref={scrollContainerRef}
                    className="flex space-x-4 overflow-x-auto scrollbar-hide px-12 py-4"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    onMouseEnter={handleCarouselMouseEnter}
                    onMouseLeave={handleCarouselMouseLeave}
                  >
                    {[
                      // Mix of celebrities and influencers
                      {
                        name: "Bella Hadid",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "TikTok",
                            color: "bg-gradient-to-r from-blue-400 to-pink-500",
                          },
                        ],
                        query: "Bella Hadid TikTok viral street style outfit",
                        image:
                          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Emma Chamberlain",
                        tags: [
                          {
                            name: "Influencer",
                            color:
                              "bg-gradient-to-r from-pink-400 to-purple-500",
                          },
                          {
                            name: "YouTube",
                            color: "bg-gradient-to-r from-red-500 to-red-600",
                          },
                        ],
                        query:
                          "Emma Chamberlain casual influencer street style",
                        image:
                          "https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Michael B. Jordan",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Streetwear",
                            color: "bg-gradient-to-r from-gray-400 to-gray-600",
                          },
                        ],
                        query:
                          "Michael B Jordan streetwear casual celebrity outfit",
                        image:
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Zendaya",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Fashion Week",
                            color: "bg-gradient-to-r from-red-400 to-pink-500",
                          },
                        ],
                        query: "Zendaya red carpet inspired street outfit",
                        image:
                          "https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "A$AP Rocky",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Streetwear",
                            color: "bg-gradient-to-r from-gray-400 to-gray-600",
                          },
                        ],
                        query: "ASAP Rocky streetwear fashion celebrity outfit",
                        image:
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Rihanna",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Fenty",
                            color: "bg-gradient-to-r from-pink-400 to-red-500",
                          },
                        ],
                        query: "Rihanna casual street style celebrity outfit",
                        image:
                          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Tyler, The Creator",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Golf Wang",
                            color:
                              "bg-gradient-to-r from-green-400 to-blue-500",
                          },
                        ],
                        query:
                          "Tyler the Creator Golf Wang colorful streetwear",
                        image:
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "SZA",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "R&B Style",
                            color:
                              "bg-gradient-to-r from-purple-500 to-pink-500",
                          },
                        ],
                        query: "SZA R&B singer casual street style outfit",
                        image:
                          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Frank Ocean",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Minimalist",
                            color: "bg-gradient-to-r from-gray-400 to-gray-600",
                          },
                        ],
                        query: "Frank Ocean minimalist aesthetic street style",
                        image:
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Solange",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Avant-garde",
                            color: "bg-gradient-to-r from-pink-400 to-red-500",
                          },
                        ],
                        query: "Solange avant garde artistic fashion outfit",
                        image:
                          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Kendrick Lamar",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Hip-Hop",
                            color:
                              "bg-gradient-to-r from-red-400 to-orange-500",
                          },
                        ],
                        query: "Kendrick Lamar hip hop street style outfit",
                        image:
                          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Lupita Nyong'o",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Elegant",
                            color:
                              "bg-gradient-to-r from-purple-400 to-pink-500",
                          },
                        ],
                        query: "Lupita Nyongo elegant street style outfit",
                        image:
                          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Donald Glover",
                        tags: [
                          {
                            name: "Celebrity",
                            color:
                              "bg-gradient-to-r from-yellow-400 to-orange-500",
                          },
                          {
                            name: "Creative",
                            color:
                              "bg-gradient-to-r from-green-400 to-blue-500",
                          },
                        ],
                        query: "Donald Glover creative casual street outfit",
                        image:
                          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&solange&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "James Charles",
                        tags: [
                          {
                            name: "Influencer",
                            color:
                              "bg-gradient-to-r from-pink-400 to-purple-500",
                          },
                          {
                            name: "Beauty",
                            color:
                              "bg-gradient-to-r from-purple-400 to-pink-400",
                          },
                        ],
                        query:
                          "James Charles colorful beauty influencer outfit",
                        image:
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Addison Rae",
                        tags: [
                          {
                            name: "Influencer",
                            color:
                              "bg-gradient-to-r from-pink-400 to-purple-500",
                          },
                          {
                            name: "TikTok",
                            color: "bg-gradient-to-r from-blue-400 to-pink-500",
                          },
                        ],
                        query: "Addison Rae TikTok influencer casual outfit",
                        image:
                          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Nikkie Tutorials",
                        tags: [
                          {
                            name: "Influencer",
                            color:
                              "bg-gradient-to-r from-pink-400 to-purple-500",
                          },
                          {
                            name: "YouTube",
                            color: "bg-gradient-to-r from-red-500 to-red-600",
                          },
                        ],
                        query: "Nikkie Tutorials bold makeup influencer style",
                        image:
                          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Y2K Revival",
                        tags: [
                          {
                            name: "TikTok",
                            color: "bg-gradient-to-r from-blue-400 to-pink-500",
                          },
                        ],
                        query:
                          "Y2K fashion low rise jeans crop top TikTok trend",
                        image:
                          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Clean Girl Aesthetic",
                        tags: [
                          {
                            name: "Instagram",
                            color:
                              "bg-gradient-to-r from-purple-500 to-pink-500",
                          },
                        ],
                        query: "clean girl aesthetic minimal Instagram outfit",
                        image:
                          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Cargo Pants Trend",
                        tags: [
                          {
                            name: "TikTok",
                            color: "bg-gradient-to-r from-blue-400 to-pink-500",
                          },
                        ],
                        query: "cargo pants streetwear TikTok outfit",
                        image:
                          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Dark Academia",
                        tags: [
                          {
                            name: "Instagram",
                            color:
                              "bg-gradient-to-r from-purple-500 to-pink-500",
                          },
                        ],
                        query: "dark academia blazer vintage Instagram style",
                        image:
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Oversized Blazers",
                        tags: [
                          {
                            name: "TikTok",
                            color: "bg-gradient-to-r from-blue-400 to-pink-500",
                          },
                        ],
                        query: "oversized blazer streetwear TikTok outfit",
                        image:
                          "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&h=250&fit=crop&auto=format",
                      },
                      {
                        name: "Cottagecore Vibes",
                        tags: [
                          {
                            name: "Instagram",
                            color:
                              "bg-gradient-to-r from-purple-500 to-pink-500",
                          },
                        ],
                        query: "cottagecore aesthetic flowy dress Instagram",
                        image:
                          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=250&fit=crop&auto=format",
                      },
                    ].map((trend, index) => (
                      <button
                        key={index}
                        onClick={() => handleStyleClick(trend.query)}
                        className="flex-shrink-0 group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
                      >
                        <div className="relative w-40 h-52">
                          {/* Background Image */}
                          <img
                            src={trend.image}
                            alt={trend.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=250&fit=crop&auto=format";
                            }}
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-lg" />

                          {/* Multiple Tags */}
                          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
                            {trend.tags.map((tag, tagIndex) => (
                              <div
                                key={tagIndex}
                                className={`px-2 py-1 rounded-full text-xs font-medium text-white ${tag.color} shadow-lg`}
                              >
                                {tag.name}
                              </div>
                            ))}
                          </div>

                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h4 className="text-white font-semibold text-sm leading-tight mb-1">
                              {trend.name}
                            </h4>
                            <p className="text-gray-200 text-xs">
                              Click to style
                            </p>
                          </div>

                          {/* Hover Effect */}
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <style jsx>{`
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {!outfitSuggestions && (
                <>
                  <div className="flex justify-center items-center mb-12">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-8 py-4 text-gray-700 bg-white border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
                    >
                      Get Started
                      <ArrowUpRight className="ml-2 w-5 h-5" />
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Outfit Suggestions Panel */}
            {outfitSuggestions && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <button
                    onClick={() => setOutfitSuggestions(null)}
                    className="text-violet-600 hover:text-violet-700 text-sm underline mb-4"
                  >
                    Try Another Search
                  </button>
                </div>

                <div className="flex justify-center">
                  {(() => {
                    // Show loading state
                    if ((outfitSuggestions as any)?.loading) {
                      return (
                        <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl p-6 shadow-xl w-96 h-auto min-h-[500px] mx-auto border border-violet-100">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 animate-pulse" />
                            <div>
                              <div className="h-5 bg-violet-200 rounded animate-pulse w-24 mb-2" />
                              <div className="h-4 bg-violet-200 rounded animate-pulse w-20" />
                            </div>
                          </div>
                          <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="flex items-center gap-4 py-2"
                              >
                                <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-cyan-100 rounded-lg animate-pulse" />
                                <div className="flex-1">
                                  <div className="h-4 bg-violet-200 rounded animate-pulse w-20 mb-2" />
                                  <div className="h-3 bg-violet-200 rounded animate-pulse w-32 mb-2" />
                                  <div className="h-4 bg-violet-200 rounded animate-pulse w-16" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-violet-200 pt-4 mt-6">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-base">
                                Loading...
                              </span>
                              <div className="h-6 bg-violet-200 rounded animate-pulse w-20" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Enhanced celebrity detection from search query and trending clicks
                    const detectCelebrity = (query: string) => {
                      const lowerQuery = query.toLowerCase();

                      // More comprehensive celebrity detection
                      if (
                        lowerQuery.includes("chris brown") ||
                        lowerQuery.includes("chris")
                      )
                        return "Chris Brown";
                      if (
                        lowerQuery.includes("bella hadid") ||
                        lowerQuery.includes("bella")
                      )
                        return "Bella Hadid";
                      if (
                        lowerQuery.includes("michael b") ||
                        lowerQuery.includes("michael")
                      )
                        return "Michael B. Jordan";
                      if (lowerQuery.includes("zendaya")) return "Zendaya";
                      if (
                        lowerQuery.includes("asap") ||
                        lowerQuery.includes("rocky") ||
                        lowerQuery.includes("a$ap")
                      )
                        return "A$AP Rocky";
                      if (lowerQuery.includes("rihanna")) return "Rihanna";
                      if (
                        lowerQuery.includes("tyler") ||
                        lowerQuery.includes("creator")
                      )
                        return "Tyler, The Creator";
                      if (lowerQuery.includes("sza")) return "SZA";
                      if (
                        lowerQuery.includes("frank") ||
                        lowerQuery.includes("ocean")
                      )
                        return "Frank Ocean";
                      if (lowerQuery.includes("solange")) return "Solange";
                      if (
                        lowerQuery.includes("kendrick") ||
                        lowerQuery.includes("lamar")
                      )
                        return "Kendrick Lamar";
                      if (lowerQuery.includes("lupita"))
                        return "Lupita Nyong'o";
                      if (
                        lowerQuery.includes("donald") ||
                        lowerQuery.includes("glover")
                      )
                        return "Donald Glover";

                      return undefined;
                    };

                    const celebrityName = detectCelebrity(searchQuery);

                    return renderOutfitItems(outfitSuggestions, celebrityName);
                  })()}
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
