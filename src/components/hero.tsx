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
import React, { useState, useRef, useEffect } from "react";
import { usePrompt } from "@/contexts/PromptContext";
import SignupPaymentDialog from "@/components/signup-payment-dialog";
import { createClient } from "../../supabase/client";

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
  celebrity_worn?: boolean;
  store_badge?: string;
}

interface OutfitSuggestion {
  main_description: string;
  tops: OutfitItem[];
  bottoms: OutfitItem[];
  accessories: OutfitItem[];
  shoes: OutfitItem[];
}

interface SearchHistoryItem {
  id: string;
  query: string;
  outfit: OutfitSuggestion;
  celebrity?: string;
  celebrityData?: { name: string; image: string; fragrance: string };
  timestamp: number;
  currentItemIndices: { [key: number]: number };
}

interface CelebrityTrend {
  name: string;
  tags: { name: string; color: string }[];
  platform: string;
  query: string;
  image: string;
  fragrance?: string;
  tiktokEmbed?: string;
}

interface HeroProps {
  showSearch?: boolean;
  initialQuery?: string;
  initialCelebrity?: string;
}

// Add this type above the celebrityMediaGallery declaration
interface CelebrityMediaItem {
  type: string;
  src: string;
  duration: number;
  title: string;
}

export default function Hero({
  showSearch = true,
  initialQuery = "",
  initialCelebrity = null,
}: HeroProps = {}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStyleLoading, setIsStyleLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [outfitSuggestions, setOutfitSuggestions] =
    useState<OutfitSuggestion | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const { promptCount, incrementPrompt, hasReachedLimit } = usePrompt();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTypingText, setCurrentTypingText] = useState("");
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedCelebrity, setSelectedCelebrity] = useState<string | null>(
    initialCelebrity,
  );
  const [currentCelebLookIndex, setCurrentCelebLookIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [savedLooks, setSavedLooks] = useState<string[]>([]);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [showLookModal, setShowLookModal] = useState(false);
  const [selectedLookData, setSelectedLookData] = useState<{
    outfit: OutfitSuggestion;
    celebrity?: string;
    celebrityData?: { name: string; image: string; fragrance: string };
  } | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const mediaTransitionRef = useRef<NodeJS.Timeout | null>(null);
  const [currentStyleImageIndex, setCurrentStyleImageIndex] = useState(0);
  const [favoriteImages, setFavoriteImages] = useState<Set<string>>(new Set());
  const [isUserInitiatedPrompt, setIsUserInitiatedPrompt] = useState(false);
  const supabase = createClient();

  // Update the celebrityMediaGallery declaration
  const celebrityMediaGallery: { [key: string]: CelebrityMediaItem[] } = {
    "Odell Beckham Jr": [
      {
        type: "image",
        src: "/images/odell-beckham-jr-new-3.jpg",
        duration: 4000,
        title: "Courtside Style",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-1.jpg",
        duration: 4000,
        title: "Monaco Vibes",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-2.jpg",
        duration: 4000,
        title: "AmfAR Gala Cannes",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-3.jpg",
        duration: 4000,
        title: "Luxury Lifestyle",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-4.jpg",
        duration: 4000,
        title: "Yacht Life",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-5.jpg",
        duration: 4000,
        title: "Monaco Style",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-6.jpg",
        duration: 4000,
        title: "Casual Elegance",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-7.jpg",
        duration: 4000,
        title: "Street Style",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-8.jpg",
        duration: 4000,
        title: "Fashion Forward",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-9.jpg",
        duration: 4000,
        title: "Luxury Details",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-10.jpg",
        duration: 4000,
        title: "Designer Pieces",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-11.jpg",
        duration: 4000,
        title: "Signature Style",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-12.jpg",
        duration: 4000,
        title: "Casual Cool",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-13.jpg",
        duration: 4000,
        title: "Luxury Timepiece",
      },
      {
        type: "image",
        src: "/images/odell-beckham-jr-obj-monaco-14.jpg",
        duration: 4000,
        title: "Formal Elegance",
      },
    ],
    Drake: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Studio Sessions",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Luxury Lifestyle",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Designer Fits",
      },
    ],
    "Charli D'Amelio": [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1494790108755-2616c9c1e4a3?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "TikTok Style",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Gen-Z Fashion",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Casual Chic",
      },
    ],
    "Emma Chamberlain": [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Vintage Vibes",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Thrift Finds",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Effortless Style",
      },
    ],
    "Serena Williams": [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Power Dressing",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Athletic Elegance",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Red Carpet Ready",
      },
    ],
    Zendaya: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Avant-garde Fashion",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Bold Statements",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "High Fashion",
      },
    ],
    "Taylor Swift": [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1494790108755-2616c9c1e4a3?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Romantic Style",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Vintage Romance",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Cottagecore Chic",
      },
    ],
    MrBeast: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Casual Comfort",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Streetwear Style",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        duration: 4000,
        title: "Relaxed Vibes",
      },
    ],
  };

  // Hardcoded Odell Beckham outfit data
  const odellBeckhamOutfit: OutfitSuggestion = {
    main_description:
      "Odell Beckham Jr's signature streetwear style featuring luxury designer pieces with artistic flair and premium accessories.",
    tops: [
      {
        name: "Yearbook Camp Shirt",
        description:
          "Vintage-inspired camp shirt with artistic yearbook graphics",
        price: "$260",
        brand: "Samuel Zelig",
        website: "FARFETCH",
        website_url:
          "https://whatsonthestar.com/item/samuel-zelig-257268/go/355433?platform=desktop",
        image_url: "/images/shirt-samuel-zelig.png",
        availability: "In Stock",
        celebrity_worn: true,
      },
      {
        name: "Vintage Camp Shirt",
        description: "Similar vintage camp shirt style",
        price: "$89",
        brand: "Urban Outfitters",
        website: "URBAN OUTFITTERS",
        website_url: "https://www.urbanoutfitters.com",
        image_url:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
        availability: "In Stock",
      },
      {
        name: "Graphic Camp Shirt",
        description: "Affordable camp shirt with graphics",
        price: "$35",
        brand: "H&M",
        website: "H&M",
        website_url: "https://www2.hm.com",
        image_url:
          "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&q=80",
        availability: "In Stock",
      },
    ],
    bottoms: [
      {
        name: "Designer Cargo Pants",
        description: "Premium cargo pants with utility pockets and tapered fit",
        price: "$450",
        brand: "Stone Island",
        website: "SSENSE",
        website_url: "https://whatsonthestar.com",
        image_url:
          "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
        availability: "In Stock",
        celebrity_worn: true,
      },
      {
        name: "Utility Cargo Pants",
        description: "Mid-range cargo pants with multiple pockets",
        price: "$120",
        brand: "Carhartt WIP",
        website: "URBAN OUTFITTERS",
        website_url: "https://www.urbanoutfitters.com",
        image_url:
          "https://images.unsplash.com/photo-1506629905607-d405d7d3b0d0?w=400&q=80",
        availability: "In Stock",
      },
      {
        name: "Basic Cargo Pants",
        description: "Affordable cargo pants with classic fit",
        price: "$45",
        brand: "Dickies",
        website: "TARGET",
        website_url: "https://www.target.com",
        image_url:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
        availability: "In Stock",
      },
    ],
    accessories: [
      {
        name: "Deader With Age Reconstructed Hat",
        description: "Unique reconstructed cap with artistic patchwork design",
        price: "$560",
        brand: "Better With Age",
        website: "GRAILED",
        website_url:
          "https://whatsonthestar.com/item/better-with-age-257269/go/355434?platform=desktop",
        image_url: "/images/hat-better-with-age.png",
        availability: "Limited Stock",
        celebrity_worn: true,
      },
      {
        name: "Intrecciato Rectangular Sunglasses",
        description: "Luxury woven leather sunglasses with distinctive design",
        price: "$400",
        brand: "Bottega Veneta",
        website: "NET-A-PORTER",
        website_url:
          "https://whatsonthestar.com/item/bottega-257267/go/355432?platform=desktop",
        image_url: "/images/sunglasses-bottega-veneta.png",
        availability: "In Stock",
        celebrity_worn: true,
      },
      {
        name: "Patchwork Baseball Cap",
        description: "Artistic patchwork cap similar style",
        price: "$125",
        brand: "Stussy",
        website: "STUSSY",
        website_url: "https://www.stussy.com",
        image_url:
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
        availability: "In Stock",
      },
      {
        name: "Rectangular Sunglasses",
        description: "Designer-inspired rectangular sunglasses",
        price: "$89",
        brand: "Ray-Ban",
        website: "RAY-BAN",
        website_url: "https://www.ray-ban.com",
        image_url:
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
        availability: "In Stock",
      },
      {
        name: "Vintage Baseball Cap",
        description: "Classic vintage-style baseball cap",
        price: "$25",
        brand: "New Era",
        website: "NEW ERA",
        website_url: "https://www.neweracap.com",
        image_url:
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
        availability: "In Stock",
      },
      {
        name: "Classic Sunglasses",
        description: "Affordable classic sunglasses",
        price: "$19",
        brand: "Uniqlo",
        website: "UNIQLO",
        website_url: "https://www.uniqlo.com",
        image_url:
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80",
        availability: "In Stock",
      },
    ],
    shoes: [
      {
        name: "Saint Michael Socks",
        description: "Premium designer socks with Saint Michael branding",
        price: "$85",
        brand: "Saint Michael",
        website: "DOVER STREET MARKET",
        website_url:
          "https://whatsonthestar.com/item/saint-michael-257270/go/355435?platform=desktop",
        image_url: "/images/socks-saint-michael.png",
        availability: "In Stock",
        celebrity_worn: true,
      },
      {
        name: "Designer Crew Socks",
        description: "Premium crew socks with logo",
        price: "$35",
        brand: "Off-White",
        website: "SSENSE",
        website_url: "https://www.ssense.com",
        image_url:
          "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80",
        availability: "In Stock",
      },
      {
        name: "Crew Socks Pack",
        description: "Basic crew socks 3-pack",
        price: "$12",
        brand: "Nike",
        website: "NIKE",
        website_url: "https://www.nike.com",
        image_url:
          "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&q=80",
        availability: "In Stock",
      },
    ],
  };

  const generateOutfit = async (query: string) => {
    if (hasReachedLimit) {
      setShowDialog(true);
      return;
    }

    // Show loading state immediately
    setIsLoading(true);
    setLoadingTimeout(false);

    // Only add loading item to search history if we have existing search history
    let loadingHistoryItem: SearchHistoryItem | null = null;
    const shouldShowInHistory = searchHistory.length > 0;

    if (shouldShowInHistory) {
      // Add loading item to search history immediately for subsequent prompts
      loadingHistoryItem = {
        id: `loading-${Date.now()}`,
        query,
        outfit: { loading: true } as any,
        celebrity: selectedCelebrity || undefined,
        celebrityData: selectedCelebrity
          ? (() => {
              const trend = celebrityTrends.find(
                (trend) => trend.name === selectedCelebrity,
              );
              return trend
                ? {
                    ...trend,
                    fragrance: trend.fragrance ?? "",
                  }
                : undefined;
            })()
          : undefined,
        timestamp: Date.now(),
        currentItemIndices: {},
      };

      setSearchHistory((prev) => [...prev, loadingHistoryItem]);
    }

    setSearchQuery(""); // Clear search input immediately

    // Check if this is an Odell Beckham query
    if (
      query.toLowerCase().includes("odell beckham") ||
      query.toLowerCase().includes("obj")
    ) {
      // Simulate loading time
      setTimeout(() => {
        const historyItem: SearchHistoryItem = {
          id: Date.now().toString(),
          query,
          outfit: odellBeckhamOutfit,
          celebrity: "Odell Beckham Jr",
          celebrityData: {
            name: "Odell Beckham Jr",
            image:
              "/images/odell-beckham-jr-obj-monaco-friends-amfar-gala-cannes-f1-2025-2-1.jpg",
            fragrance: "Champion Spirit",
          },
          timestamp: Date.now(),
          currentItemIndices: {},
        };

        // Replace the loading item with the actual result (only if we created one)
        if (loadingHistoryItem) {
          setSearchHistory((prev) =>
            prev.map((item) =>
              item.id === loadingHistoryItem.id ? historyItem : item,
            ),
          );
        } else {
          // For initial queries, just add the result directly
          setSearchHistory((prev) => [...prev, historyItem]);
        }
        setIsLoading(false);
        incrementPrompt();

        if (promptCount + 1 >= 7) {
          setShowDialog(true);
        }
      }, 1500);
      return;
    }

    // Set timeout for slow connections (show modal after 8 seconds)
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 8000);

    // Simple request with timeout
    const makeRequest = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        const response = await fetch("/api/generate-outfit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          throw new Error(
            errorData.error || `Request failed: ${response.status}`,
          );
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Request timeout. Please try again.");
        }
        throw error;
      }
    };

    try {
      const response = await makeRequest();

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Create the actual result item
      const historyItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query,
        outfit: data,
        celebrity: selectedCelebrity || undefined,
        celebrityData: selectedCelebrity
          ? (() => {
              const trend = celebrityTrends.find(
                (trend) => trend.name === selectedCelebrity,
              );
              return trend
                ? {
                    ...trend,
                    fragrance: trend.fragrance ?? "",
                  }
                : undefined;
            })()
          : undefined,
        timestamp: Date.now(),
        currentItemIndices: {},
      };

      // Replace the loading item with the actual result (only if we created one)
      if (loadingHistoryItem) {
        setSearchHistory((prev) =>
          prev.map((item) =>
            item.id === loadingHistoryItem.id ? historyItem : item,
          ),
        );
      } else {
        // For initial queries, just add the result directly
        setSearchHistory((prev) => [...prev, historyItem]);
      }
      clearTimeout(timeoutId);

      // Increment prompt count after successful generation
      incrementPrompt();

      // Check if this increment reached the limit
      if (promptCount + 1 >= 7) {
        setShowDialog(true);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error generating outfit:", error);

      let errorMessage =
        "Sorry, there was an error generating your outfit. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Replace loading item with error state (only if we created one)
      if (loadingHistoryItem) {
        setSearchHistory((prev) =>
          prev.filter((item) => item.id !== loadingHistoryItem.id),
        );
      }

      // Show simplified error message
      alert(
        errorMessage ||
          "Sorry, there was an error generating your outfit. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setLoadingTimeout(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();

      // Mark this as a user-initiated prompt
      setIsUserInitiatedPrompt(true);

      await generateOutfit(query);

      // Scroll to bottom immediately to show the new loading item (only when there's search history)
      if (searchHistory.length > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  };

  const handleStyleClick = async (query: string, celebrityName?: string) => {
    // Navigate to prompt page with query parameters
    const params = new URLSearchParams();
    params.set("query", query);
    if (celebrityName) {
      params.set("celebrity", celebrityName);
    }
    window.location.href = `/prompt?${params.toString()}`;
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
            // Scroll right by one card width for discrete movement
            container.scrollLeft += 160; // Move by approximately one card width
          }
        }
      }, 5000); // Move once every 5 seconds
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

  // Typing animation effect
  useEffect(() => {
    const suggestions = [
      "Casual weekend outfit for brunch",
      "Professional look for a job interview",
      "Date night outfit that's stylish but comfortable",
      "Summer vacation wardrobe essentials",
      "Cozy fall layers for the office",
      "Trendy streetwear inspired by celebrities",
      "Elegant evening wear for a special event",
      "Athleisure outfit for running errands",
    ];

    let currentIndex = 0;
    let currentText = "";
    let isDeleting = false;
    let charIndex = 0;

    const typeText = () => {
      const currentSuggestion = suggestions[currentIndex];

      if (!isDeleting) {
        // Typing
        currentText = currentSuggestion.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentSuggestion.length) {
          // Finished typing, wait then start deleting
          setTimeout(() => {
            isDeleting = true;
          }, 2000);
        }
      } else {
        // Deleting
        currentText = currentSuggestion.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          // Finished deleting, move to next suggestion
          isDeleting = false;
          currentIndex = (currentIndex + 1) % suggestions.length;
        }
      }

      setCurrentTypingText(currentText);

      // Adjust typing speed
      const typingSpeed = isDeleting ? 50 : 100;
      typingTimeoutRef.current = setTimeout(typeText, typingSpeed);
    };

    if (isTyping && !searchQuery.trim()) {
      typeText();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, searchQuery]);

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Stop typing animation when user starts typing
    if (value.trim() && isTyping) {
      setIsTyping(false);
      setCurrentTypingText("");
    } else if (!value.trim() && !isTyping) {
      setIsTyping(true);
    }
  };

  // Auto-transition media effect
  useEffect(() => {
    if (
      selectedCelebrity &&
      outfitSuggestions &&
      celebrityMediaGallery[selectedCelebrity]
    ) {
      const currentGallery = celebrityMediaGallery[selectedCelebrity];
      const currentMedia = currentGallery[currentMediaIndex];

      if (mediaTransitionRef.current) {
        clearTimeout(mediaTransitionRef.current);
      }

      mediaTransitionRef.current = setTimeout(() => {
        setCurrentMediaIndex(
          (prevIndex) => (prevIndex + 1) % currentGallery.length,
        );
      }, currentMedia.duration);
    }

    return () => {
      if (mediaTransitionRef.current) {
        clearTimeout(mediaTransitionRef.current);
      }
    };
  }, [currentMediaIndex, selectedCelebrity, outfitSuggestions]);

  // Reset media index when celebrity changes
  useEffect(() => {
    if (selectedCelebrity && celebrityMediaGallery[selectedCelebrity]) {
      setCurrentMediaIndex(0);
    }
  }, [selectedCelebrity]);

  // Auto-scroll to bottom when new search history is added (like ChatGPT)
  useEffect(() => {
    if (searchHistory.length > 1) {
      // Scroll to bottom to show the latest search result (only for subsequent searches)
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [searchHistory.length]);

  // Auto-generate outfit when initial query is provided
  useEffect(() => {
    if (initialQuery && searchHistory.length === 0) {
      setIsUserInitiatedPrompt(false);
      generateOutfit(initialQuery);
    }
  }, [initialQuery]);

  // Celebrity trends data
  const celebrityTrends: CelebrityTrend[] = [
    {
      name: "Odell Beckham Jr",
      tags: [
        {
          name: "Celebrity",
          color:
            "bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200",
        },
        { name: "Athletic", color: "bg-green-100 text-green-800" },
        { name: "Fashion-Forward", color: "bg-indigo-100 text-indigo-800" },
      ],
      platform: "Celebrity",
      query:
        "Odell Beckham Jr inspired athletic fashion-forward outfit with designer athleisure and statement accessories",
      image:
        "/images/odell-beckham-jr-obj-monaco-friends-amfar-gala-cannes-f1-2025-2-1.jpg",
      fragrance: "Champion Spirit",
    },
    {
      name: "Drake",
      tags: [
        {
          name: "Celebrity",
          color:
            "bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200",
        },
        { name: "Rapper", color: "bg-yellow-100 text-yellow-800" },
        { name: "Luxury", color: "bg-amber-100 text-amber-800" },
      ],
      platform: "Celebrity",
      query:
        "Drake inspired luxury rapper outfit with designer hoodies, premium denim and statement jewelry",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      fragrance: "God's Plan",
    },
    {
      name: "Charli D'Amelio",
      tags: [
        { name: "Influencer", color: "bg-blue-100 text-blue-800" },
        { name: "Gen-Z", color: "bg-pink-100 text-pink-800" },
        { name: "Trendy", color: "bg-green-100 text-green-800" },
      ],
      platform: "TikTok",
      query:
        "Charli D'Amelio inspired Gen-Z trendy outfit with crop tops, high-waisted jeans and chunky sneakers",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616c9c1e4a3?w=400",
      fragrance: "Sweet Dreams",
    },
    {
      name: "Emma Chamberlain",
      tags: [
        { name: "Influencer", color: "bg-blue-100 text-blue-800" },
        { name: "Vintage", color: "bg-orange-100 text-orange-800" },
        { name: "Casual", color: "bg-gray-100 text-gray-800" },
      ],
      platform: "Instagram",
      query:
        "Emma Chamberlain inspired vintage casual outfit with thrifted pieces and effortless styling",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      fragrance: "Coffee Shop Vibes",
    },
    {
      name: "Serena Williams",
      tags: [
        { name: "Athlete", color: "bg-green-100 text-green-800" },
        { name: "Powerful", color: "bg-red-100 text-red-800" },
        { name: "Elegant", color: "bg-purple-100 text-purple-800" },
      ],
      platform: "Celebrity",
      query:
        "Serena Williams inspired powerful elegant outfit with structured blazers and statement accessories",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400",
      fragrance: "Champion's Grace",
    },
    {
      name: "Zendaya",
      tags: [
        {
          name: "Celebrity",
          color:
            "bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200",
        },
        { name: "Bold", color: "bg-orange-100 text-orange-800" },
        { name: "Avant-garde", color: "bg-red-100 text-red-800" },
      ],
      platform: "Celebrity",
      query:
        "Zendaya inspired bold avant-garde outfit with statement pieces and unique silhouettes",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400",
      fragrance: "Electric Nights",
    },
    {
      name: "Taylor Swift",
      tags: [
        {
          name: "Celebrity",
          color:
            "bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200",
        },
        { name: "Vintage", color: "bg-pink-100 text-pink-800" },
        { name: "Romantic", color: "bg-rose-100 text-rose-800" },
      ],
      platform: "Celebrity",
      query:
        "Taylor Swift inspired vintage romantic outfit with cardigans and flowing skirts",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616c9c1e4a3?w=400",
      fragrance: "Enchanted Garden",
    },
    {
      name: "MrBeast",
      tags: [
        { name: "Influencer", color: "bg-blue-100 text-blue-800" },
        { name: "Casual", color: "bg-gray-100 text-gray-800" },
        { name: "Comfortable", color: "bg-green-100 text-green-800" },
      ],
      platform: "YouTube",
      query:
        "MrBeast inspired casual comfortable outfit with hoodies, joggers and comfortable sneakers",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      fragrance: "Beast Mode",
    },
  ];

  // State for tracking current item indices for each category
  const [currentItemIndices, setCurrentItemIndices] = useState<{
    [key: number]: number;
  }>({});

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveLookToBoard = async (
    outfitData: OutfitSuggestion,
    celebrityName?: string,
  ) => {
    if (!user) {
      setShowSignInDialog(true);
      return;
    }

    try {
      // Calculate total price for the current selection
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

      const { data, error } = await supabase
        .from("saved_looks")
        .insert({
          user_id: user.id,
          look_data: {
            outfit: outfitData,
            selected_items: currentItemIndices,
            celebrity_data: celebrityName ? { name: celebrityName } : null,
          },
          search_query: searchQuery,
          celebrity_name: celebrityName,
          total_price: totalPrice,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error saving look:", error);
        alert("Failed to save look. Please try again.");
        return;
      }

      if (data) {
        setSavedLooks((prev) => [...prev, data.id]);
        alert("Look liked and saved! ✨");
      }
    } catch (error) {
      console.error("Error saving look:", error);
      alert("Failed to save look. Please try again.");
    }
  };

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

  // Helper function to check if search query is for a celebrity/influencer
  const isCelebritySearch = (query: string, celebrityName?: string) => {
    if (celebrityName) return true;

    // Check if query contains celebrity/influencer names or keywords
    const celebrityKeywords = [
      "odell beckham",
      "obj",
      "drake",
      "charli",
      "emma chamberlain",
      "serena williams",
      "zendaya",
      "taylor swift",
      "mrbeast",
      "messi",
      "ronaldo",
      "lebron",
      "kanye",
      "kim kardashian",
      "rihanna",
      "beyonce",
      "justin bieber",
      "ariana grande",
    ];

    const lowerQuery = query.toLowerCase();
    return celebrityKeywords.some((keyword) => lowerQuery.includes(keyword));
  };

  const renderOutfitItems = (
    outfitData: OutfitSuggestion,
    celebrityName?: string,
    celebrityData?: { name: string; image: string; fragrance: string },
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

    const showCelebrityHeader = isCelebritySearch(searchQuery, celebrityName);

    return (
      <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
        {/* Header - always show, but different content based on search type */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 relative flex-shrink-0">
          {showCelebrityHeader ? (
            // Celebrity/Influencer header with profile picture and name
            <>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  src={
                    celebrityName === "Odell Beckham Jr"
                      ? "/images/odell-beckham-jr-profile-new.png"
                      : celebrityData?.image ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrityName || "peacedrobe"}`
                  }
                  alt={celebrityName || "Style AI"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrityName || "peacedrobe"}`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-lg truncate">
                  {celebrityName || "peacedrobe AI"}
                </h3>
              </div>
            </>
          ) : (
            // Generic header for non-celebrity searches
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-lg truncate">
                Items
              </h3>
            </div>
          )}
          <button
            onClick={() => saveLookToBoard(outfitData, celebrityName)}
            className="absolute top-3 right-3 p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 z-10"
          >
            <svg
              className={`w-6 h-6 transition-colors ${
                savedLooks.some((id) => {
                  // Check if this look combination is already saved
                  // This is a simplified check - in a real app you'd want more sophisticated matching
                  return false; // For now, always show unfilled heart
                })
                  ? "text-red-500 fill-current"
                  : "text-gray-400 hover:text-red-400"
              }`}
              fill={savedLooks.some((id) => false) ? "currentColor" : "none"}
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
        {/* Items List with Swipeable Alternatives */}
        <div className="p-3 space-y-2 flex-1 overflow-y-auto">
          {allCategories.map(([category, categoryItems], categoryIndex) => {
            const currentIndex = currentItemIndices[categoryIndex] || 0;
            const currentItem = categoryItems[currentIndex] || categoryItems[0];
            const hasAlternatives = categoryItems.length > 1;

            return (
              <div key={category} className="relative">
                <a
                  href={currentItem.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-gray-50 rounded-lg transition-colors p-2 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    {/* Navigation Buttons */}
                    {hasAlternatives && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigateItem(categoryIndex, "prev", categoryItems);
                          }}
                          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110"
                        >
                          <ChevronLeft className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigateItem(categoryIndex, "next", categoryItems);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110"
                        >
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                        </button>
                      </>
                    )}

                    {/* Item Image */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {currentItem.image_url ? (
                        <img
                          src={currentItem.image_url}
                          alt={currentItem.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 mr-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {currentItem.brand}
                        </h4>
                        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />
                      </div>
                      <p className="text-gray-600 text-xs truncate mb-1">
                        {currentItem.name}
                      </p>
                      <div className="flex items-center gap-1 mb-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {currentItem.website}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-gray-900 text-sm">
                            {currentItem.price}
                          </p>
                          {currentItem.original_price && (
                            <p className="text-xs text-gray-500 line-through">
                              {currentItem.original_price}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {hasAlternatives && (
                            <div className="flex gap-0.5">
                              {categoryItems.map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-1 h-1 rounded-full transition-colors ${
                                    index === currentIndex
                                      ? "bg-gray-800"
                                      : "bg-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
        {/* Total */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 text-sm">Total:</span>
            <span className="font-bold text-gray-900 text-lg">
              ${totalPrice.toLocaleString()}
            </span>
          </div>

          {/* View Full Look Button - Subtle hover overlay */}
          <div className="relative group">
            <button
              onClick={() => {
                setSelectedLookData({
                  outfit: outfitData,
                  celebrity: celebrityName,
                  celebrityData: celebrityData
                    ? {
                        ...celebrityData,
                        fragrance: celebrityData.fragrance ?? "",
                      }
                    : undefined,
                });
                setShowLookModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100/60 hover:bg-black/80 text-gray-600 hover:text-white rounded-xl font-medium transition-all duration-300 text-sm border border-gray-200/50 hover:border-white/40"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>View Full Look</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      <div
        className={`relative ${outfitSuggestions ? "pt-4 pb-8" : searchHistory.length > 0 ? "pt-8 pb-24" : "pt-16 pb-24 sm:pt-20 sm:pb-32"}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col" id="hero-content">
            <div className="text-center max-w-4xl mx-auto w-full">
              {/* Title and description - only show when no search history */}
              <div
                className={`transition-all duration-500 ease-in-out ${searchHistory.length > 0 ? "opacity-0 transform -translate-y-4 h-0 overflow-hidden" : "opacity-100 transform translate-y-0"}`}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight px-4">
                  <span className="text-black flex items-center justify-center gap-3">
                    peacedrobe
                    <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
                      BETA
                    </span>
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
                  Discover complete outfit ideas with high-end options and
                  budget-friendly alternatives
                </p>
              </div>

              {/* AI Search Bar - Only show if showSearch is true and no search history */}
              {showSearch && searchHistory.length === 0 && (
                <div className="max-w-2xl mx-auto px-4 mb-16">
                  <form onSubmit={handleSearch} className="relative">
                    <div className="relative bg-white rounded-2xl border border-beige-200 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-gold-500/20 focus-within:border-gold-300">
                      <textarea
                        value={searchQuery}
                        onChange={handleTextareaChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (searchQuery.trim()) {
                              handleSearch(e as any);
                            }
                          }
                        }}
                        placeholder={
                          searchQuery.trim()
                            ? ""
                            : currentTypingText ||
                              "Describe your style or ask for outfit ideas..."
                        }
                        className="w-full px-4 sm:px-6 py-4 pr-44 sm:pr-52 text-sm sm:text-base bg-transparent border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-hidden leading-relaxed h-14 min-h-14 max-h-30"
                        disabled={isLoading}
                        rows={1}
                        suppressHydrationWarning
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">
                          {promptCount}/7 free
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading || !searchQuery.trim()}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg flex-shrink-0"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Search History - ChatGPT Style */}
              {searchHistory.length > 0 && showSearch && (
                <div className="w-full max-w-7xl mx-auto mb-4 px-4">
                  <div ref={historyContainerRef} className="space-y-8">
                    {searchHistory.map((historyItem, index) => (
                      <div key={historyItem.id} className="relative">
                        {/* Search Query Header */}
                        <div className="mb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-gray-800 font-medium">
                              {historyItem.query}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 ml-11">
                            {new Date(historyItem.timestamp).toLocaleString()}
                          </div>
                        </div>

                        {/* Outfit Results */}
                        <div className="ml-11">
                          <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
                            {/* Left side - Outfit display */}
                            <div className="w-full md:w-auto md:min-w-[450px] md:max-w-[450px] flex">
                              {(historyItem.outfit as any)?.loading ? (
                                // Instagram-style loading with greyed-out preview items
                                <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
                                  {/* Header */}
                                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                                    <div className="flex-1 min-w-0">
                                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-24" />
                                    </div>
                                  </div>
                                  {/* Loading items with greyed-out preview */}
                                  <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                                    {[1, 2, 3, 4].map((i) => (
                                      <div key={i} className="relative">
                                        <div className="block rounded-lg p-2 border border-gray-100">
                                          <div className="flex items-center gap-2">
                                            {/* Item Image */}
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0 mr-1">
                                              <div className="flex items-start justify-between mb-1">
                                                <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                                              </div>
                                              <div className="h-2 bg-gray-200 rounded animate-pulse mb-1 w-32" />
                                              <div className="h-2 bg-gray-200 rounded animate-pulse mb-1 w-16" />
                                              <div className="flex items-center justify-between">
                                                <div className="h-3 bg-gray-200 rounded animate-pulse w-12" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Total */}
                                  <div className="border-t border-gray-200 p-3 flex-shrink-0">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="h-3 bg-gray-200 rounded animate-pulse w-10" />
                                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                                  </div>
                                </div>
                              ) : (
                                renderOutfitItems(
                                  historyItem.outfit,
                                  historyItem.celebrity,
                                  historyItem.celebrityData,
                                )
                              )}
                            </div>

                            {/* Right side - Style Inspiration Gallery */}
                            <div className="w-full md:w-auto md:min-w-[450px] md:max-w-[450px] flex">
                              <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
                                {/* Header */}
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
                                  <div className="flex-1 min-w-0">
                                    {/* Title removed */}
                                  </div>
                                </div>

                                {/* Single Featured Content - Celebrity Images */}
                                <div className="flex-1 flex flex-col p-4">
                                  {(historyItem.outfit as any)?.loading ? (
                                    // Instagram-style loading for right panel
                                    <div className="w-full h-[600px] bg-gray-200 overflow-hidden relative shadow-lg border border-gray-200/50 rounded-2xl animate-pulse">
                                      {/* Loading placeholder */}
                                    </div>
                                  ) : historyItem.celebrity &&
                                    celebrityMediaGallery[
                                      historyItem.celebrity
                                    ] ? (
                                    // Show dynamic media for selected celebrity
                                    <div className="w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative shadow-lg border border-gray-200/50 rounded-2xl group">
                                      <img
                                        src={
                                          celebrityMediaGallery[
                                            historyItem.celebrity
                                          ][currentMediaIndex]?.src
                                        }
                                        alt={
                                          celebrityMediaGallery[
                                            historyItem.celebrity
                                          ][currentMediaIndex]?.title
                                        }
                                        className="w-full h-full object-cover transition-all duration-500 hover:scale-[1.02] rounded-2xl"
                                        onError={(e) => {
                                          const target =
                                            e.target as HTMLImageElement;
                                          target.src =
                                            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80";
                                        }}
                                      />

                                      {/* Navigation arrows - hidden by default, shown on hover */}
                                      <button
                                        onClick={() => {
                                          const gallery =
                                            celebrityMediaGallery[
                                              historyItem.celebrity!
                                            ];
                                          setCurrentMediaIndex((prev) =>
                                            prev === 0
                                              ? gallery.length - 1
                                              : prev - 1,
                                          );
                                        }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10 opacity-0 group-hover:opacity-100"
                                      >
                                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const gallery =
                                            celebrityMediaGallery[
                                              historyItem.celebrity!
                                            ];
                                          setCurrentMediaIndex((prev) =>
                                            prev === gallery.length - 1
                                              ? 0
                                              : prev + 1,
                                          );
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10 opacity-0 group-hover:opacity-100"
                                      >
                                        <ChevronRight className="w-5 h-5 text-gray-700" />
                                      </button>

                                      {/* Favorite button */}
                                      <button
                                        onClick={() => {
                                          saveLookToBoard(
                                            historyItem.outfit,
                                            historyItem.celebrity,
                                          );
                                        }}
                                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                                      >
                                        <svg
                                          className={`w-5 h-5 transition-colors ${
                                            savedLooks.some((id) => {
                                              // Check if this look combination is already saved
                                              // This is a simplified check - in a real app you'd want more sophisticated matching
                                              return false; // For now, always show unfilled heart
                                            })
                                              ? "text-red-500 fill-current"
                                              : "text-gray-600 hover:text-red-400"
                                          }`}
                                          fill={
                                            savedLooks.some((id) => false)
                                              ? "currentColor"
                                              : "none"
                                          }
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

                                      {/* Elegant overlay gradient */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

                                      {/* Media indicators */}
                                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                        {celebrityMediaGallery[
                                          historyItem.celebrity
                                        ].map((_, mediaIndex) => (
                                          <div
                                            key={mediaIndex}
                                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                                              mediaIndex === currentMediaIndex
                                                ? "bg-white shadow-lg scale-110 ring-2 ring-white/30"
                                                : "bg-white/60 hover:bg-white/80"
                                            }`}
                                            onClick={() =>
                                              setCurrentMediaIndex(mediaIndex)
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    // Show default image for no celebrity selected
                                    <div className="w-full h-[600px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:scale-[1.01] transition-all duration-300 cursor-pointer border border-gray-200/50 shadow-lg rounded-2xl relative">
                                      <img
                                        src="/images/style-inspiration.jpg"
                                        alt="Featured style inspiration"
                                        className="w-full h-full object-cover rounded-2xl"
                                        onError={(e) => {
                                          const target =
                                            e.target as HTMLImageElement;
                                          target.src =
                                            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80";
                                        }}
                                      />

                                      {/* Favorite button for default image */}
                                      <button
                                        onClick={() => {
                                          saveLookToBoard(
                                            historyItem.outfit,
                                            undefined,
                                          );
                                        }}
                                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                                      >
                                        <svg
                                          className={`w-5 h-5 transition-colors ${
                                            savedLooks.some((id) => {
                                              // Check if this look combination is already saved
                                              // This is a simplified check - in a real app you'd want more sophisticated matching
                                              return false; // For now, always show unfilled heart
                                            })
                                              ? "text-red-500 fill-current"
                                              : "text-gray-600 hover:text-red-400"
                                          }`}
                                          fill={
                                            savedLooks.some((id) => false)
                                              ? "currentColor"
                                              : "none"
                                          }
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

                                      {/* Elegant overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
                                    </div>
                                  )}
                                  {!(historyItem.outfit as any)?.loading && (
                                    <div className="text-center flex-shrink-0 pt-4">
                                      <h4 className="font-semibold text-gray-900 mb-2 text-lg leading-tight">
                                        {historyItem.celebrity &&
                                        celebrityMediaGallery[
                                          historyItem.celebrity
                                        ]
                                          ? celebrityMediaGallery[
                                              historyItem.celebrity
                                            ][currentMediaIndex]?.title ||
                                            "Celebrity Style"
                                          : "Street Style Vibes"}
                                      </h4>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Separator line between history items */}
                          {index < searchHistory.length - 1 && (
                            <div className="mt-8 border-b border-gray-200"></div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Search Bar at Bottom - Only show when search history exists */}
                    {searchHistory.length > 0 && (
                      <div className="fixed bottom-0 left-0 right-0 z-50 p-2">
                        <div className="w-full max-w-2xl mx-auto">
                          <form onSubmit={handleSearch} className="relative">
                            <div className="relative bg-white rounded-2xl border border-beige-200 shadow-xl hover:shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-gold-500/20 focus-within:border-gold-300">
                              <textarea
                                value={searchQuery}
                                onChange={handleTextareaChange}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (searchQuery.trim()) {
                                      handleSearch(e as any);
                                    }
                                  }
                                }}
                                placeholder="Ask for another style or outfit idea..."
                                className="w-full px-3 sm:px-4 py-3 pr-36 sm:pr-40 text-sm bg-transparent border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-hidden leading-relaxed h-12 min-h-12 max-h-24"
                                disabled={isLoading}
                                rows={1}
                                suppressHydrationWarning
                              />
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <div className="text-xs sm:text-sm text-gray-400 hidden md:block whitespace-nowrap">
                                  {promptCount}/7 free
                                </div>
                                <button
                                  type="submit"
                                  disabled={isLoading || !searchQuery.trim()}
                                  className="w-8 h-8 sm:w-10 sm:h-10 bg-black hover:bg-gray-800 text-white rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Celebrity Trends Section - Only show if no search history, showSearch is true, and no initial query */}
              {searchHistory.length === 0 && showSearch && !initialQuery && (
                <div className="max-w-6xl mx-auto px-4">
                  {/* Trending Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Trending
                    </h2>
                  </div>
                  {/* Navigation arrows - only show on hover */}
                  <div
                    className="relative group"
                    onMouseEnter={() => setIsAutoScrolling(false)}
                    onMouseLeave={() => setIsAutoScrolling(true)}
                  >
                    <button
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollLeft -= 240;
                        }
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollLeft += 240;
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* Auto-scrolling celebrity cards */}
                    <div
                      ref={scrollContainerRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 px-4"
                      style={{
                        scrollBehavior: "smooth",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {/* Duplicate the array to create seamless loop */}
                      {[...celebrityTrends, ...celebrityTrends].map(
                        (trend, index) => (
                          <div
                            key={`${trend.name}-${index}`}
                            className="flex-shrink-0 w-56 cursor-pointer group"
                            onClick={() =>
                              handleStyleClick(trend.query, trend.name)
                            }
                          >
                            <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 relative">
                              <div className="aspect-[4/3] overflow-hidden">
                                <img
                                  src={trend.image}
                                  alt={trend.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                  <h3 className="font-normal text-white text-sm mb-1 tracking-wide drop-shadow-lg">
                                    {trend.name.toLowerCase()}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Show outfit suggestions here when not in search mode */}
            {outfitSuggestions && !showSearch && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side - Style Inspiration Gallery */}
                <div className="lg:w-1/3">
                  <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-4 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" /> Style
                        Inspiration
                      </h3>
                    </div>

                    {/* Image Gallery */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Style inspiration images */}
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-200 cursor-pointer">
                          <img
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80"
                            alt="Street style inspiration"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-200 cursor-pointer">
                          <img
                            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80"
                            alt="Casual chic inspiration"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-200 cursor-pointer">
                          <img
                            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80"
                            alt="Urban fashion inspiration"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-200 cursor-pointer">
                          <img
                            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80"
                            alt="Trendy outfit inspiration"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* View More Button */}
                      <button className="w-full mt-4 py-2 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors">
                        View More Styles
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side - Outfit display */}
                <div className="lg:w-2/3">
                  {(() => {
                    // Show loading state
                    if ((outfitSuggestions as any)?.loading) {
                      return (
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">
                          {/* Header with celebrity info */}
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-gray-200 animate-pulse" />
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                            </div>
                          </div>
                          {/* Loading items */}
                          <div className="p-4 space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"
                              >
                                <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                                <div className="flex-1">
                                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
                                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Loading total */}
                          <div className="border-t border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                              <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
                            </div>
                            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                          </div>
                        </div>
                      );
                    }

                    // Show actual outfit suggestions
                    return renderOutfitItems(
                      outfitSuggestions,
                      selectedCelebrity || undefined,
                      selectedCelebrity
                        ? (() => {
                            const trend = celebrityTrends.find(
                              (trend) => trend.name === selectedCelebrity,
                            );
                            return trend
                              ? { ...trend, fragrance: trend.fragrance ?? "" }
                              : undefined;
                          })()
                        : undefined,
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Signup/Payment Dialog */}
      <SignupPaymentDialog
        open={showDialog}
        onOpenChange={() => setShowDialog(false)}
      />
      {/* Sign In Dialog */}
      {showSignInDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-3 max-w-[280px] w-full mx-4">
            <div className="text-center mb-3">
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Save Your Looks
              </h3>
              <p className="text-xs text-gray-600">
                Sign in to save your favorite outfits
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                  if (error) console.error("Error:", error);
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12c-6.626 0-12 5.373-12 12 0 6.627 5.373 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12-12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46.56 7.28 1.64l3.15-3.15c17.45 2.09 14.97 1 12 1c7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07c1.43 8.55 1 10.22 1 12s.43 3.45 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15c17.45 2.09 14.97 1 12 1c7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "github",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                  if (error) console.error("Error:", error);
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.373 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <button
              onClick={() => setShowSignInDialog(false)}
              className="w-full mt-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      {/* Full Look Modal */}
      {showLookModal && selectedLookData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {selectedLookData.celebrity || "Style AI"} Look
              </h3>
              <button
                onClick={() => setShowLookModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 p-2 overflow-y-auto">
              <div className="space-y-3">
                {/* Celebrity Style Gallery */}
                {selectedLookData.celebrity &&
                  celebrityMediaGallery[selectedLookData.celebrity] && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 mb-2">
                        Style Gallery
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {celebrityMediaGallery[selectedLookData.celebrity]
                          .slice(0, 2)
                          .map((media, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                            >
                              <img
                                src={media.src}
                                alt={media.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80";
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                <div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-1">
                    Description
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {selectedLookData.outfit.main_description}
                  </p>
                </div>

                {selectedLookData.celebrityData?.fragrance && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-1">
                      Signature Fragrance
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-violet-600 font-medium">
                        🌸 {selectedLookData.celebrityData.fragrance}
                      </span>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={() =>
                    saveLookToBoard(
                      selectedLookData.outfit,
                      selectedLookData.celebrity,
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 text-xs"
                >
                  <svg
                    className="w-3 h-3"
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
                  Save to My Looks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
