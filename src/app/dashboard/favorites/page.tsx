"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Heart, X, ExternalLink, ShoppingBag } from "lucide-react";
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
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError);
          setError("Failed to authenticate user");
          setLoading(false);
          return;
        }

        if (!user) {
          // Let SubscriptionCheck handle the redirect
          setLoading(false);
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
          setError("Failed to load favorites. Please try again.");
        } else {
          setSavedLooks(savedLooks || []);
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const generateQuadrantImage = (look: SavedLook) => {
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
    const quadrantItems = displayItems.slice(0, 4);

    // Fill remaining quadrants with placeholder if needed
    while (quadrantItems.length < 4) {
      quadrantItems.push(null);
    }

    return quadrantItems;
  };

  if (loading) {
    return (
      <SubscriptionCheck>
        <DashboardNavbar />
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

  if (error && !savedLooks) {
    return (
      <SubscriptionCheck>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to Load Favorites
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </SubscriptionCheck>
    );
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
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
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <FavoriteModal />
    </SubscriptionCheck>
  );
}

function FavoriteCard({
  look,
  quadrantItems,
  formatDate,
  onRemove,
}: {
  look: SavedLook;
  quadrantItems: (OutfitItem | null)[];
  formatDate: (date: string) => string;
  onRemove: (id: string) => void;
}) {
  const handleCardClick = () => {
    // Create and dispatch a custom event to open the modal
    const event = new CustomEvent("openFavoriteModal", {
      detail: { look },
    });
    window.dispatchEvent(event);
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

function FavoriteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLook, setCurrentLook] = useState<SavedLook | null>(null);

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      setCurrentLook(event.detail.look);
      setIsOpen(true);
    };

    window.addEventListener(
      "openFavoriteModal",
      handleOpenModal as EventListener,
    );
    return () => {
      window.removeEventListener(
        "openFavoriteModal",
        handleOpenModal as EventListener,
      );
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setCurrentLook(null);
  };

  if (!isOpen || !currentLook) return null;

  const outfit = currentLook.look_data.outfit;
  const selectedItems = currentLook.look_data.selected_items || {};

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
      selectedItems[allCategories.findIndex(([cat]) => cat === category)] || 0;
    return categoryItems[currentIndex] || categoryItems[0];
  });

  const totalPrice = displayItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[$,]/g, "")) || 0;
    return sum + price;
  }, 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {currentLook.celebrity_name || "peacedrobe AI"} Look
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Outfit Details */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Search Query
                </h4>
                <p className="text-gray-600">{currentLook.search_query}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Outfit Items</h4>
                {displayItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${item.image_url ? "hidden" : ""}`}
                      >
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 truncate">
                        {item.brand}
                      </h5>
                      <p className="text-gray-600 text-sm truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-gray-900">
                          {item.price}
                        </span>
                        {item.original_price && (
                          <span className="text-sm text-gray-500 line-through">
                            {item.original_price}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={item.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-600" />
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    Total Price:
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Four-quadrant image */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Look Preview</h4>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 h-full">
                  {displayItems.slice(0, 4).map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden"
                    >
                      {item?.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${item?.image_url ? "hidden" : ""}`}
                      >
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {Array(4 - Math.min(displayItems.length, 4))
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="bg-gray-50 border border-gray-200 flex items-center justify-center"
                      >
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">
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
