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
}

export default function Hero({ showSearch = true }: HeroProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStyleLoading, setIsStyleLoading] = useState(false);
  const [outfitSuggestions, setOutfitSuggestions] =
    useState<OutfitSuggestion | null>(null);
  const { promptCount, incrementPrompt, hasReachedLimit } = usePrompt();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTypingText, setCurrentTypingText] = useState("");
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const [selectedCelebrity, setSelectedCelebrity] = useState<string | null>(
    null,
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
  const supabase = createClient();

  const generateOutfit = async (query: string) => {
    if (hasReachedLimit) {
      setShowDialog(true);
      return;
    }

    // Show loading state immediately for both outfit and style
    setOutfitSuggestions({ loading: true } as any);
    setIsLoading(true);

    // Increment prompt count after successful API call to prevent issues with auto-reset
    // incrementPrompt();

    // Simplified retry logic with better error handling
    const makeRequestWithRetry = async (maxRetries = 3) => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(
              `Retrying request (${attempt + 1}/${maxRetries + 1}) after ${delay}ms`,
            );
            await sleep(delay);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          try {
            const response = await fetch("/api/generate-outfit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              return response;
            }

            // Handle non-200 responses
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText };
            }

            // Don't retry client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
              throw new Error(
                errorData.error || `Client error: ${response.status}`,
              );
            }

            // Retry server errors (5xx) but only if we have attempts left
            if (response.status >= 500 && attempt < maxRetries) {
              console.warn(`Server error ${response.status}, will retry...`);
              continue;
            }

            throw new Error(
              errorData.error || `Server error: ${response.status}`,
            );
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === "AbortError") {
              if (attempt < maxRetries) {
                console.warn("Request timeout, retrying...");
                continue;
              }
              throw new Error("Request timeout. Please try again.");
            }

            // Don't retry for non-network errors
            if (
              !error.message.includes("fetch") &&
              !error.message.includes("network")
            ) {
              throw error;
            }

            // Retry network errors
            if (attempt < maxRetries) {
              console.warn("Network error, retrying...");
              continue;
            }
          }

          throw error;
        }
      }

      throw new Error("Max retries reached. Please try again later.");
    };

    try {
      const response = await makeRequestWithRetry();

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Set both outfit suggestions and style loading to complete simultaneously
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

      // Show simplified error message
      alert(
        errorMessage ||
          "Sorry, there was an error generating your outfit. Please try again.",
      );
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

  const handleStyleClick = async (query: string, celebrityName?: string) => {
    setSearchQuery(query); // Update search query to match the clicked style
    if (celebrityName && !selectedCelebrity) {
      setSelectedCelebrity(celebrityName);
    }
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

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 120); // Min 48px, Max height of ~3 lines
    textarea.style.height = `${newHeight}px`;
    setTextareaHeight(`${newHeight}px`);

    // Stop typing animation when user starts typing
    if (value.trim() && isTyping) {
      setIsTyping(false);
      setCurrentTypingText("");
    } else if (!value.trim() && !isTyping) {
      setIsTyping(true);
    }
  };

  // Celebrity media gallery
  const celebrityMediaGallery = {
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
      image: "/images/odell-beckham-jr-new-3.jpg",
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

    return (
      <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
        {/* Header with celebrity info */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-gray-200 overflow-hidden flex-shrink-0">
            <img
              src={
                celebrityName === "Odell Beckham Jr"
                  ? "/images/odell-beckham-jr-new-3.jpg"
                  : celebrityData?.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrityName || "StyleAI"}`
              }
              alt={celebrityName || "Style AI"}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrityName || "StyleAI"}`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-lg truncate">
              {celebrityName || "peacedrobe AI"}
            </h3>
            {celebrityData?.fragrance && (
              <p className="text-slate-600 text-sm mb-1">
                🌸 {celebrityData.fragrance}
              </p>
            )}
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
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
        <div className="p-3 space-y-2 flex-1 overflow-hidden">
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
                        <div
                          className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            currentItem.store_badge ||
                            "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {currentItem.website}
                        </div>
                        {currentItem.celebrity_worn && (
                          <div className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 px-1.5 py-0.5 rounded-full text-xs font-medium border border-slate-200">
                            ⭐ Celebrity
                          </div>
                        )}
                        {currentItem.availability === "Limited Stock" && (
                          <div className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                            Limited
                          </div>
                        )}
                        {currentItem.availability === "In Stock" && (
                          <div className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                            In Stock
                          </div>
                        )}
                        {currentItem.availability === "Sold Out" && (
                          <div className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                            Sold Out
                          </div>
                        )}
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

          {/* View Full Look Button */}
          <button
            onClick={() => {
              setSelectedLookData({
                outfit: outfitData,
                celebrity: celebrityName,
                celebrityData,
              });
              setShowLookModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm"
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
            View Full Look
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      <div
        className={`relative ${outfitSuggestions ? "pt-8 pb-16" : "pt-24 pb-32 sm:pt-32 sm:pb-40"}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col" id="hero-content">
            <div className="text-center max-w-4xl mx-auto w-full">
              {/* Title and description - only show when no outfit suggestions */}
              <div
                className={`transition-all duration-500 ease-in-out ${outfitSuggestions ? "opacity-0 transform -translate-y-4 h-0 overflow-hidden" : "opacity-100 transform translate-y-0"}`}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight px-4">
                  <span className="text-black">peacedrobe</span>
                </h1>

                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
                  Discover complete outfit ideas with high-end options and
                  budget-friendly alternatives
                </p>
              </div>

              {/* AI Search Bar - Only show if showSearch is true and no outfit suggestions */}
              {showSearch && !outfitSuggestions && (
                <div className="max-w-2xl mx-auto px-4 mb-12">
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
                            ? "Describe your style or ask for outfit ideas..."
                            : currentTypingText ||
                              "Describe your style or ask for outfit ideas..."
                        }
                        className="w-full px-4 sm:px-6 py-4 pr-32 sm:pr-36 text-sm sm:text-base bg-transparent border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-hidden leading-relaxed"
                        disabled={isLoading}
                        rows={1}
                        style={{
                          height: searchQuery ? textareaHeight : "56px",
                          minHeight: "56px",
                          maxHeight: "120px",
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">
                          {promptCount}/7 free
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading || !searchQuery.trim()}
                          className="px-3 sm:px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs sm:text-sm shadow-md hover:shadow-lg flex-shrink-0 min-w-[80px] sm:min-w-[100px] justify-center"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              <span className="hidden sm:inline">
                                Styling...
                              </span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Style</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Outfit Suggestions Panel - Show below search area */}
              {outfitSuggestions && showSearch && (
                <div className="w-full max-w-7xl mx-auto mb-12 px-4">
                  <div className="flex flex-col gap-8">
                    {/* Content area with outfit display and style inspiration side by side */}
                    <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
                      {/* Left side - Outfit display */}
                      <div className="w-full lg:w-auto lg:min-w-[450px] lg:max-w-[450px] flex">
                        {(() => {
                          // Show loading state
                          if ((outfitSuggestions as any)?.loading) {
                            return (
                              <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
                                {/* Header with celebrity info */}
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-gray-200 animate-pulse" />
                                  <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                                  </div>
                                </div>
                                {/* Loading items */}
                                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
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
                                <div className="border-t border-gray-200 p-4 flex-shrink-0">
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
                              ? celebrityTrends.find(
                                  (trend) => trend.name === selectedCelebrity,
                                )
                              : undefined,
                          );
                        })()}
                      </div>

                      {/* Right side - Style Inspiration Gallery */}
                      <div className="w-full lg:w-auto lg:min-w-[450px] lg:max-w-[450px] flex">
                        {(outfitSuggestions as any)?.loading ? (
                          // Loading state for style inspiration
                          <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
                            {/* Header */}
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-gray-200 animate-pulse" />
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                              </div>
                            </div>
                            {/* Loading content */}
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="w-full h-[400px] bg-gray-200 rounded-lg animate-pulse" />
                              <div className="mt-4 text-center flex-shrink-0">
                                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 mx-auto w-32" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse mx-auto w-24" />
                              </div>
                            </div>
                            {/* Loading footer */}
                            <div className="border-t border-gray-200 p-4 flex-shrink-0">
                              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
                            {/* Header */}
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                <Star className="w-6 h-6 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 text-lg truncate">
                                  Style Inspiration
                                </h3>
                                <p className="text-gray-500 text-sm">
                                  Trending looks
                                </p>
                              </div>
                            </div>

                            {/* Single Featured Content - Celebrity Images */}
                            <div className="flex-1 flex flex-col p-4">
                              {selectedCelebrity &&
                              celebrityMediaGallery[selectedCelebrity] ? (
                                // Show dynamic media for selected celebrity
                                <div className="w-full h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative shadow-lg border border-gray-200/50 rounded-2xl">
                                  <img
                                    src={
                                      celebrityMediaGallery[selectedCelebrity][
                                        currentMediaIndex
                                      ]?.src
                                    }
                                    alt={
                                      celebrityMediaGallery[selectedCelebrity][
                                        currentMediaIndex
                                      ]?.title
                                    }
                                    className="w-full h-full object-cover transition-all duration-500 hover:scale-[1.02] rounded-2xl"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src =
                                        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80";
                                    }}
                                  />

                                  {/* Elegant overlay gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

                                  {/* Media indicators */}
                                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                    {celebrityMediaGallery[
                                      selectedCelebrity
                                    ].map((_, index) => (
                                      <div
                                        key={index}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                          index === currentMediaIndex
                                            ? "bg-white shadow-lg scale-110 ring-2 ring-white/30"
                                            : "bg-white/60 hover:bg-white/80"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                // Show default image for no celebrity selected
                                <div className="w-full h-[400px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:scale-[1.01] transition-all duration-300 cursor-pointer border border-gray-200/50 shadow-lg rounded-2xl relative">
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
                                  {/* Elegant overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
                                </div>
                              )}
                              <div className="text-center flex-shrink-0 pt-4">
                                <h4 className="font-semibold text-gray-900 mb-2 text-lg leading-tight">
                                  {selectedCelebrity &&
                                  celebrityMediaGallery[selectedCelebrity]
                                    ? celebrityMediaGallery[selectedCelebrity][
                                        currentMediaIndex
                                      ]?.title || "Celebrity Style"
                                    : "Street Style Vibes"}
                                </h4>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                  {selectedCelebrity &&
                                  celebrityMediaGallery[selectedCelebrity]
                                    ? "Celebrity Fashion Moments"
                                    : "Effortless urban fashion"}
                                </p>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 p-4 flex-shrink-0">
                              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                                <svg
                                  className="w-5 h-5"
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
                                View More Styles
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Search Bar at Bottom - Only show when outfit suggestions are present */}
                    <div className="w-full max-w-4xl mx-auto px-4 mb-6 transform transition-all duration-500 ease-in-out">
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
                            className="w-full px-4 sm:px-6 py-4 pr-32 sm:pr-40 text-sm sm:text-base bg-transparent border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-hidden leading-relaxed"
                            disabled={isLoading}
                            rows={1}
                            style={{
                              height: searchQuery ? textareaHeight : "56px",
                              minHeight: "56px",
                              maxHeight: "120px",
                            }}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <div className="text-xs sm:text-sm text-gray-400 hidden md:block whitespace-nowrap">
                              {promptCount}/7 free
                            </div>
                            <button
                              type="submit"
                              disabled={isLoading || !searchQuery.trim()}
                              className="px-3 sm:px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1.5 text-xs sm:text-sm flex-shrink-0 min-w-[80px] sm:min-w-[100px] justify-center"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                  <span className="hidden sm:inline">
                                    Styling...
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">
                                    Style
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Celebrity Trends Section - Only show if no outfit suggestions and showSearch is true */}
              {!outfitSuggestions && showSearch && (
                <div className="max-w-6xl mx-auto px-4">
                  <div className="text-center mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      Trending Celebrity Styles
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Get inspired by your favorite celebrities' latest looks
                    </p>
                  </div>

                  {/* Auto-scrolling celebrity cards */}
                  <div className="relative">
                    <div
                      ref={scrollContainerRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                      style={{
                        scrollBehavior: "smooth",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                      onMouseEnter={() => setIsAutoScrolling(false)}
                      onMouseLeave={() => setIsAutoScrolling(true)}
                    >
                      {/* Duplicate the array to create seamless loop */}
                      {[...celebrityTrends, ...celebrityTrends].map(
                        (trend, index) => (
                          <div
                            key={`${trend.name}-${index}`}
                            className="flex-shrink-0 w-40 cursor-pointer group"
                            onClick={() =>
                              handleStyleClick(trend.query, trend.name)
                            }
                          >
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                              <div className="aspect-square overflow-hidden">
                                <img
                                  src={trend.image}
                                  alt={trend.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className="p-3">
                                <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate">
                                  {trend.name}
                                </h3>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {trend.tags
                                    .slice(0, 1)
                                    .map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}
                                      >
                                        {tag.name}
                                      </span>
                                    ))}
                                  {trend.platform !== "Celebrity" && (
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        trend.platform === "Instagram"
                                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                          : trend.platform === "TikTok"
                                            ? "bg-gradient-to-r from-gray-800 to-gray-600 text-white"
                                            : trend.platform === "YouTube"
                                              ? "bg-red-600 text-white"
                                              : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {trend.platform}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center text-slate-600 text-xs font-medium">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Get the look
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
                        ? celebrityTrends.find(
                            (trend) => trend.name === selectedCelebrity,
                          )
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
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      />
      {/* Sign In Dialog */}
      {showSignInDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Save Your Looks
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Sign in to save and organize your favorite outfit combinations
              </p>
            </div>

            <div className="space-y-3">
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
                className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
              >
                <svg
                  className="w-5 h-5"
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
              className="w-full mt-3 sm:mt-4 py-2 text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      {/* Full Look Modal */}
      {showLookModal && selectedLookData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 sm:p-6 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {selectedLookData.celebrity || "Style AI"} Look
              </h3>
              <button
                onClick={() => setShowLookModal(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Left: Outfit Card */}
                <div className="flex justify-center order-2 lg:order-1">
                  <div className="w-full max-w-md">
                    {renderOutfitItems(
                      selectedLookData.outfit,
                      selectedLookData.celebrity,
                      selectedLookData.celebrityData,
                    )}
                  </div>
                </div>

                {/* Right: Details */}
                <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                  {/* Celebrity Style Gallery */}
                  {selectedLookData.celebrity &&
                    celebrityMediaGallery[selectedLookData.celebrity] && (
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                          Style Inspiration Gallery
                        </h4>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {celebrityMediaGallery[selectedLookData.celebrity]
                            .slice(0, 4)
                            .map((media, index) => (
                              <div
                                key={index}
                                className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                              >
                                <img
                                  src={media.src}
                                  alt={media.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
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
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                      Outfit Description
                    </h4>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {selectedLookData.outfit.main_description}
                    </p>
                  </div>

                  {selectedLookData.celebrityData?.fragrance && (
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Signature Fragrance
                      </h4>
                      <p className="text-sm sm:text-base text-violet-600 font-medium">
                        🌸 {selectedLookData.celebrityData.fragrance}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                      Style Tips
                    </h4>
                    <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Mix high-end pieces with affordable alternatives for the
                        perfect balance
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Pay attention to fit and proportions for a polished look
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Accessories can make or break an outfit - choose wisely
                      </li>
                    </ul>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <button
                      onClick={() =>
                        saveLookToBoard(
                          selectedLookData.outfit,
                          selectedLookData.celebrity,
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
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
          </div>
        </div>
      )}
    </div>
  );
}
