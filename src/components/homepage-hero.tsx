"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface TrendItem {
  name: string;
  tags: { name: string; color: string }[];
  platform: string;
  query: string;
  image: string;
  fragrance?: string;
  tiktokEmbed?: string;
}

interface InspirationItem {
  name: string;
  category: string;
  query: string;
  image: string;
  description?: string;
}

export default function HomepageHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { promptCount, incrementPrompt, hasReachedLimit } = usePrompt();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inspirationScrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isInspirationAutoScrolling, setIsInspirationAutoScrolling] =
    useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspirationScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTypingText, setCurrentTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);

  // Trending data - expanded to include celebrities, items, influencers, and looks
  const trendingItems: TrendItem[] = [
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
    // Trending Items
    {
      name: "Cargo Pants",
      tags: [
        { name: "Trending Item", color: "bg-purple-100 text-purple-800" },
        { name: "Streetwear", color: "bg-gray-100 text-gray-800" },
        { name: "Utility", color: "bg-green-100 text-green-800" },
      ],
      platform: "Fashion",
      query:
        "Trending cargo pants outfit with utility pockets and streetwear styling",
      image:
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
    },
    {
      name: "Oversized Blazers",
      tags: [
        { name: "Trending Item", color: "bg-purple-100 text-purple-800" },
        { name: "Professional", color: "bg-blue-100 text-blue-800" },
        { name: "Versatile", color: "bg-amber-100 text-amber-800" },
      ],
      platform: "Fashion",
      query: "Oversized blazer outfit for professional and casual styling",
      image:
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
    },
    {
      name: "Chunky Sneakers",
      tags: [
        { name: "Trending Item", color: "bg-purple-100 text-purple-800" },
        { name: "Footwear", color: "bg-red-100 text-red-800" },
        { name: "Statement", color: "bg-orange-100 text-orange-800" },
      ],
      platform: "Fashion",
      query: "Chunky sneakers outfit with bold statement footwear styling",
      image:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
    },
    // More Influencers
    {
      name: "James Charles",
      tags: [
        { name: "Influencer", color: "bg-blue-100 text-blue-800" },
        { name: "Bold", color: "bg-pink-100 text-pink-800" },
        { name: "Colorful", color: "bg-rainbow-100 text-rainbow-800" },
      ],
      platform: "Instagram",
      query:
        "James Charles inspired bold colorful outfit with statement pieces",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    },
    {
      name: "Addison Rae",
      tags: [
        { name: "Influencer", color: "bg-blue-100 text-blue-800" },
        { name: "Y2K", color: "bg-pink-100 text-pink-800" },
        { name: "Trendy", color: "bg-green-100 text-green-800" },
      ],
      platform: "TikTok",
      query:
        "Addison Rae inspired Y2K trendy outfit with nostalgic 2000s styling",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616c9c1e4a3?w=400",
    },
    // Trending Looks
    {
      name: "Dark Academia",
      tags: [
        { name: "Trending Look", color: "bg-indigo-100 text-indigo-800" },
        { name: "Academic", color: "bg-amber-100 text-amber-800" },
        { name: "Vintage", color: "bg-orange-100 text-orange-800" },
      ],
      platform: "Aesthetic",
      query:
        "Dark academia outfit with vintage academic styling and scholarly vibes",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    },
    {
      name: "Cottagecore",
      tags: [
        { name: "Trending Look", color: "bg-indigo-100 text-indigo-800" },
        { name: "Romantic", color: "bg-rose-100 text-rose-800" },
        { name: "Pastoral", color: "bg-green-100 text-green-800" },
      ],
      platform: "Aesthetic",
      query:
        "Cottagecore outfit with romantic pastoral styling and countryside vibes",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    },
  ];

  // Inspiration data - looks, outfits, sneakers, and occasions
  const inspirationItems: InspirationItem[] = [
    // Occasion-based looks
    {
      name: "Ibiza Summer Look",
      category: "Occasion",
      query:
        "Ibiza summer vacation outfit with breezy fabrics and beach club vibes",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
      description: "Perfect for Mediterranean summers",
    },
    {
      name: "Old Money Look",
      category: "Aesthetic",
      query:
        "Old money aesthetic outfit with timeless luxury and understated elegance",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
      description: "Timeless luxury styling",
    },
    {
      name: "Summer in Cannes",
      category: "Occasion",
      query:
        "Cannes film festival inspired summer outfit with French Riviera elegance",
      image:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80",
      description: "French Riviera glamour",
    },
    {
      name: "Winter Date Night",
      category: "Occasion",
      query: "Winter date night outfit with cozy layers and romantic styling",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
      description: "Cozy romantic winter vibes",
    },
    // Sneaker-focused looks
    {
      name: "Air Jordan 1 Styling",
      category: "Sneakers",
      query:
        "Air Jordan 1 outfit with streetwear styling and sneaker-focused look",
      image:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
      description: "Classic sneaker styling",
    },
    {
      name: "Dunk Low Outfits",
      category: "Sneakers",
      query:
        "Nike Dunk Low outfit with casual streetwear and sneaker culture vibes",
      image:
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80",
      description: "Streetwear sneaker culture",
    },
    {
      name: "Luxury Sneaker Look",
      category: "Sneakers",
      query: "Luxury designer sneakers outfit with high-end streetwear styling",
      image:
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80",
      description: "High-end sneaker styling",
    },
    // Outfit categories
    {
      name: "Minimalist Wardrobe",
      category: "Look",
      query:
        "Minimalist capsule wardrobe outfit with clean lines and neutral colors",
      image:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80",
      description: "Clean minimalist aesthetic",
    },
    {
      name: "Maximalist Fashion",
      category: "Look",
      query:
        "Maximalist outfit with bold patterns, colors, and statement pieces",
      image:
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80",
      description: "Bold maximalist styling",
    },
    {
      name: "Sustainable Fashion",
      category: "Look",
      query:
        "Sustainable fashion outfit with eco-friendly brands and ethical styling",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
      description: "Eco-conscious styling",
    },
  ];

  // Search suggestions based on trending and popular searches
  const searchSuggestions = [
    // Celebrity-inspired searches
    "Odell Beckham Jr streetwear style",
    "Drake luxury rapper outfit",
    "Zendaya red carpet look",
    "Taylor Swift vintage aesthetic",
    "Emma Chamberlain casual outfit",
    "Serena Williams power dressing",
    // Trending items
    "Cargo pants streetwear outfit",
    "Oversized blazer styling",
    "Chunky sneakers outfit",
    "White sneakers casual look",
    "Denim jacket layering",
    "Black t-shirt styling",
    // Popular occasions
    "Date night outfit ideas",
    "Job interview professional look",
    "Weekend brunch casual",
    "Summer vacation wardrobe",
    "Winter date night outfit",
    "Business casual styling",
    // Aesthetic trends
    "Dark academia outfit",
    "Cottagecore aesthetic",
    "Old money style",
    "Y2K fashion trend",
    "Minimalist wardrobe",
    "Maximalist fashion",
    // Sneaker culture
    "Air Jordan 1 styling",
    "Nike Dunk Low outfit",
    "Luxury sneaker look",
    "Retro sneakers outfit",
    // Seasonal trends
    "Spring layering outfit",
    "Summer beach club style",
    "Fall cozy layers",
    "Winter formal wear",
    // Style categories
    "Athleisure outfit ideas",
    "Streetwear essentials",
    "Smart casual look",
    "Bohemian style outfit",
    "Preppy aesthetic",
    "Grunge fashion style",
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      // Show loading state immediately
      setIsLoading(true);

      // Navigate to prompt page with query
      const params = new URLSearchParams();
      params.set("query", query);
      router.replace(`/prompt?${params.toString()}`);
    }
  };

  const handleStyleClick = async (query: string, celebrityName?: string) => {
    // Navigate directly to prompt page without showing loading state
    const params = new URLSearchParams();
    params.set("query", query);
    if (celebrityName) {
      params.set("celebrity", celebrityName);
    }

    // Use push to navigate directly to the prompt page
    router.push(`/prompt?${params.toString()}`);
  };

  // Auto-scroll effect with infinite loop for trending
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
            container.scrollLeft += 280; // Move by approximately one card width
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

  // Auto-scroll effect for inspiration section
  useEffect(() => {
    const startInspirationAutoScroll = () => {
      if (inspirationScrollIntervalRef.current) {
        clearInterval(inspirationScrollIntervalRef.current);
      }

      inspirationScrollIntervalRef.current = setInterval(() => {
        if (inspirationScrollRef.current && isInspirationAutoScrolling) {
          const container = inspirationScrollRef.current;
          const maxScrollLeft = container.scrollWidth - container.clientWidth;

          // Check if we've reached the end
          if (container.scrollLeft >= maxScrollLeft - 1) {
            // Instantly reset to beginning for seamless loop
            container.scrollLeft = 0;
          } else {
            // Scroll right by one card width for discrete movement
            container.scrollLeft += 280; // Move by approximately one card width
          }
        }
      }, 5500); // Slightly different timing to avoid sync
    };

    if (isInspirationAutoScrolling) {
      startInspirationAutoScroll();
    }

    return () => {
      if (inspirationScrollIntervalRef.current) {
        clearInterval(inspirationScrollIntervalRef.current);
      }
    };
  }, [isInspirationAutoScrolling]);

  // Mount effect to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    setIsTyping(true);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isMounted) return;

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
  }, [isTyping, searchQuery, isMounted]);

  // Handle search suggestions
  const updateSuggestions = (query: string) => {
    if (query.trim()) {
      const filtered = searchSuggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 6); // Show max 6 suggestions
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      // Don't show suggestions when no query
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    setFocusedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setIsTyping(false);
    setIsLoading(true);

    // Trigger search immediately
    const params = new URLSearchParams();
    params.set("query", suggestion);
    router.push(`/prompt?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
      );
    } else if (e.key === "Enter" && focusedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(filteredSuggestions[focusedSuggestionIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (searchQuery.trim()) {
        handleSearch(e as any);
      }
    }
  };

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Update suggestions based on input
    updateSuggestions(value);

    // Stop typing animation when user starts typing
    if (value.trim() && isTyping) {
      setIsTyping(false);
      setCurrentTypingText("");
    } else if (!value.trim() && !isTyping && isMounted) {
      setIsTyping(true);
    }
  };

  const handleInputFocus = () => {
    // Only show suggestions if there's already text in the input
    if (searchQuery.trim()) {
      updateSuggestions(searchQuery);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="bg-white">
      {/* Loading Overlay - Completely hide homepage content */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading your style...</p>
          </div>
        </div>
      )}

      <div
        className={`relative pt-24 pb-16 sm:pt-32 sm:pb-20 ${isLoading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col">
            <div className="text-center max-w-4xl mx-auto w-full">
              {/* Title and description */}
              <div className="mb-16">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 sm:mb-10 tracking-tight px-4">
                  <span className="text-black flex items-center justify-center gap-3">
                    peacedrobe
                    <span className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full tracking-wide uppercase shadow-sm">
                      UNDER CONSTRUCTION
                    </span>
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed px-4">
                  Discover complete outfit ideas with high-end options and
                  budget-friendly alternatives
                </p>
              </div>

              {/* AI Search Bar - Centered with more margin */}
              <div className="max-w-2xl mx-auto px-4 mb-12 relative">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative bg-white rounded-2xl border border-beige-200 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-gold-500/20 focus-within:border-gold-300">
                    <textarea
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      placeholder={
                        searchQuery.trim()
                          ? ""
                          : isMounted && currentTypingText
                            ? currentTypingText
                            : "Describe your style or ask for outfit ideas..."
                      }
                      className="w-full px-4 sm:px-6 py-4 pr-44 sm:pr-52 text-sm sm:text-base bg-transparent border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-hidden leading-relaxed h-14 min-h-14 max-h-30"
                      disabled={isLoading}
                      rows={1}
                      autoFocus={isMounted}
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

                {/* Search Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm ${
                          index === focusedSuggestionIndex ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <span className="text-gray-700">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Inspiration Section */}
              <div className="max-w-6xl mx-auto px-4 mb-8">
                {/* Inspiration Title */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl text-gray-900">Inspiration</h2>
                </div>
                {/* Navigation arrows - only show on hover */}
                <div
                  className="relative group"
                  onMouseEnter={() => setIsInspirationAutoScrolling(false)}
                  onMouseLeave={() => setIsInspirationAutoScrolling(true)}
                >
                  <button
                    onClick={() => {
                      if (inspirationScrollRef.current) {
                        inspirationScrollRef.current.scrollLeft -= 240;
                      }
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      if (inspirationScrollRef.current) {
                        inspirationScrollRef.current.scrollLeft += 240;
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Auto-scrolling inspiration cards */}
                  <div
                    ref={inspirationScrollRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 px-4"
                    style={{
                      scrollBehavior: "smooth",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {/* Duplicate the array to create seamless loop */}
                    {[...inspirationItems, ...inspirationItems].map(
                      (item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex-shrink-0 w-64 cursor-pointer group"
                          onClick={() => handleStyleClick(item.query)}
                        >
                          <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 relative">
                            <div className="aspect-[4/3] overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3">
                                <div className="mb-1">
                                  <span className="text-xs text-white/80 uppercase tracking-wide font-medium">
                                    {item.category}
                                  </span>
                                </div>
                                <h3 className="font-normal text-white text-sm tracking-wide drop-shadow-lg">
                                  {item.name.toLowerCase()}
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
            </div>
          </div>
        </div>
      </div>
      {/* Signup/Payment Dialog */}
      <SignupPaymentDialog
        open={showDialog}
        onOpenChange={() => setShowDialog(false)}
      />
    </div>
  );
}
