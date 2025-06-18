"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/client";
import {
  Heart,
  ExternalLink,
  Trash2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SavedLook {
  id: string;
  created_at: string;
  search_query: string;
  celebrity_name?: string;
  total_price: number;
  look_data: {
    outfit: any;
    selected_items: any;
    celebrity_data?: { name: string };
  };
}

export default function FavoritesPage() {
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      setUser(user);
      await fetchSavedLooks(user.id);
    };

    checkUser();
  }, []);

  const fetchSavedLooks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("saved_looks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching saved looks:", error);
        return;
      }

      setSavedLooks(data || []);
    } catch (error) {
      console.error("Error fetching saved looks:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLook = async (lookId: string) => {
    try {
      const { error } = await supabase
        .from("saved_looks")
        .delete()
        .eq("id", lookId);

      if (error) {
        console.error("Error deleting look:", error);
        alert("Failed to delete look. Please try again.");
        return;
      }

      setSavedLooks((prev) => prev.filter((look) => look.id !== lookId));
    } catch (error) {
      console.error("Error deleting look:", error);
      alert("Failed to delete look. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your saved looks...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Favorite Looks
          </h1>
          <p className="text-gray-600">
            Your saved outfit combinations and style inspirations
          </p>
        </div>

        {savedLooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No saved looks yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start exploring outfits and save your favorites to see them
                here!
              </p>
              <Button
                onClick={() => router.push("/")}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Discover Looks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLooks.map((look) => (
              <Card
                key={look.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {look.celebrity_name || "Style AI Look"}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {look.search_query}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLook(look.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Look preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Outfit includes:
                    </div>
                    <div className="space-y-1">
                      {look.look_data.outfit.tops?.length > 0 && (
                        <div className="text-xs text-gray-500">
                          • {look.look_data.outfit.tops.length} top
                          {look.look_data.outfit.tops.length > 1 ? "s" : ""}
                        </div>
                      )}
                      {look.look_data.outfit.bottoms?.length > 0 && (
                        <div className="text-xs text-gray-500">
                          • {look.look_data.outfit.bottoms.length} bottom
                          {look.look_data.outfit.bottoms.length > 1 ? "s" : ""}
                        </div>
                      )}
                      {look.look_data.outfit.shoes?.length > 0 && (
                        <div className="text-xs text-gray-500">
                          • {look.look_data.outfit.shoes.length} shoe
                          {look.look_data.outfit.shoes.length > 1 ? "s" : ""}
                        </div>
                      )}
                      {look.look_data.outfit.accessories?.length > 0 && (
                        <div className="text-xs text-gray-500">
                          • {look.look_data.outfit.accessories.length} accessor
                          {look.look_data.outfit.accessories.length > 1
                            ? "ies"
                            : "y"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(look.created_at)}
                    </div>
                    <div className="flex items-center gap-1 text-gray-900 font-medium">
                      <DollarSign className="w-4 h-4" />
                      {look.total_price.toLocaleString()}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {look.celebrity_name && (
                      <Badge variant="secondary" className="text-xs">
                        {look.celebrity_name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Saved Look
                    </Badge>
                  </div>

                  {/* Action button */}
                  <Button
                    onClick={() => {
                      // Navigate back to home with the search query
                      router.push(
                        `/?q=${encodeURIComponent(look.search_query)}`,
                      );
                    }}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Recreate Look
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
