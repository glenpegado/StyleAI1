import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return professionally structured pricing tiers
    const plans = [
      {
        id: "basic_plan",
        name: "Basic",
        amount: 999, // $9.99
        interval: "month",
        popular: false,
        features: [
          "50 outfit generations per month",
          "Basic AI styling recommendations",
          "Budget-friendly alternatives",
          "Email support",
        ],
      },
      {
        id: "premium_plan",
        name: "Premium",
        amount: 1999, // $19.99
        interval: "month",
        popular: true,
        features: [
          "200 outfit generations per month",
          "Advanced AI styling with trends",
          "Premium & budget alternatives",
          "Style quiz & personalization",
          "Priority support",
          "Save favorite outfits",
        ],
      },
      {
        id: "ultimate_plan",
        name: "Ultimate",
        amount: 2999, // $29.99
        interval: "month",
        popular: false,
        features: [
          "Unlimited outfit generations",
          "Expert AI styling with real-time trends",
          "All price tier alternatives",
          "Personal style consultant",
          "24/7 priority support",
          "Advanced wardrobe management",
          "Early access to new features",
        ],
      },
    ];

    return new Response(JSON.stringify(plans), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error getting plans:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
