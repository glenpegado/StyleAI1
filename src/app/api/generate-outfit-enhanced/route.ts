import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "../../../../supabase/server";
import { affiliateService } from "@/lib/affiliate-service";
import { undocumentedAPIService } from "@/lib/undocumented-api-service";

// Enhanced in-memory cache for outfit suggestions
const cache = new Map<
  string,
  { data: any; expiry: number; lastAccessed: number }
>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes (increased for enhanced endpoint)
const MAX_CACHE_SIZE = 50; // Prevent memory leaks

function generateCacheKey(query: string): string {
  return `enhanced_outfit_${Buffer.from(query.toLowerCase().trim()).toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const { query, celebrityName, styleDescription } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = generateCacheKey(query);
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && cached.expiry > now) {
      // Update last accessed time
      cached.lastAccessed = now;
      cache.set(cacheKey, cached);
      console.log("Cache hit for enhanced query:", query);
      return NextResponse.json(cached.data);
    }

    // Clean expired cache entries and enforce size limit
    const entries = Array.from(cache.entries());
    entries.forEach(([key, value]) => {
      if (value.expiry <= now) {
        cache.delete(key);
      }
    });

    // Enforce cache size limit with LRU eviction
    if (cache.size > MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(cache.entries()).sort(
        (a, b) => a[1].lastAccessed - b[1].lastAccessed,
      );
      const toRemove = sortedEntries.slice(0, cache.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => cache.delete(key));
    }

    // Check environment variables
    if (
      !process.env.PICA_SECRET_KEY ||
      !process.env.PICA_OPENAI_CONNECTION_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error: Missing API keys" },
        { status: 500 },
      );
    }

    // Step 1: Generate outfit suggestions with AI
    const aiOutfitData = await generateAIOutfit(query);

    // Step 2: Enhance with real affiliate products
    const enhancedOutfitData = await enhanceWithAffiliateProducts(
      aiOutfitData,
      celebrityName,
      styleDescription,
    );

    // Step 3: Save to database for analytics
    await saveOutfitToDatabase(enhancedOutfitData, query);

    // Cache the successful response
    cache.set(cacheKey, {
      data: enhancedOutfitData,
      expiry: now + CACHE_TTL_MS,
      lastAccessed: now,
    });

    return NextResponse.json(enhancedOutfitData);
  } catch (error) {
    console.error("Error generating enhanced outfit:", error);

    return NextResponse.json(
      {
        error: "Failed to generate enhanced outfit suggestions",
        type: "enhanced_generation_error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

async function generateAIOutfit(query: string) {
  const requestBody = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a Gen-Z fashion stylist AI that specializes in urban streetwear and trendy fashion. Your goal is to provide complete outfit suggestions that are both stylish and accessible.

When a user asks about fashion inspiration (like "I want to dress like [celebrity]" or "What goes with [item]"), provide a complete outfit suggestion with multiple alternatives for each category.

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):

{
  "main_description": "Brief description of the overall style/vibe",
  "style_keywords": ["keyword1", "keyword2", "keyword3"],
  "tops": [
    {
      "name": "Item name",
      "description": "Brief description",
      "brand": "Brand name",
      "category": "tops",
      "style_keywords": ["casual", "streetwear", "oversized"]
    }
  ],
  "bottoms": [
    {
      "name": "Item name", 
      "description": "Brief description",
      "brand": "Brand name",
      "category": "bottoms",
      "style_keywords": ["casual", "streetwear", "oversized"]
    }
  ],
  "accessories": [
    {
      "name": "Item name",
      "description": "Brief description", 
      "brand": "Brand name",
      "category": "accessories",
      "style_keywords": ["casual", "streetwear", "oversized"]
    }
  ],
  "shoes": [
    {
      "name": "Item name",
      "description": "Brief description",
      "brand": "Brand name", 
      "category": "shoes",
      "style_keywords": ["casual", "streetwear", "oversized"]
    }
  ]
}

Focus on popular brands that are likely to have affiliate partnerships. Include brands like Nike, Adidas, ASOS, Urban Outfitters, SSENSE, END Clothing, etc.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.6, // Reduced for more consistent responses
    max_tokens: 1500, // Reduced for faster responses
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

  const response = await fetch(
    "https://api.picaos.com/v1/passthrough/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pica-secret": process.env.PICA_SECRET_KEY!,
        "x-pica-connection-key": process.env.PICA_OPENAI_CONNECTION_KEY!,
        "x-pica-action-id": "conn_mod_def::GDzgi1QfvM4::4OjsWvZhRxmAVuLAuWgfVA",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    },
  );

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content received from AI API");
  }

  // Parse JSON response
  let outfitData;
  try {
    outfitData = JSON.parse(content);
  } catch (parseError) {
    // Try to extract JSON from markdown
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      outfitData = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  return outfitData;
}

async function enhanceWithAffiliateProducts(
  aiOutfitData: any,
  celebrityName?: string,
  styleDescription?: string,
) {
  const enhancedOutfit = {
    ...aiOutfitData,
    tops: [],
    bottoms: [],
    accessories: [],
    shoes: [],
    total_price: 0,
    affiliate_products_found: 0,
  };

  // Search for real products for each category
  const categories = ["tops", "bottoms", "accessories", "shoes"];

  for (const category of categories) {
    const aiItems = aiOutfitData[category] || [];

    for (const aiItem of aiItems) {
      try {
        // Search for real products matching the AI suggestion
        const searchQuery = `${aiItem.brand} ${aiItem.name}`;

        // Try affiliate networks first
        let realProducts = await affiliateService.searchProducts(
          searchQuery,
          category,
        );

        // If no affiliate products found, try undocumented APIs (based on Farfetch example)
        if (realProducts.length === 0) {
          console.log(
            `No affiliate products found for ${searchQuery}, trying undocumented APIs...`,
          );
          const discoveredProducts =
            await undocumentedAPIService.discoverAllProducts(searchQuery, 10);

          // Transform discovered products to match affiliate format
          realProducts = discoveredProducts.map((product) => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            description: product.description,
            price: product.price,
            currency: product.currency,
            website: product.website,
            website_url: product.website_url,
            affiliate_url: product.website_url, // Direct link for discovered products
            affiliate_network: "direct",
            commission_rate: 0, // No commission for direct links
            availability: product.availability,
            images: [product.image_url],
            category: product.category,
          }));
        }

        if (realProducts.length > 0) {
          // Use the best matching product
          const bestProduct = realProducts[0];

          const enhancedItem = {
            ...aiItem,
            price: bestProduct.price,
            currency: bestProduct.currency,
            website: bestProduct.website,
            website_url: bestProduct.website_url,
            affiliate_url: bestProduct.affiliate_url,
            affiliate_network: bestProduct.affiliate_network,
            commission_rate: bestProduct.commission_rate,
            availability: bestProduct.availability,
            image_url: bestProduct.images[0] || aiItem.image_url,
            real_product: true,
            product_id: bestProduct.id,
          };

          enhancedOutfit[category].push(enhancedItem);
          enhancedOutfit.total_price += bestProduct.price;
          enhancedOutfit.affiliate_products_found++;
        } else {
          // Fallback to AI suggestion with placeholder data
          enhancedOutfit[category].push({
            ...aiItem,
            price: 0,
            currency: "USD",
            website: "peacedrobe",
            website_url: "#",
            affiliate_url: "#",
            availability: "Check Availability",
            real_product: false,
          });
        }
      } catch (error) {
        console.warn(`Failed to enhance ${category} item:`, error);
        // Fallback to AI suggestion
        enhancedOutfit[category].push({
          ...aiItem,
          price: 0,
          currency: "USD",
          website: "peacedrobe",
          website_url: "#",
          affiliate_url: "#",
          availability: "Check Availability",
          real_product: false,
        });
      }
    }
  }

  // If we have celebrity context, try to find more specific products
  if (celebrityName && styleDescription) {
    try {
      const celebrityProducts = await affiliateService.searchCelebrityStyle(
        celebrityName,
        styleDescription,
      );

      // Add celebrity-specific products as alternatives
      enhancedOutfit.celebrity_alternatives = celebrityProducts.slice(0, 8);
    } catch (error) {
      console.warn("Failed to find celebrity-specific products:", error);
    }
  }

  return enhancedOutfit;
}

async function saveOutfitToDatabase(outfitData: any, query: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("No user found, skipping database save");
      return;
    }

    // Save the enhanced outfit data
    await supabase.from("saved_looks").insert({
      user_id: user.id,
      search_query: query,
      look_data: outfitData,
      total_price: outfitData.total_price,
      celebrity_name: outfitData.celebrity_name,
      products_data: {
        affiliate_products_found: outfitData.affiliate_products_found,
        categories: ["tops", "bottoms", "accessories", "shoes"].map((cat) => ({
          category: cat,
          count: outfitData[cat]?.length || 0,
          real_products:
            outfitData[cat]?.filter((item: any) => item.real_product)?.length ||
            0,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to save outfit to database:", error);
  }
}
