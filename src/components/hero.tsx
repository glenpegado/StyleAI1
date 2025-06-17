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
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePrompt } from "@/contexts/PromptContext";
import SignupPaymentDialog from "@/components/signup-payment-dialog";
import { createClient } from "../../supabase/client";

function useSupabase() {
  const supabase = createClient();
  return { supabase };
}

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

interface CelebrityTrend {
  name: string;
  tags: { name: string; color: string }[];
  query: string;
  image: string;
  fragrance?: string;
}

interface CelebrityData {
  name: string;
  image: string;
  fragrance: string;
}

interface HeroProps {
  showSearch?: boolean;
}

export default function Hero({ showSearch = true }: HeroProps = {}) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion | null>(null);
  const [showSignInDialog, setShowSignInDialog] = useState<boolean>(false);
  const [selectedCelebrity, setSelectedCelebrity] = useState<string | null>(null);
  const [showLookModal, setShowLookModal] = useState<boolean>(false);
  const [selectedLookData, setSelectedLookData] = useState<any | null>(null);
  const [currentCelebLookIndex, setCurrentCelebLookIndex] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { promptCount, incrementPrompt, hasReachedLimit } = usePrompt();
  const { supabase } = useSupabase();

  // Celebrity data with images and fragrances
  const celebrities = {
    "Bella Hadid": {
      image:
        "https://hips.hearstapps.com/hmg-prod/images/bella-hadid-is-seen-on-february-25-2023-in-paris-france-news-photo-1677419264.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
      fragrance: "Orebella Nightcap",
    },
    "Michael B. Jordan": {
      image:
        "https://www.gq.com/verso/static/gq/assets/michael-b-jordan-style-evolution-gq-2023-tout.jpg",
      fragrance: "Coach For Men",
    },
    Zendaya: {
      image:
        "https://hips.hearstapps.com/hmg-prod/images/zendaya-attends-the-dune-part-two-world-premiere-at-news-photo-1708439058.jpg?crop=0.66667xw:1xh;center,top&resize=1200:*",
      fragrance: "Lancôme Idôle",
    },
    "A$AP Rocky": {
      image:
        "https://www.gq.com/verso/static/gq/assets/asap-rocky-style-evolution-gq-2023.jpg",
      fragrance: "Dior Sauvage",
    },
    Rihanna: {
      image:
        "https://hips.hearstapps.com/hmg-prod/images/rihanna-is-seen-on-february-12-2023-in-paris-france-news-photo-1676230847.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
      fragrance: "Fenty Eau de Parfum",
    },
    "Tyler, The Creator": {
      image:
        "https://www.gq.com/verso/static/gq/assets/tyler-the-creator-style-evolution-gq-2023.jpg",
      fragrance: "Le Labo Santal 33",
    },
  };

  // Event Handlers
  const handleSearch = async (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const suggestions = await fetchOutfitSuggestions(searchQuery);
      setOutfitSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching outfit suggestions:', error);
      setOutfitSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        handleSearch(e);
      }
    }, 1000);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -window.innerWidth * 0.8,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: window.innerWidth * 0.8,
        behavior: 'smooth'
      });
    }
  };

  const handleCarouselMouseEnter = () => {
    setIsAutoScrolling(false);
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
  };

  const handleCarouselMouseLeave = () => {
    setIsAutoScrolling(true);
    startAutoScroll();
  };

  const startAutoScroll = () => {
    if (isAutoScrolling && !autoScrollIntervalRef.current) {
      autoScrollIntervalRef.current = setInterval(() => {
        scrollRight();
      }, 5000);
    }
  };

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isAutoScrolling]);

  // Helper function to safely render outfit items
  const renderOutfitItems = (
    outfitData: OutfitSuggestion | null,
    celebrityName?: string,
    celebrityData?: { name: string; image: string; fragrance: string }
  ) => {
    if (!outfitData) return null;

    return (
      <div className="bg-white">
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
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight px-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600">
                    Urban Stylist
                  </span>{" "}
                  <span className="text-gray-900">AI</span>
                </h1>

                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
                  Discover complete outfit ideas with high-end options and
                  budget-friendly alternatives
                </p>

                {/* AI Search Bar - Only show if showSearch is true */}
                {showSearch && (
                  <div className="max-w-2xl mx-auto mb-12 px-4">
                    <form onSubmit={handleSearch} className="relative">
                      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-300">
                        <textarea
                          value={searchQuery}
                          onChange={handleTextareaChange}
                          placeholder={
                            searchQuery.trim()
                              ? "Describe your style or ask for outfit ideas..."
                              : currentTypingText ||
                                "Describe your style or ask for outfit ideas..."
                          }
                          className="w-full px-4 sm:px-6 py-4 pr-20 sm:pr-32 text-sm sm:text-base bg-transparent border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
                          disabled={isLoading}
                          rows={1}
                          style={{ height: searchQuery ? textareaHeight : "56px" }}
                        />
                        <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex items-center gap-1 sm:gap-2">
                          <div className="text-xs text-gray-400 hidden md:block">
                            {promptCount}/7 free
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading || !searchQuery.trim()}
                            className="px-2 sm:px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-xs sm:text-sm shadow-md hover:shadow-lg flex-shrink-0"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Styling...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">Style</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Outfit Suggestions Panel - Show at bottom of search area */}
                {outfitSuggestions && showSearch && (
                  <div className="max-w-2xl mx-auto mb-12 px-4">
                    <div className="text-center mb-6">
                      <button
                        onClick={() => {
                          setOutfitSuggestions(null);
                          setSelectedCelebrity(null);
                          setCurrentItemIndices({});
                        }}
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
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto border border-gray-200 overflow-hidden">
                              {/* Header with celebrity info */}
                              <div className="flex items-center gap-3 p-4 bg-gray-50">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 animate-pulse" />
                                <div className="flex-1">
                                  <div className="h-5 bg-gray-300 rounded animate-pulse w-24 mb-2" />
                                  <div className="h-4 bg-gray-300 rounded animate-pulse w-20" />
                                </div>
                                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
                              </div>

                              {/* Outfit items */}
                              <div className="p-4 space-y-4">
                                {[1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-4 py-2"
                                  >
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                                    <div className="flex-1">
                                      <div className="h-4 bg-gray-300 rounded animate-pulse w-20 mb-2" />
                                      <div className="h-3 bg-gray-300 rounded animate-pulse w-32 mb-2" />
                                      <div className="h-4 bg-gray-300 rounded animate-pulse w-16" />
                                    </div>
                                    <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
                                  </div>
                                ))}
                              </div>

                              {/* Total */}
                              <div className="border-t border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 text-base">
                                    Loading...
                                  </span>
                                  <div className="h-6 bg-gray-300 rounded animate-pulse w-20" />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Enhanced celebrity detection from search query and trending clicks
                        const detectCelebrity = (query: string) => {
                          const lowerQuery = query.toLowerCase();

                          // Celebrity data with images and fragrances
                          const celebrities = {
                            "Bella Hadid": {
                              image:
                                "https://hips.hearstapps.com/hmg-prod/images/bella-hadid-is-seen-on-february-25-2023-in-paris-france-news-photo-1677419264.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
                              fragrance: "Orebella Nightcap",
                            },
                            "Michael B. Jordan": {
                              image:
                                "https://www.gq.com/verso/static/gq/assets/michael-b-jordan-style-evolution-gq-2023-tout.jpg",
                              fragrance: "Coach For Men",
                            },
                            Zendaya: {
                              image:
                                "https://hips.hearstapps.com/hmg-prod/images/zendaya-attends-the-dune-part-two-world-premiere-at-news-photo-1708439058.jpg?crop=0.66667xw:1xh;center,top&resize=1200:*",
                              fragrance: "Lancôme Idôle",
                            },
                            "A$AP Rocky": {
                              image:
                                "https://www.gq.com/verso/static/gq/assets/asap-rocky-style-evolution-gq-2023.jpg",
                              fragrance: "Dior Sauvage",
                            },
                            Rihanna: {
                              image:
                                "https://hips.hearstapps.com/hmg-prod/images/rihanna-is-seen-on-february-12-2023-in-paris-france-news-photo-1676230847.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
                              fragrance: "Fenty Eau de Parfum",
                            },
                            "Tyler, The Creator": {
                              image:
                                "https://www.gq.com/verso/static/gq/assets/tyler-the-creator-style-evolution-gq-2023.jpg",
                              fragrance: "Le Labo Santal 33",
                            },
                          };

                          // More comprehensive celebrity detection
                          if (
                            lowerQuery.includes("bella hadid") ||
                            lowerQuery.includes("bella")
                          )
                            return {
                              name: "Bella Hadid",
                              ...celebrities["Bella Hadid"],
                            };
                          if (
                            lowerQuery.includes("michael b") ||
                            lowerQuery.includes("michael")
                          )
                            return {
                              name: "Michael B. Jordan",
                              ...celebrities["Michael B. Jordan"],
                            };
                          if (lowerQuery.includes("zendaya"))
                            return { name: "Zendaya", ...celebrities["Zendaya"] };
                          if (
                            lowerQuery.includes("asap") ||
                            lowerQuery.includes("rocky") ||
                            lowerQuery.includes("a$ap")
                          )
                            return {
                              name: "A$AP Rocky",
                              ...celebrities["A$AP Rocky"],
                            };
                          if (lowerQuery.includes("rihanna"))
                            return { name: "Rihanna", ...celebrities["Rihanna"] };
                          if (
                            lowerQuery.includes("tyler") ||
                            lowerQuery.includes("creator")
                          )
                            return {
                              name: "Tyler, The Creator",
                              ...celebrities["Tyler, The Creator"],
                            };

                          return undefined;
                        };

                        const celebrityData = detectCelebrity(searchQuery);

                        return renderOutfitItems(
                          outfitSuggestions,
                          celebrityData?.name,
                          celebrityData,
                        );
                      })()
                    </div>
                  </div>
                )}
              </div>

              {/* Trending Styles Carousel or Celebrity Looks - Only show if no outfit suggestions and showSearch is true */}
              {!outfitSuggestions && showSearch && (
                <div className="max-w-7xl mx-auto mb-12">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      {selectedCelebrity ? selectedCelebrity : "Trending"}
                    </h3>
                  </div>

                  {/* Carousel Container or Celebrity Looks */}
                  {selectedCelebrity ? (
                    /* Celebrity Looks Tinder-style Cards */
                    <div className="relative max-w-sm mx-auto">
                      {/* Card Stack */}
                      <div className="relative h-96">
                        {Array.from({ length: Math.min(4, 4) }, (_, index) => {
                          const cardIndex = (currentCelebLookIndex + index) % 4;
                          const imageId = 1441986300917 + cardIndex * 123456789;
                          const isActive = index === 0;
                          const zIndex = 4 - index;
                          const scale = 1 - index * 0.05;
                          const translateY = index * 8;

                          return (
                            <div
                              key={cardIndex}
                              className={`absolute inset-0 transition-all duration-300 ${
                                isActive
                                  ? "cursor-pointer"
                                  : "pointer-events-none"
                              }`}
                              style={{
                                zIndex,
                                transform: `scale(${scale}) translateY(${translateY}px)`,
                                opacity: index < 3 ? 1 : 0,
                              }}
                            >
                              <button
                                onClick={() => {
                                  if (isActive) {
                                    handleStyleClick(
                                      `${selectedCelebrity} look ${cardIndex + 1} outfit inspiration`,
                                    );
                                  }
                                }}
                                className="w-full h-full group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl"
                                disabled={!isActive}
                              >
                                <div className="relative w-full h-full">
                                  <img
                                    src={`https://images.unsplash.com/photo-${imageId}?w=400&h=600&fit=crop&auto=format`}
                                    alt={`${selectedCelebrity} Look ${cardIndex + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=250&fit=crop&auto=format`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-lg" />

                                  <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
                                    {[
                                      {
                                        name: "Celebrity",
                                        color:
                                          "bg-gradient-to-r from-yellow-400 to-orange-500",
                                      },
                                      {
                                        name: "TikTok",
                                        color:
                                          "bg-gradient-to-r from-blue-400 to-pink-500",
                                      },
                                    ].map((tag, tagIndex) => (
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
                                      {selectedCelebrity}
                                    </h4>
                                    <p className="text-gray-200 text-xs">
                                      Click to style
                                    </p>
                                  </div>

                                  {/* Hover Effect */}
                                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Navigation Controls */}
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                          onClick={() =>
                            setCurrentCelebLookIndex((prev) => (prev - 1 + 4) % 4)
                          }
                          className="p-3 bg-white hover:bg-gray-50 rounded-full shadow-lg border border-gray-200 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="flex gap-2">
                          {Array.from({ length: 4 }, (_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentCelebLookIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentCelebLookIndex
                                  ? "bg-violet-600"
                                  : "bg-gray-300 hover:bg-gray-400"
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentCelebLookIndex((prev) => (prev + 1) % 4)
                          }
                          className="p-3 bg-white hover:bg-gray-50 rounded-full shadow-lg border border-gray-200 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Original Trending Carousel */
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
                        className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 sm:px-8 md:px-12 py-4"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                        onMouseEnter={handleCarouselMouseEnter}
                        onMouseLeave={handleCarouselMouseLeave}
                      >
                        {[
                          // Mix of celebrities and influencers with real images and fragrance info
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
                                color:
                                  "bg-gradient-to-r from-blue-400 to-pink-500",
                              },
                            ],
                            query: "Bella Hadid TikTok viral street style outfit",
                            image:
                              "https://hips.hearstapps.com/hmg-prod/images/bella-hadid-is-seen-on-february-25-2023-in-paris-france-news-photo-1677419264.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
                            fragrance: "Orebella Nightcap",
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
                              "https://media.glamour.com/photos/62a7c7b4b4f6c9b8b5b5b5b5/master/w_1600%2Cc_limit/emma-chamberlain-met-gala-2022.jpg",
                            fragrance: "Glossier Olivia Rodrigo",
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
                                color:
                                  "bg-gradient-to-r from-gray-400 to-gray-600",
                              },
                            ],
                            query:
                              "Michael B Jordan streetwear casual celebrity outfit",
                            image:
                              "https://www.gq.com/verso/static/gq/assets/michael-b-jordan-style-evolution-gq-2023-tout.jpg",
                            fragrance: "Coach For Men",
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
                                color:
                                  "bg-gradient-to-r from-red-400 to-pink-500",
                              },
                            ],
                            query: "Zendaya red carpet inspired street outfit",
                            image:
                              "https://hips.hearstapps.com/hmg-prod/images/zendaya-attends-the-dune-part-two-world-premiere-at-news-photo-1708439058.jpg?crop=0.66667xw:1xh;center,top&resize=1200:*",
                            fragrance: "Lancôme Idôle",
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
                                color:
                                  "bg-gradient-to-r from-gray-400 to-gray-600",
                              },
                            ],
                            query:
                              "ASAP Rocky streetwear fashion celebrity outfit",
                            image:
                              "https://www.gq.com/verso/static/gq/assets/asap-rocky-style-evolution-gq-2023.jpg",
                            fragrance: "Dior Sauvage",
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
                                color:
                                  "bg-gradient-to-r from-pink-400 to-red-500",
                              },
                            ],
                            query: "Rihanna casual street style celebrity outfit",
                            image:
                              "https://hips.hearstapps.com/hmg-prod/images/rihanna-is-seen-on-february-12-2023-in-paris-france-news-photo-1676230847.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
                            fragrance: "Fenty Eau de Parfum",
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
                              "https://www.gq.com/verso/static/gq/assets/tyler-the-creator-style-evolution-gq-2023.jpg",
                            fragrance: "Le Labo Santal 33",
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
                                color:
                                  "bg-gradient-to-r from-gray-400 to-gray-600",
                              },
                            ],
                            query:
                              "Frank Ocean minimalist aesthetic street style",
                            image:
                              "https://images.unsplash.com/photo-1507003211169-00dcc994a43e?w=200&h=250&fit=crop&auto=format",
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
                                color:
                                  "bg-gradient-to-r from-pink-400 to-red-500",
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
                              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=250&fit=crop&auto=format",
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
                                color:
                                  "bg-gradient-to-r from-blue-400 to-pink-500",
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
                            query:
                              "Nikkie Tutorials bold makeup influencer style",
                            image:
                              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=250&fit=crop&auto=format",
                          },
                          {
                            name: "Y2K Revival",
                            tags: [
                              {
                                name: "TikTok",
                                color:
                                  "bg-gradient-to-r from-blue-400 to-pink-500",
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
                            query:
                              "clean girl aesthetic minimal Instagram outfit",
                            image:
                              "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=250&fit=crop&auto=format",
                          },
                          {
                            name: "Cargo Pants Trend",
                            tags: [
                              {
                                name: "TikTok",
                                color:
                                  "bg-gradient-to-r from-blue-400 to-pink-500",
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
                                color:
                                  "bg-gradient-to-r from-blue-400 to-pink-500",
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
                            onClick={() => handleStyleClick(trend.query, trend.name)}
                            className="flex-shrink-0 group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
                          >
                            <div className="relative w-32 sm:w-36 md:w-40 h-44 sm:h-48 md:h-52">
                              {/* Background Image */}
                              <img
                                src={trend.image}
                                alt={trend.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=250&fit=crop&auto=format`;
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
                  )}
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

                {!outfitSuggestions && showSearch && (
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
                      onClick={() => {
                        setOutfitSuggestions(null);
                        setSelectedCelebrity(null);
                        setCurrentItemIndices({});
                      }}
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
                          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto border border-gray-200 overflow-hidden">
                            {/* Header with celebrity info */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 animate-pulse" />
                              <div className="flex-1">
                                <div className="h-5 bg-gray-300 rounded animate-pulse w-24 mb-2" />
                                <div className="h-4 bg-gray-300 rounded animate-pulse w-20" />
                              </div>
                              <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
                            </div>

                            {/* Outfit items */}
                            <div className="p-4 space-y-4">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-4 py-2"
                                >
                                  <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                                  <div className="flex-1">
                                    <div className="h-4 bg-gray-300 rounded animate-pulse w-20 mb-2" />
                                    <div className="h-3 bg-gray-300 rounded animate-pulse w-32 mb-2" />
                                    <div className="h-4 bg-gray-300 rounded animate-pulse w-16" />
                                  </div>
                                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
                                </div>
                              ))}
                            </div>

                            {/* Total */}
                            <div className="border-t border-gray-200 p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-base">
                                  Loading...
                                </span>
                                <div className="h-6 bg-gray-300 rounded animate-pulse w-20" />
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Enhanced celebrity detection from search query and trending clicks
                      const detectCelebrity = (query: string) => {
                        const lowerQuery = query.toLowerCase();

                        // Celebrity data with images and fragrances
                        const celebrities = {
                          "Bella Hadid": {
                            image:
                              "https://hips.hearstapps.com/hmg-prod/images/bella-hadid-is-seen-on-february-25-2023-in-paris-france-news-photo-1677419264.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
                            fragrance: "Orebella Nightcap",
                          },
                          "Michael B. Jordan": {
                            image:
                              "https://www.gq.com/verso/static/gq/assets/michael-b-jordan-style-evolution-gq-2023-tout.jpg",
                            fragrance: "Coach For Men",
                          },
                          Zendaya: {
                            image:
                              "https://hips.hearstapps.com/hmg-prod/images/zendaya-attends-the-dune-part-two-world-premiere-at-news-photo-1708439058.jpg?crop=0.66667xw:1xh;center,top&resize=1200:*",
                            fragrance: "Lancôme Idôle",
                          },
                          "A$AP Rocky": {
                            image:
                              "https://www.gq.com/verso/static/gq/assets/asap-rocky-style-evolution-gq-2023.jpg",
                            fragrance: "Dior Sauvage",
                          },
                          Rihanna: {
                            image:
                              "https://hips.hearstapps.com/hmg-prod/images/rihanna-is-seen-on-february-12-2023-in-paris-france-news-photo-1676230847.jpg?crop=0.668xw:1.00xh;0.166xw,0&resize=1200:*",
                            fragrance: "Fenty Eau de Parfum",
                          },
                          "Tyler, The Creator": {
                            image:
                              "https://www.gq.com/verso/static/gq/assets/tyler-the-creator-style-evolution-gq-2023.jpg",
                            fragrance: "Le Labo Santal 33",
                          },
                        };

                        // More comprehensive celebrity detection
                        if (
                          lowerQuery.includes("bella hadid") ||
                          lowerQuery.includes("bella")
                        )
                          return {
                            name: "Bella Hadid",
                            ...celebrities["Bella Hadid"],
                          };
                        if (
                          lowerQuery.includes("michael b") ||
                          lowerQuery.includes("michael")
                        )
                          return {
                            name: "Michael B. Jordan",
                            ...celebrities["Michael B. Jordan"],
                          };
                        if (lowerQuery.includes("zendaya"))
                          return { name: "Zendaya", ...celebrities["Zendaya"] };
                        if (
                          lowerQuery.includes("asap") ||
                          lowerQuery.includes("rocky") ||
                          lowerQuery.includes("a$ap")
                        )
                          return {
                            name: "A$AP Rocky",
                            ...celebrities["A$AP Rocky"],
                          };
                        if (lowerQuery.includes("rihanna"))
                          return { name: "Rihanna", ...celebrities["Rihanna"] };
                        if (
                          lowerQuery.includes("tyler") ||
                          lowerQuery.includes("creator")
                        )
                          return {
                            name: "Tyler, The Creator",
                            ...celebrities["Tyler, The Creator"],
                          };

                        return undefined;
                      };

                      const celebrityData = detectCelebrity(searchQuery);

                      return renderOutfitItems(
                        outfitSuggestions,
                        celebrityData?.name,
                        celebrityData,
                      );
                    })()
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SignupPaymentDialog open={showDialog} onOpenChange={setShowDialog} />

      {/* Sign In Dialog for Saving Looks */}
      {showSignInDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-pink-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Save Your Favorite Looks
              </h3>
              <p className="text-gray-600">
                Sign in to create your personal style board and save looks you
                love!
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/sign-in"
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
              >
                Sign In
              </Link>

              <Link
                href="/sign-up"
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
              >
                Create Account
              </Link>
            </div>

            <button
              onClick={() => setShowSignInDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Full Look Modal */}
      {showLookModal && selectedLookData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                  <img
                    src={
                      selectedLookData.celebrityData?.image ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLookData.celebrity || "StyleAI"}`
                    }
                    alt={selectedLookData.celebrity || "Style AI"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLookData.celebrity || "StyleAI"}`;
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedLookData.celebrity || "Style AI"} Look
                  </h2>
                  {selectedLookData.celebrityData?.fragrance && (
                    <p className="text-violet-600 text-sm">
                      🌸 {selectedLookData.celebrityData.fragrance}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    saveLookToBoard(
                      selectedLookData.outfit,
                      selectedLookData.celebrity,
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-400 hover:text-red-400 transition-colors"
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
                <button
                  onClick={() => setShowLookModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Outfit Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Outfit Description
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {selectedLookData.outfit.main_description}
                  </p>

                  {/* Total Price */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">
                        Total Outfit Price:
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        $
                        {(() => {
                          const groupedItems = {
                            tops: selectedLookData.outfit.tops || [],
                            bottoms: selectedLookData.outfit.bottoms || [],
                            shoes: selectedLookData.outfit.shoes || [],
                            accessories:
                              selectedLookData.outfit.accessories || [],
                          };
                          const allCategories = Object.entries(
                            groupedItems,
                          ).filter(([_, items]) => items.length > 0);
                          const displayItems = allCategories.map(
                            ([category, categoryItems]) => {
                              return categoryItems[0];
                            },
                          );
                          const totalPrice = displayItems.reduce(
                            (sum, item) => {
                              const price =
                                parseFloat(item.price.replace(/[$,]/g, "")) ||
                                0;
                              return sum + price;
                            },
                            0,
                          );
                          return totalPrice.toLocaleString();
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Outfit Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Outfit Items
                  </h3>
                  <div className="space-y-4">
                    {(() => {
                      const groupedItems = {
                        tops: selectedLookData.outfit.tops || [],
                        bottoms: selectedLookData.outfit.bottoms || [],
                        shoes: selectedLookData.outfit.shoes || [],
                        accessories: selectedLookData.outfit.accessories || [],
                      };
                      const allCategories = Object.entries(groupedItems).filter(
                        ([_, items]) => items.length > 0,
                      );

                      return allCategories.map(
                        ([category, categoryItems], categoryIndex) => {
                          const currentItem = categoryItems[0];

                          return (
                            <div
                              key={categoryIndex}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <a
                                href={currentItem.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 cursor-pointer"
                              >
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {currentItem.image_url ? (
                                    <img
                                      src={currentItem.image_url}
                                      alt={currentItem.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&auto=format`;
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-lg mb-1">
                                    {currentItem.brand}
                                  </h4>
                                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                    {currentItem.name}
                                  </p>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {currentItem.website}
                                    </div>
                                    {currentItem.availability ===
                                      "Limited Stock" && (
                                      <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                        Limited
                                      </div>
                                    )}
                                    {currentItem.availability ===
                                      "In Stock" && (
                                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                        In Stock
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-gray-900 text-lg">
                                      {currentItem.price}
                                    </p>
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                              </a>

                              {/* Show alternatives if available */}
                              {categoryItems.length > 1 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <p className="text-sm text-gray-500 mb-2">
                                    +{categoryItems.length - 1} alternative
                                    {categoryItems.length > 2 ? "s" : ""}{" "}
                                    available
                                  </p>
                                  <div className="flex gap-2">
                                    {categoryItems
                                      .slice(1, 4)
                                      .map((altItem, altIndex) => (
                                        <a
                                          key={altIndex}
                                          href={altItem.website_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-300 transition-all"
                                        >
                                          {altItem.image_url ? (
                                            <img
                                              src={altItem.image_url}
                                              alt={altItem.name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                const target =
                                                  e.target as HTMLImageElement;
                                                target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=50&h=50&fit=crop&auto=format`;
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                                            </div>
                                          )}
                                        </a>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        },
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  };
}