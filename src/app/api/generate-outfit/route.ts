import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import crypto from "crypto";

// In-memory cache for outfit suggestions
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateCacheKey(query: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(query.toLowerCase().trim())
    .digest("hex");
  return `outfit_${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = generateCacheKey(query);
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && cached.expiry > now) {
      console.log("Cache hit for query:", query);
      return NextResponse.json(cached.data);
    }

    // Clean expired cache entries
    for (const [key, value] of cache.entries()) {
      if (value.expiry <= now) {
        cache.delete(key);
      }
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
  "tops": [
    {
      "name": "Item name",
      "description": "Brief description",
      "price": "$XX",
      "brand": "Brand name",
      "website": "Website name",
      "website_url": "https://example.com/item",
      "image_url": "https://example.com/image.jpg",
      "availability": "In Stock" or "Limited" or "Sold Out"
    }
    // Include 2-3 alternatives with different price points
  ],
  "bottoms": [
    // Same format as tops, 2-3 alternatives
  ],
  "accessories": [
    // Same format, 2-3 alternatives including bags, jewelry, hats, etc.
  ],
  "shoes": [
    // Same format, 2-3 alternatives
  ]
}

Ensure you include both premium and affordable options. Use real brands and realistic prices. Make sure all URLs are valid and accessible.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    // Retry mechanism with exponential backoff
    const makeRequestWithRetry = async (maxRetries = 5) => {
      let attempt = 0;
      const baseDelay = 1000;

      while (attempt <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const response = await fetch(
            "https://api.picaos.com/v1/passthrough/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-pica-secret": process.env.PICA_SECRET_KEY!,
                "x-pica-connection-key":
                  process.env.PICA_OPENAI_CONNECTION_KEY!,
                "x-pica-action-id":
                  "conn_mod_def::GDzgi1QfvM4::4OjsWvZhRxmAVuLAuWgfVA",
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            return response;
          }

          // Handle specific error cases
          if (response.status === 429) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: { message: errorText } };
            }

            // Check for quota errors (don't retry these)
            const isQuotaError =
              errorData?.error?.code === "insufficient_quota" ||
              errorData?.error?.type === "insufficient_quota" ||
              errorData?.error?.message?.includes("quota") ||
              errorData?.error?.message?.includes(
                "exceeded your current quota",
              );

            if (isQuotaError) {
              throw new Error(
                JSON.stringify({
                  error:
                    "OpenAI API quota exceeded. Please check your billing.",
                  type: "quota_exceeded",
                  details: errorData?.error?.message || "Insufficient quota",
                }),
              );
            }
          }

          // Retry server errors (5xx) but only if we have attempts left
          if (response.status >= 500 && attempt < maxRetries) {
            console.warn(`Server error ${response.status}, will retry...`);
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
            continue;
          }

          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { message: errorText } };
          }

          throw new Error(
            errorData.error || `Server error: ${response.status}`,
          );
        } catch (error) {
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          throw error;
        }
      }

      throw new Error("Max retries reached. Please try again later.");
    };

    const response = await makeRequestWithRetry();

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      // Handle quota errors specifically
      if (
        response.status === 429 &&
        (errorData?.error?.code === "insufficient_quota" ||
          errorData?.error?.type === "insufficient_quota" ||
          errorData?.error?.message?.includes("quota"))
      ) {
        return NextResponse.json(
          {
            error: "OpenAI API quota exceeded. Please check your billing.",
            type: "quota_exceeded",
            details: errorData?.error?.message || "Insufficient quota",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from AI service");
    }

    // Clean and parse JSON response
    let cleanedContent = content
      .trim()
      .replace(/^```json\s*/gm, "")
      .replace(/^```\s*/gm, "")
      .replace(/\s*```$/gm, "")
      .replace(/^`+|`+$/g, "")
      .replace(/`/g, "")
      .trim();

    if (cleanedContent.startsWith("json")) {
      cleanedContent = cleanedContent.replace(/^json\s*/, "").trim();
    }

    let outfitData;
    try {
      outfitData = JSON.parse(cleanedContent);
    } catch (parseError) {
      // Try to extract JSON object
      let braceCount = 0;
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < cleanedContent.length; i++) {
        if (cleanedContent[i] === "{") {
          if (startIndex === -1) startIndex = i;
          braceCount++;
        } else if (cleanedContent[i] === "}") {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            endIndex = i;
            break;
          }
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        const extractedJson = cleanedContent.substring(
          startIndex,
          endIndex + 1,
        );
        try {
          outfitData = JSON.parse(extractedJson);
        } catch {
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Validate response structure
    if (
      !outfitData.main_description ||
      !Array.isArray(outfitData.tops) ||
      !Array.isArray(outfitData.bottoms) ||
      !Array.isArray(outfitData.accessories) ||
      !Array.isArray(outfitData.shoes)
    ) {
      throw new Error("Invalid outfit data structure");
    }

    // Enhance images by scraping actual product images
    const enhanceImages = async (items: any[]) => {
      const enhanced = await Promise.all(
        items.map(async (item) => {
          try {
            if (item.website_url && !item.image_url.includes("unsplash")) {
              // Try to scrape actual product image
              const scrapeResponse = await fetch("/api/scrape-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: item.website_url }),
              });

              if (scrapeResponse.ok) {
                const { images } = await scrapeResponse.json();
                if (images && images.length > 0) {
                  item.image_url = images[0];
                }
              }
            }
          } catch (error) {
            console.warn("Failed to enhance image for item:", item.name);
          }
          return item;
        }),
      );
      return enhanced;
    };

    // Enhance all categories
    const [enhancedTops, enhancedBottoms, enhancedAccessories, enhancedShoes] =
      await Promise.all([
        enhanceImages(outfitData.tops),
        enhanceImages(outfitData.bottoms),
        enhanceImages(outfitData.accessories),
        enhanceImages(outfitData.shoes),
      ]);

    const enhancedOutfitData = {
      ...outfitData,
      tops: enhancedTops,
      bottoms: enhancedBottoms,
      accessories: enhancedAccessories,
      shoes: enhancedShoes,
    };

    // Cache the successful response
    cache.set(cacheKey, {
      data: enhancedOutfitData,
      expiry: now + CACHE_TTL_MS,
    });
    console.log("Cached new response for query:", query);

    return NextResponse.json(enhancedOutfitData);
  } catch (error) {
    console.error("Error generating outfit:", error);

    let errorMessage = "Failed to generate outfit suggestions";
    let statusCode = 500;
    let errorType = "general_error";

    if (error instanceof Error) {
      // Check if it's a quota error
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.type === "quota_exceeded") {
          return NextResponse.json(parsedError, { status: 429 });
        }
      } catch {
        // Not a JSON error, continue with regular error handling
      }

      if (error.message.includes("quota")) {
        errorMessage = "OpenAI API quota exceeded. Please check your billing.";
        statusCode = 429;
        errorType = "quota_exceeded";
      } else if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
        statusCode = 503;
      } else if (error.message.includes("JSON")) {
        errorMessage =
          "The AI service returned an invalid response format. Please try again.";
        statusCode = 502;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        type: errorType,
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: statusCode },
    );
  }
}
