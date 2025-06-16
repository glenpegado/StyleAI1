import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      console.log("No query provided");
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("Processing query:", query);

    // Check environment variables
    console.log("Checking environment variables...");
    console.log("PICA_SECRET_KEY exists:", !!process.env.PICA_SECRET_KEY);
    console.log(
      "PICA_OPENAI_CONNECTION_KEY exists:",
      !!process.env.PICA_OPENAI_CONNECTION_KEY,
    );

    if (!process.env.PICA_SECRET_KEY) {
      console.error("PICA_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing PICA_SECRET_KEY" },
        { status: 500 },
      );
    }

    if (!process.env.PICA_OPENAI_CONNECTION_KEY) {
      console.error("PICA_OPENAI_CONNECTION_KEY is not set");
      return NextResponse.json(
        {
          error:
            "Server configuration error: Missing PICA_OPENAI_CONNECTION_KEY",
        },
        { status: 500 },
      );
    }

    console.log("Environment variables check passed");

    // Use PICA passthrough endpoint for OpenAI
    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Gen-Z fashion stylist AI specializing in streetwear and urban fashion. When given a fashion query, respond with a JSON object containing complete outfit suggestions.

IMPORTANT RESPONSE FORMAT RULES:
- Respond with ONLY valid JSON - no markdown, no code blocks, no backticks, no extra text
- Start your response directly with { and end with }
- Do not wrap your response in \`\`\`json or \`\`\` markers
- Do not include any explanatory text before or after the JSON
- Ensure all JSON is properly formatted with correct quotes and commas

OUTFIT GENERATION LOGIC:
- Unless the user specifies a particular item (like "Chrome Hearts jewelry" or "Jordan 1s"), always provide a COMPLETE outfit with alternatives for each category
- A complete outfit should include: tops, bottoms, shoes, and accessories
- For each category, provide 2-3 alternatives at different price points (high-end, mid-range, budget)
- If user specifies a particular item, build the outfit around that item but still provide alternatives for other categories

The JSON response should include:
- main_description: A brief description of the overall outfit vibe
- tops: Array of 2-3 top items (t-shirts, hoodies, jackets, etc.)
- bottoms: Array of 2-3 bottom items (jeans, pants, shorts, etc.)
- shoes: Array of 2-3 shoe options
- accessories: Array of 2-3 accessories (jewelry, bags, hats, etc.)

Each item should have:
- name: Specific item name
- description: Brief style description
- price: Exact price like "$89" or "$245"
- original_price: Original price if on sale (optional)
- website: Website name like "SSENSE", "END Clothing", "Farfetch", "ASOS", "Urban Outfitters"
- website_url: Full product URL
- image_url: REAL direct product image URL from the actual retailer website or high-quality fashion product images
- brand: Brand name
- availability: "In Stock" or "Limited Stock" or "Pre-order"

IMPORTANT: For image_url, provide actual product images from real fashion retailers or high-quality product photography. Use direct image URLs from sites like:
- SSENSE product images
- END Clothing product images
- Farfetch product images
- Nike/Adidas official product images
- Brand official website images
- High-quality fashion photography from reputable sources

DO NOT use generic Unsplash images. Focus on actual product photography that shows the real item being suggested.

Include both high-end and budget alternatives from real streetwear retailers. Keep the style trendy and streetwear-focused.

Example format (respond exactly like this, no extra formatting):
{"main_description":"Elevated streetwear with luxury touches","tops":[{"name":"Fear of God Essentials Hoodie","description":"Oversized fit in cream","price":"$90","brand":"Fear of God Essentials","website":"SSENSE","website_url":"https://www.ssense.com/en-us/men/product/essentials/beige-hoodie/123456","image_url":"https://img.ssensemedia.com/images/b_white,c_lpad,g_center,h_706,w_514/c_scale,h_706,w_514/f_auto,q_auto/231319M202017_1/fear-of-god-essentials-beige-hoodie.jpg","availability":"In Stock"}],"bottoms":[{"name":"Levi's 501 Original Jeans","description":"Classic straight fit in vintage wash","price":"$98","brand":"Levi's","website":"Levi's","website_url":"https://www.levi.com/US/en_US/clothing/men/jeans/501-original-fit-mens-jeans/p/005010000","image_url":"https://lsco.scene7.com/is/image/lsco/005010000-front-pdp?fmt=jpeg&qlt=70,1&op_sharpen=0&resMode=sharp2&op_usm=0.8,1,10,0&fit=crop,0&wid=750&hei=1000","availability":"In Stock"}],"accessories":[{"name":"Chrome Hearts Chain","description":"Sterling silver cross pendant","price":"$450","brand":"Chrome Hearts","website":"END Clothing","website_url":"https://www.endclothing.com/us/chrome-hearts-chain/123456","image_url":"https://media.endclothing.com/media/f_auto,q_auto:eco,w_400,h_400/prodmedia/media/catalog/product/0/5/05-12-2023_chromehearts_crosschainpendant_silver_ch-cp-001_hh_1.jpg","availability":"Limited Stock"}],"shoes":[{"name":"Jordan 1 High OG","description":"Chicago colorway","price":"$170","brand":"Nike Jordan","website":"Nike","website_url":"https://www.nike.com/t/air-jordan-1-retro-high-og/123456","image_url":"https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-jordan-1-retro-high-og-shoes-Pph9VS.png","availability":"In Stock"}]}`,
        },
        {
          role: "user",
          content: `Create outfit suggestions for: ${query}`,
        },
      ],
      n: 1,
      max_completion_tokens: 2000,
      temperature: 0.7,
    };

    console.log(
      "Making request to PICA API with body:",
      JSON.stringify(requestBody, null, 2),
    );

    // Simplified but effective retry mechanism
    const makeRequestWithRetry = async (maxRetries = 8) => {
      const baseDelayMs = 1000; // 1 second base delay
      const timeoutMs = 60000; // 1 minute timeout per request
      const maxBackoffMs = 30000; // Cap at 30 seconds
      let attempt = 0;
      let consecutiveServerErrors = 0;
      let consecutiveTimeouts = 0;

      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const getJitter = () => Math.floor(Math.random() * 1000); // 0-1000ms jitter

      const getBackoffDelay = (attemptNumber: number) => {
        // Simple exponential backoff with jitter
        const exponentialDelay =
          baseDelayMs * Math.pow(2, Math.min(attemptNumber, 5));
        const jitter = getJitter();
        const totalDelay = exponentialDelay + jitter;
        return Math.min(totalDelay, maxBackoffMs);
      };

      const fetchWithTimeout = async (
        url: string,
        options: any,
        timeout: number,
      ) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Request timeout after ${timeout}ms`);
          controller.abort();
        }, timeout);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error("Request timeout");
          }
          throw error;
        }
      };

      while (attempt <= maxRetries) {
        try {
          if (attempt > 0) {
            console.log(
              `🔄 Attempt ${attempt + 1}/${maxRetries + 1} - PICA API [Errors: ${consecutiveServerErrors}, Timeouts: ${consecutiveTimeouts}]`,
            );
          }

          // Apply backoff delay for retries
          if (attempt > 0) {
            const delay = getBackoffDelay(attempt);
            console.log(`⏳ Backoff delay: ${Math.round(delay)}ms`);
            await sleep(delay);
          }

          const startTime = Date.now();
          const response = await fetchWithTimeout(
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
            },
            timeoutMs,
          );

          const responseTime = Date.now() - startTime;
          console.log(
            `📊 Response received in ${responseTime}ms with status ${response.status}`,
          );

          // Success case
          if (response.ok) {
            console.log(
              `✅ PICA API SUCCESS on attempt ${attempt + 1} (${responseTime}ms)`,
            );
            consecutiveServerErrors = 0;
            consecutiveTimeouts = 0;
            return response;
          }

          // Server errors (502, 503, 504, 500) - retryable
          if ([500, 502, 503, 504].includes(response.status)) {
            consecutiveServerErrors++;
            console.warn(
              `⚠️ Server error ${response.status} on attempt ${attempt + 1} (consecutive: ${consecutiveServerErrors})`,
            );

            if (attempt < maxRetries) {
              attempt++;
              continue;
            }
          }

          // Rate limiting (429)
          if (response.status === 429) {
            const errorText = await response.text();
            let errorData;

            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: { message: errorText } };
            }

            console.warn(
              `⚠️ Rate limited (429) on attempt ${attempt + 1}:`,
              errorData?.error?.message || "No details",
            );

            // Check for quota errors (don't retry these)
            const isQuotaError =
              errorData?.error?.code === "insufficient_quota" ||
              errorData?.error?.type === "insufficient_quota" ||
              errorData?.error?.message?.includes("quota") ||
              errorData?.error?.message?.includes(
                "exceeded your current quota",
              ) ||
              errorData?.error?.message?.includes("billing hard limit");

            if (isQuotaError) {
              console.error("❌ Quota exceeded - not retrying");
              throw new Error(
                JSON.stringify({
                  error:
                    "💳 OpenAI API quota exceeded! If you just paid, please wait 2-3 minutes for your quota to update, then try again.",
                  type: "quota_exceeded",
                  details: errorData?.error?.message || "Insufficient quota",
                  helpUrl: "https://platform.openai.com/account/usage",
                }),
              );
            }

            // For other 429 errors (rate limiting), retry with backoff
            if (attempt < maxRetries) {
              const retryAfter = response.headers.get("retry-after");
              const waitTime = retryAfter
                ? Math.max(parseInt(retryAfter) * 1000, 5000) // Minimum 5 seconds
                : getBackoffDelay(attempt);

              console.log(`⏳ Rate limit backoff: ${Math.round(waitTime)}ms`);
              await sleep(waitTime);
              attempt++;
              continue;
            }
          }

          // For other HTTP errors, don't retry - return response for downstream handling
          console.warn(
            `⚠️ Non-retryable HTTP error ${response.status} on attempt ${attempt + 1}`,
          );
          return response;
        } catch (error) {
          const isTimeout =
            error instanceof Error && error.message === "Request timeout";
          const isNetworkError =
            error instanceof Error &&
            (error.name === "TypeError" ||
              error.message.includes("fetch") ||
              error.message.includes("ECONNRESET") ||
              error.message.includes("ENOTFOUND") ||
              error.message.includes("ETIMEDOUT") ||
              error.message.includes("network") ||
              error.message.includes("ECONNREFUSED"));

          if (isTimeout) {
            consecutiveTimeouts++;
          }

          console.error(
            `❌ ${isTimeout ? "TIMEOUT" : "NETWORK"} error on attempt ${attempt + 1}:`,
            error instanceof Error ? error.message : "Unknown error",
          );

          // Retry network/timeout errors
          if (attempt < maxRetries) {
            attempt++;
            continue;
          }

          // Max retries reached for network errors
          throw new Error(
            `${isTimeout ? "Timeout" : "Network"} error after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      throw new Error(
        `Max retries (${maxRetries + 1}) reached for PICA API. Server errors: ${consecutiveServerErrors}, Timeouts: ${consecutiveTimeouts}`,
      );
    };

    const response = await makeRequestWithRetry();

    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    console.log("PICA API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PICA API error details:");
      console.error("Status:", response.status);
      console.error("Status Text:", response.statusText);
      console.error("Error Body:", errorText);
      console.error(
        "Response Headers:",
        Object.fromEntries(response.headers.entries()),
      );

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      // Handle server errors specifically
      if (
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        return NextResponse.json(
          {
            error:
              "🔧 The AI service is experiencing server issues after multiple retry attempts. This is likely a temporary problem with the upstream service. Please wait 1-2 minutes and try again.",
            type: "server_error",
            details: `Server returned ${response.status}: ${response.statusText} after ${maxRetries + 1} attempts`,
            retryAfter: "60-120 seconds",
            suggestion:
              "Try refreshing the page or using a simpler query if the issue persists.",
          },
          { status: 503 },
        );
      }

      // Handle quota errors specifically
      if (
        response.status === 429 &&
        (errorData?.error?.code === "insufficient_quota" ||
          errorData?.error?.type === "insufficient_quota" ||
          errorData?.error?.message?.includes("quota") ||
          errorData?.error?.message?.includes("exceeded your current quota") ||
          errorData?.error?.message?.includes("billing hard limit"))
      ) {
        return NextResponse.json(
          {
            error:
              "💳 OpenAI API quota exceeded! If you just paid, please wait 2-3 minutes for your quota to update, then try again.",
            type: "quota_exceeded",
            details: errorData?.error?.message || "Insufficient quota",
            helpUrl: "https://platform.openai.com/account/usage",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText,
          status: response.status,
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const data = await response.json();
    console.log("PICA API response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in response:", data);
      throw new Error("No response content from AI service");
    }

    console.log("Raw content from AI:", content);
    console.log("Content length:", content.length);

    // Enhanced content cleaning to handle various markdown formats
    let cleanedContent = content.trim();

    // Remove markdown code block markers - handle multiple variations
    cleanedContent = cleanedContent
      .replace(/^```json\s*/gm, "")
      .replace(/^```\s*/gm, "")
      .replace(/\s*```$/gm, "")
      .replace(/^`+|`+$/g, "")
      .trim();

    // Remove any remaining backticks that might be scattered in the content
    cleanedContent = cleanedContent.replace(/`/g, "");

    // Remove any "json" text that might be left over from code block markers
    if (cleanedContent.startsWith("json")) {
      cleanedContent = cleanedContent.replace(/^json\s*/, "").trim();
    }

    console.log("Cleaned content for parsing:", cleanedContent);
    console.log("Cleaned content length:", cleanedContent.length);

    let outfitData;

    // Simplified JSON parsing with key strategies
    const parseStrategies = [
      // Strategy 1: Direct parsing
      () => {
        console.log("Trying direct JSON parsing");
        return JSON.parse(cleanedContent);
      },

      // Strategy 2: Extract balanced JSON object
      () => {
        console.log("Trying balanced braces extraction");
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
          return JSON.parse(extractedJson);
        }
        throw new Error("No balanced JSON object found");
      },

      // Strategy 3: Fix truncation issues
      () => {
        console.log("Trying truncation repair");
        let repairedContent = cleanedContent;

        // If content doesn't end with }, try to fix it
        if (!repairedContent.trim().endsWith("}")) {
          const openBraces = (repairedContent.match(/\{/g) || []).length;
          const closeBraces = (repairedContent.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;

          if (missingBraces > 0) {
            repairedContent += "}".repeat(missingBraces);
          }

          // Remove trailing comma if present
          if (repairedContent.trim().endsWith(",")) {
            repairedContent = repairedContent.trim().slice(0, -1);
          }
        }

        return JSON.parse(repairedContent);
      },
    ];

    // Try each parsing strategy
    for (let i = 0; i < parseStrategies.length; i++) {
      try {
        outfitData = parseStrategies[i]();
        console.log(`✅ Successfully parsed JSON with strategy ${i + 1}`);
        break;
      } catch (error) {
        console.warn(
          `❌ Strategy ${i + 1} failed:`,
          error instanceof Error ? error.message : "Unknown error",
        );
        if (i === parseStrategies.length - 1) {
          // All strategies failed
          throw new Error(
            `Failed to parse AI response as JSON after ${parseStrategies.length} attempts. ` +
              `Content preview: ${cleanedContent.substring(0, 200)}...`,
          );
        }
      }
    }

    if (
      !outfitData.main_description ||
      !Array.isArray(outfitData.tops) ||
      !Array.isArray(outfitData.bottoms) ||
      !Array.isArray(outfitData.accessories) ||
      !Array.isArray(outfitData.shoes)
    ) {
      console.error("Invalid outfit data structure:", outfitData);
      throw new Error("Invalid outfit data structure");
    }

    // Validate that each item has the required new fields
    const validateItems = (items: any[], category: string) => {
      items.forEach((item, index) => {
        if (!item.name || !item.price || !item.website || !item.brand) {
          console.warn(
            `Missing required fields in ${category}[${index}]:`,
            item,
          );
        }
      });
    };

    validateItems(outfitData.tops, "tops");
    validateItems(outfitData.bottoms, "bottoms");
    validateItems(outfitData.accessories, "accessories");
    validateItems(outfitData.shoes, "shoes");

    // Enhance images using the improved scraping service
    try {
      console.log("Enhancing images with improved scraping...");
      const allItems = [
        ...outfitData.tops,
        ...outfitData.bottoms,
        ...outfitData.accessories,
        ...outfitData.shoes,
      ];

      const scrapeResponse = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/scrape-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ items: allItems }),
        },
      );

      if (scrapeResponse.ok) {
        const { items: enhancedItems } = await scrapeResponse.json();

        // Map enhanced items back to categories
        let itemIndex = 0;
        outfitData.tops = enhancedItems.slice(
          itemIndex,
          itemIndex + outfitData.tops.length,
        );
        itemIndex += outfitData.tops.length;
        outfitData.bottoms = enhancedItems.slice(
          itemIndex,
          itemIndex + outfitData.bottoms.length,
        );
        itemIndex += outfitData.bottoms.length;
        outfitData.accessories = enhancedItems.slice(
          itemIndex,
          itemIndex + outfitData.accessories.length,
        );
        itemIndex += outfitData.accessories.length;
        outfitData.shoes = enhancedItems.slice(
          itemIndex,
          itemIndex + outfitData.shoes.length,
        );

        console.log("Successfully enhanced images");
      } else {
        console.warn("Image enhancement failed, using original images");
      }
    } catch (error) {
      console.error("Image enhancement error:", error);
      // Continue with original images if enhancement fails
    }

    return NextResponse.json(outfitData);
  } catch (error) {
    console.error("Error generating outfit:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    let errorMessage = "Failed to generate outfit suggestions";
    let statusCode = 500;
    let errorType = "general_error";

    if (error instanceof Error) {
      console.error("Error message:", error.message);

      // Check if it's a quota error thrown from retry logic
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.type === "quota_exceeded") {
          return NextResponse.json(parsedError, { status: 429 });
        }
      } catch {
        // Not a JSON error, continue with regular error handling
      }

      if (error.message.includes("PICA API error")) {
        errorMessage = "API connection error. Please try again.";
        statusCode = 502;
      } else if (
        error.message.includes("AI returned invalid JSON") ||
        error.message.includes("AI returned non-JSON")
      ) {
        errorMessage =
          "The AI service returned an invalid response format. Please try again with a different query.";
        statusCode = 502;
      } else if (error.message.includes("Response formatting error")) {
        errorMessage = "Response formatting error. Please try again.";
        statusCode = 502;
      } else if (error.message.includes("No response")) {
        errorMessage = "No response from AI service. Please try again.";
        statusCode = 502;
      } else if (error.message.includes("Server configuration error")) {
        errorMessage = "Server configuration error";
        statusCode = 500;
      } else if (error.message.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
        statusCode = 503;
      } else if (error.message.includes("quota")) {
        errorMessage = "OpenAI API quota exceeded. Please check your billing.";
        statusCode = 429;
        errorType = "quota_exceeded";
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
