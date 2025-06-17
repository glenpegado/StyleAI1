import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Favorites() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch saved looks for the user
  const { data: savedLooks, error } = await supabase
    .from("saved_looks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center gap-3 mb-8">
            <Heart className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600 mt-1">
                Your saved outfit looks and style inspirations
              </p>
            </div>
          </header>

          {/* Favorites Grid */}
          {savedLooks && savedLooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedLooks.map((look) => {
                const lookData =
                  typeof look.look_data === "string"
                    ? JSON.parse(look.look_data)
                    : look.look_data;

                return (
                  <Card
                    key={look.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {look.search_query}
                          </CardTitle>
                          {look.celebrity_name && (
                            <Badge variant="secondary" className="mt-2">
                              {look.celebrity_name}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Outfit Items Preview */}
                      {lookData && lookData.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            Outfit Items ({lookData.length})
                          </p>
                          <div className="space-y-1">
                            {lookData
                              .slice(0, 3)
                              .map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-sm text-gray-600 truncate"
                                >
                                  • {item.name || item.title || "Fashion Item"}
                                </div>
                              ))}
                            {lookData.length > 3 && (
                              <div className="text-sm text-gray-500">
                                +{lookData.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price and Date */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          {look.total_price
                            ? formatPrice(look.total_price)
                            : "Price varies"}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(look.created_at)}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button className="w-full mt-4" variant="outline">
                        View Full Look
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No favorites yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start exploring outfits and click the &quot;Like Look&quot;
                button to save your favorite styles here.
              </p>
              <Button asChild>
                <a href="/">Discover Outfits</a>
              </Button>
            </div>
          )}
        </div>
      </main>
    </SubscriptionCheck>
  );
}
