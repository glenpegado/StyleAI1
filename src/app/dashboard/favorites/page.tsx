"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import Navbar from "@/components/navbar";
import {
  Heart,
  X,
  ExternalLink,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";

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

interface SavedLook {
  id: string;
  look_data: {
    outfit: OutfitSuggestion;
    selected_items: { [key: number]: number };
    celebrity_data?: { name: string };
  };
  search_query: string;
  celebrity_name?: string;
  total_price: number;
  created_at: string;
}

export default function FavoritesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentLook, setCurrentLook] = useState<SavedLook | null>(null);
  const [currentItemIndices, setCurrentItemIndices] = useState<{
    [key: number]: number;
  }>({});
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      setUser(user);

      // Fetch saved looks
      const { data: savedLooks, error } = await supabase
        .from("saved_looks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching saved looks:", error);
      } else {
        setSavedLooks(savedLooks || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  const removeFavorite = async (favoriteId: string) => {
    if (!user) return;

    // Optimistic UI update - remove immediately from local state
    const previousSavedLooks = savedLooks;
    setSavedLooks(savedLooks.filter((look) => look.id !== favoriteId));
    setError(null);

    try {
      const { error } = await supabase
        .from("saved_looks")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }
    } catch (err) {
      // Revert UI state on error
      setSavedLooks(previousSavedLooks);
      setError("Failed to remove favorite. Please try again.");
      console.error("Error removing favorite:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const generateQuadrantImage = (look: SavedLook): (OutfitItem | null)[] => {
    const { outfit, selected_items } = look.look_data;
    const groupedItems = {
      tops: outfit.tops || [],
      bottoms: outfit.bottoms || [],
      shoes: outfit.shoes || [],
      accessories: outfit.accessories || [],
    };

    const allCategories = Object.entries(groupedItems).filter(
      ([_, items]) => items.length > 0,
    );

    const displayItems = allCategories.map(([category, categoryItems]) => {
      const currentIndex =
        selected_items?.[
          allCategories.findIndex(([cat]) => cat === category)
        ] || 0;
      return categoryItems[currentIndex] || categoryItems[0];
    });

    // Take up to 4 items for the quadrants
    const quadrantItems: (OutfitItem | null)[] = displayItems.slice(0, 4);

    // Fill remaining quadrants with placeholder if needed
    while (quadrantItems.length < 4) {
      quadrantItems.push(null);
    }

    return quadrantItems;
  };

  if (loading) {
    return (
      <SubscriptionCheck>
        <Navbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your favorites...</p>
            </div>
          </div>
        </main>
      </SubscriptionCheck>
    );
  }

  return (
    <SubscriptionCheck>
      <Navbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Favorite Looks
              </h1>
              <p className="text-gray-600">
                {savedLooks?.length || 0} saved outfit
                {savedLooks?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Favorites Grid */}
          {!savedLooks || savedLooks.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No favorites yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start exploring outfits and save your favorites to see them
                here.
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Discover Outfits
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedLooks.map((look) => {
                const quadrantItems = generateQuadrantImage(look);
                return (
                  <FavoriteCard
                    key={look.id}
                    look={look}
                    quadrantItems={quadrantItems}
                    formatDate={formatDate}
                    onRemove={removeFavorite}
                    onOpenModal={(look) => {
                      setCurrentLook(look);
                      setCurrentItemIndices(
                        look.look_data.selected_items || {},
                      );
                      setIsOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <FavoriteModal
        isOpen={isOpen}
        currentLook={currentLook}
        currentItemIndices={currentItemIndices}
        setCurrentItemIndices={setCurrentItemIndices}
        onClose={() => {
          setIsOpen(false);
          setCurrentLook(null);
          setCurrentItemIndices({});
        }}
      />
    </SubscriptionCheck>
  );
}

function FavoriteCard({
  look,
  quadrantItems,
  formatDate,
  onRemove,
  onOpenModal,
}: {
  look: SavedLook;
  quadrantItems: (OutfitItem | null)[];
  formatDate: (date: string) => string;
  onRemove: (id: string) => void;
  onOpenModal: (look: SavedLook) => void;
}) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent event if clicking on the remove button
    if (
      (e.target as HTMLElement).closest(
        'button[aria-label="Remove from favorites"]',
      )
    ) {
      return;
    }

    // Call the onOpenModal function directly
    onOpenModal(look);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Four-quadrant image display */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <div className="grid grid-cols-2 h-full">
            {quadrantItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden"
              >
                {item?.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          {/* Overlay with heart icon */}
          <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(look.id);
              }}
              className="hover:bg-red-50 rounded-full p-1 transition-colors"
              aria-label="Remove from favorites"
            >
              <Heart className="w-4 h-4 text-red-500 fill-current hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
              {look.celebrity_name || "peacedrobe AI"} Look
            </h3>
            <Badge variant="secondary" className="text-xs ml-2">
              ${look.total_price.toLocaleString()}
            </Badge>
          </div>

          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {look.search_query}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(look.created_at)}</span>
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              View
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteModal({
  isOpen,
  currentLook,
  currentItemIndices,
  setCurrentItemIndices,
  onClose,
}: {
  isOpen: boolean;
  currentLook: SavedLook | null;
  currentItemIndices: { [key: number]: number };
  setCurrentItemIndices: React.Dispatch<
    React.SetStateAction<{ [key: number]: number }>
  >;
  onClose: () => void;
}) {
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

  if (!isOpen || !currentLook) return null;

  const outfit = currentLook.look_data.outfit;
  const groupedItems = {
    tops: outfit.tops || [],
    bottoms: outfit.bottoms || [],
    shoes: outfit.shoes || [],
    accessories: outfit.accessories || [],
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

  const renderOutfitCard = () => {
    return (
      <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200 overflow-hidden flex flex-col h-[700px]">
        {/* Header with celebrity info */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
            <img
              src={
                currentLook.celebrity_name === "Odell Beckham Jr"
                  ? "/images/odell-beckham-jr-profile-new.png"
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentLook.celebrity_name || "peacedrobe"}`
              }
              alt={currentLook.celebrity_name || "Style AI"}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentLook.celebrity_name || "peacedrobe"}`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-lg truncate">
              {currentLook.celebrity_name || "peacedrobe AI"}
            </h3>
          </div>
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
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">Total:</span>
            <span className="font-bold text-gray-900 text-lg">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 sm:p-6 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {currentLook.celebrity_name || "peacedrobe AI"} Look
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Left: Outfit Card */}
            <div className="flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md">{renderOutfitCard()}</div>
            </div>

            {/* Right: Details */}
            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                  Search Query
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base text-gray-600">
                    {currentLook.search_query}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                  Outfit Description
                </h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {outfit.main_description ||
                    "A curated outfit selection with premium and affordable alternatives."}
                </p>
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                  Style Tips
                </h4>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Mix high-end pieces with affordable alternatives for the
                    perfect balance
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Pay attention to fit and proportions for a polished look
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Accessories can make or break an outfit - choose wisely
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <p className="text-gray-600 text-sm text-center">
                  Saved on{" "}
                  {new Date(currentLook.created_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
