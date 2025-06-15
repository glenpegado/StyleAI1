import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  Search,
  Palette,
  DollarSign,
  TrendingUp,
  Sparkles,
  Shirt,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      {/* How It Works Section */}
      <section className="py-24 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              How Urban Stylist AI Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get personalized outfit recommendations in three simple steps,
              with both premium and budget-friendly options.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                1. Search with AI
              </h3>
              <p className="text-gray-600">
                Simply type what you want to style, like "Chrome Hearts jewelry"
                or "vintage band tee"
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                2. AI Creates Your Outfit
              </h3>
              <p className="text-gray-600">
                Our AI generates complete outfit ideas with your item as the
                centerpiece
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                3. Choose Your Budget
              </h3>
              <p className="text-gray-600">
                See premium options plus 2-3 affordable alternatives for each
                piece
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Why Gen-Z Loves Urban Stylist AI
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover what makes our fashion assistant the go-to choice for
              trendy, budget-conscious style enthusiasts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Real-Time Trends",
                description: "Live data from Grailed, StockX, and Encore",
              },
              {
                icon: <DollarSign className="w-6 h-6" />,
                title: "Budget Alternatives",
                description: "2-3 affordable options for every item",
              },
              {
                icon: <Palette className="w-6 h-6" />,
                title: "AI Search",
                description:
                  "Natural language queries for instant outfit ideas",
              },
              {
                icon: <Shirt className="w-6 h-6" />,
                title: "Complete Outfits",
                description: "Full looks, not just individual pieces",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-purple-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-purple-100">Outfits Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-purple-100">Happy Stylists</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-purple-100">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              What Our Users Say
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Real feedback from fashion enthusiasts who've transformed their
              style.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Chen",
                role: "College Student",
                quote:
                  "Finally found affordable alternatives to my dream fits! The AI actually gets my style.",
                rating: 5,
              },
              {
                name: "Jordan Smith",
                role: "Creative Director",
                quote:
                  "Love how it combines high-end pieces with budget finds. Perfect for my mixed wardrobe.",
                rating: 5,
              },
              {
                name: "Taylor Kim",
                role: "Fashion Blogger",
                quote:
                  "The trend integration is insane. Always ahead of what's hot on the streets.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Choose Your Style Plan
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Unlock your fashion potential with plans designed for every budget
              and style need.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Elevate Your Style?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of fashion-forward individuals who've discovered
            their perfect style with Urban Stylist AI.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Your Style Journey
            <ArrowUpRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
