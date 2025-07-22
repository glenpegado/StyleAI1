import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import crypto from "crypto";

// Enhanced in-memory cache with LRU eviction
const cache = new Map<
  string,
  { data: any; expiry: number; lastAccessed: number }
>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (increased from 5)
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

function generateCacheKey(query: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(query.toLowerCase().trim())
    .digest("hex");
  return `outfit_${hash}`;
}

// Clean cache with LRU eviction
function cleanCache() {
  const now = Date.now();
  const entries = Array.from(cache.entries());

  // Remove expired entries
  entries.forEach(([key, value]) => {
    if (value.expiry <= now) {
      cache.delete(key);
    }
  });

  // If still over limit, remove least recently used
  if (cache.size > MAX_CACHE_SIZE) {
    const sortedEntries = entries
      .filter(([key]) => cache.has(key))
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = sortedEntries.slice(0, cache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cache.delete(key));
  }
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
      // Update last accessed time
      cached.lastAccessed = now;
      cache.set(cacheKey, cached);
      console.log("Cache hit for query:", query);
      return NextResponse.json(cached.data);
    }

    // Clean cache periodically
    cleanCache();

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
          content: `You are a professional Gen-Z fashion stylist AI specializing in urban streetwear and contemporary fashion. Provide complete outfit suggestions that are stylish, accessible, and professionally curated.

When users request fashion inspiration, provide outfit suggestions with multiple price-point alternatives for each category.

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
  ],
  "bottoms": [],
  "accessories": [],
  "shoes": []
}

Include 2-3 alternatives per category with different price points. Use established brands and realistic pricing. Ensure all URLs are valid and accessible.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.6, // Reduced for more consistent responses
      max_tokens: 1500, // Reduced for faster responses
    };

    // Optimized retry mechanism with faster timeouts
    const makeRequestWithRetry = async (maxRetries = 3) => {
      let attempt = 0;
      const baseDelay = 500; // Reduced base delay

      while (attempt <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout (reduced)

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

          // Retry server errors (5xx) and rate limits but only if we have attempts left
          if (
            (response.status >= 500 || response.status === 429) &&
            attempt < maxRetries
          ) {
            console.warn(`Server error ${response.status}, will retry...`);
            const delay = Math.min(baseDelay * Math.pow(2, attempt), 5000); // Cap at 5 seconds
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
          if (
            attempt < maxRetries &&
            !(error instanceof Error && error.name === "AbortError")
          ) {
            const delay = Math.min(baseDelay * Math.pow(2, attempt), 5000);
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

    // Clean and parse JSON response with enhanced error handling
    console.log("Raw AI response content:", content);

    let cleanedContent = content
      .trim()
      .replace(/^```json\s*/gm, "")
      .replace(/^```\s*/gm, "")
      .replace(/\s*```$/gm, "")
      .replace(/^`+|`+$/g, "")
      .replace(/`/g, "")
      .replace(/\n/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Remove any leading text before the JSON
    if (cleanedContent.startsWith("json")) {
      cleanedContent = cleanedContent.replace(/^json\s*/, "").trim();
    }

    // Remove any text before the first {
    const firstBraceIndex = cleanedContent.indexOf("{");
    if (firstBraceIndex > 0) {
      cleanedContent = cleanedContent.substring(firstBraceIndex);
    }

    // Remove any text after the last }
    const lastBraceIndex = cleanedContent.lastIndexOf("}");
    if (lastBraceIndex !== -1 && lastBraceIndex < cleanedContent.length - 1) {
      cleanedContent = cleanedContent.substring(0, lastBraceIndex + 1);
    }

    console.log("Cleaned content for parsing:", cleanedContent);

    let outfitData;
    try {
      outfitData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Initial JSON parse failed:", parseError);
      console.error("Content that failed to parse:", cleanedContent);

      // Try to extract JSON object with better brace matching
      let braceCount = 0;
      let startIndex = -1;
      let endIndex = -1;
      let inString = false;
      let escapeNext = false;

      for (let i = 0; i < cleanedContent.length; i++) {
        const char = cleanedContent[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") {
            if (startIndex === -1) startIndex = i;
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
              endIndex = i;
              break;
            }
          }
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        const extractedJson = cleanedContent.substring(
          startIndex,
          endIndex + 1,
        );
        console.log("Extracted JSON:", extractedJson);
        try {
          outfitData = JSON.parse(extractedJson);
        } catch (secondParseError) {
          console.error("Second JSON parse failed:", secondParseError);
          console.error("Extracted content that failed:", extractedJson);

          // Return a fallback response instead of throwing
          return NextResponse.json(
            {
              error: "AI service returned invalid JSON format",
              type: "json_parse_error",
              details: `Parse error: ${secondParseError instanceof Error ? secondParseError.message : String(secondParseError)}`,
              raw_content:
                content.substring(0, 500) + (content.length > 500 ? "..." : ""),
              timestamp: new Date().toISOString(),
            },
            { status: 502 },
          );
        }
      } else {
        console.error(
          "Could not find valid JSON structure in content:",
          cleanedContent,
        );

        // Return a fallback response instead of throwing
        return NextResponse.json(
          {
            error: "AI service returned invalid response format",
            type: "json_structure_error",
            details: "No valid JSON structure found in response",
            raw_content:
              content.substring(0, 500) + (content.length > 500 ? "..." : ""),
            timestamp: new Date().toISOString(),
          },
          { status: 502 },
        );
      }
    }

    // Validate response structure with detailed logging
    console.log("Parsed outfit data structure:", {
      has_main_description: !!outfitData.main_description,
      has_tops: Array.isArray(outfitData.tops),
      has_bottoms: Array.isArray(outfitData.bottoms),
      has_accessories: Array.isArray(outfitData.accessories),
      has_shoes: Array.isArray(outfitData.shoes),
      keys: Object.keys(outfitData),
    });

    if (
      !outfitData.main_description ||
      !Array.isArray(outfitData.tops) ||
      !Array.isArray(outfitData.bottoms) ||
      !Array.isArray(outfitData.accessories) ||
      !Array.isArray(outfitData.shoes)
    ) {
      console.error("Invalid outfit data structure:", outfitData);

      return NextResponse.json(
        {
          error: "AI service returned incomplete outfit data",
          type: "data_structure_error",
          details: "Missing required outfit categories",
          received_structure: Object.keys(outfitData),
          timestamp: new Date().toISOString(),
        },
        { status: 502 },
      );
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
      lastAccessed: now,
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
