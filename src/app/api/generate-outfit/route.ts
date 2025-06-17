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
          content: `You are a Gen-Z fashion stylist AI specializing in streetwear and urban fashion. When given a fashion query, respond with a JSON object containing complete outfit suggestions based on ACTUAL celebrity and influencer outfits.

IMPORTANT RESPONSE FORMAT RULES:
- Respond with ONLY valid JSON - no markdown, no code blocks, no backticks, no extra text
- Start your response directly with { and end with }
- Do not wrap your response in \`\`\`json or \`\`\` markers
- Do not include any explanatory text before or after the JSON
- Ensure all JSON is properly formatted with correct quotes and commas

CELEBRITY & INFLUENCER OUTFIT SOURCING:
- Use REAL outfits worn by celebrities and influencers from platforms like Instagram, TikTok, YouTube, and red carpet events
- Source from fashion databases like outfitidentifier.com, celebrity street style blogs, and fashion magazines
- Include EXACT items they wore with specific brand names, model numbers, and retail information
- For each celebrity/influencer query, provide their ACTUAL worn items as the first option in each category
- Follow with 3-4 similar alternatives at different price points from verified retailers

STORE INTEGRATION (like shopencore.ai):
- Always include the EXACT store name where items are available
- Use real retailer names: SSENSE, END Clothing, Farfetch, NET-A-PORTER, MR PORTER, Nordstrom, Saks, Bergdorf Goodman, Matches Fashion, Browns, Dover Street Market, Selfridges, Harrods, Hermès, Gucci, Louis Vuitton, Nike, Adidas, StockX, Grailed, Vestiaire Collective
- Include direct product URLs when possible
- Show availability status (In Stock, Limited Stock, Sold Out, Pre-order)
- Display original and sale prices when applicable

CELEBRITY-SPECIFIC EXAMPLES (prioritize Odell Beckham Jr. as primary inspiration):
- Odell Beckham Jr: Hermès collaborations, Fear of God, Off-White, Chrome Hearts, luxury sneakers, statement jewelry, designer tracksuits
- Taylor Swift: Vintage-inspired pieces, cardigans, flowing skirts, romantic aesthetics
- Zendaya: Bold avant-garde pieces, statement silhouettes, high fashion
- Central Cee: UK drill streetwear, tracksuits, designer sneakers, gold chains
- Billie Eilish: Oversized fits, neon colors, alternative streetwear
- Rihanna: Edgy luxury pieces, leather, statement accessories

OUTFIT STRUCTURE:
- main_description: Brief description with celebrity inspiration and style vibe
- tops: Array of 4 items (celebrity piece + 3 alternatives)
- bottoms: Array of 4 items (celebrity piece + 3 alternatives)
- shoes: Array of 4 items (celebrity piece + 3 alternatives)
- accessories: Array of 4 items (celebrity piece + 3 alternatives)

Each item MUST include:
- name: Exact item name with model/style number if available
- description: Style description noting if celebrity-worn
- price: Current price like "$89" or "$1,245"
- original_price: Original price if on sale (optional)
- brand: Exact brand name
- website: Store name (SSENSE, Farfetch, etc.)
- website_url: Direct product URL or # if unavailable
- image_url: Real product image from retailer or high-quality fashion photography
- availability: Current stock status
- celebrity_worn: true for actual celebrity pieces, false for alternatives
- store_badge: Store logo/badge color for UI display

STORE BADGE COLORS:
- SSENSE: "bg-black text-white"
- Farfetch: "bg-purple-600 text-white"
- NET-A-PORTER: "bg-pink-600 text-white"
- Hermès: "bg-orange-500 text-white"
- Nike: "bg-gray-900 text-white"
- Adidas: "bg-blue-600 text-white"
- StockX: "bg-green-500 text-white"
- Grailed: "bg-indigo-600 text-white"

Example response format:
{"main_description":"Odell Beckham Jr's Hermès x streetwear fusion look from Paris Fashion Week 2024","tops":[{"name":"Hermès Cashmere Hoodie FW24","description":"Exact hoodie worn by OBJ at Hermès show","price":"$2,400","brand":"Hermès","website":"Hermès","website_url":"#","image_url":"https://assets.hermes.com/is/image/hermesproduct/hoodie-cashmere-fw24","availability":"Limited Stock","celebrity_worn":true,"store_badge":"bg-orange-500 text-white"},{"name":"Fear of God Essentials Hoodie","description":"Similar luxury streetwear aesthetic","price":"$90","brand":"Fear of God Essentials","website":"SSENSE","website_url":"https://www.ssense.com/en-us/men/product/essentials/beige-hoodie/123456","image_url":"https://img.ssensemedia.com/images/b_white,c_lpad,g_center,h_706,w_514/c_scale,h_706,w_514/f_auto,q_auto/231319M202017_1/fear-of-god-essentials-beige-hoodie.jpg","availability":"In Stock","celebrity_worn":false,"store_badge":"bg-black text-white"}]}`,
        },
        {
          role: "user",
          content: `Create outfit suggestions for: ${query}`,
        },
      ],
      n: 1,
      max_completion_tokens: 300,
      temperature: 0.7,
    };

    console.log(
      "Making request to PICA API with body:",
      JSON.stringify(requestBody, null, 2),
    );

    // Direct request without retries to avoid timeout compounding
    const makeRequestWithRetry = async (maxRetries = 2) => {
      const baseDelayMs = 2000; // 2 second base delay
      const timeoutMs = 15000; // 15 second timeout per request
      const maxBackoffMs = 20000; // Cap at 20 seconds
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

    const response = await makeRequestWithRetry(2);

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

    // Enhanced JSON parsing with comprehensive strategies
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

      // Strategy 3: Smart truncation recovery - find last complete section
      () => {
        console.log("Trying smart truncation recovery");
        let repairedContent = cleanedContent;

        // Remove trailing commas first
        repairedContent = repairedContent.replace(/,\s*([}\]])/g, "$1");

        // If content appears truncated (doesn't end with } or ]), try to find last complete section
        if (
          !repairedContent.trim().endsWith("}") &&
          !repairedContent.trim().endsWith("]")
        ) {
          // Find the last complete property or array element
          const lines = repairedContent.split("\n");
          let validLines = [];
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;

          for (const line of lines) {
            let lineValid = true;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];

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
                if (char === "{") braceCount++;
                else if (char === "}") braceCount--;
              }
            }

            // If this line would make braces negative or leaves us in an incomplete string, stop here
            if (
              braceCount < 0 ||
              (inString &&
                line.includes('"') &&
                !line.trim().endsWith('"') &&
                !line.trim().endsWith('",') &&
                !line.trim().endsWith('"}'))
            ) {
              lineValid = false;
            }

            if (lineValid) {
              validLines.push(line);
            } else {
              break;
            }
          }

          if (validLines.length > 0) {
            repairedContent = validLines.join("\n");

            // Clean up any trailing incomplete content
            repairedContent = repairedContent.replace(/,\s*$/, "");
            repairedContent = repairedContent.replace(/"[^"]*$/, '"'); // Close incomplete strings

            // Balance braces
            const openBraces = (repairedContent.match(/\{/g) || []).length;
            const closeBraces = (repairedContent.match(/\}/g) || []).length;
            const missingBraces = openBraces - closeBraces;

            if (missingBraces > 0) {
              repairedContent += "}".repeat(missingBraces);
            }
          }
        }

        return JSON.parse(repairedContent);
      },

      // Strategy 4: Progressive line-by-line validation with better structure detection
      () => {
        console.log("Trying progressive line validation");
        const lines = cleanedContent.split("\n");
        let bestValidContent = "";
        let bestScore = 0;

        for (let i = 0; i < lines.length; i++) {
          const testContent = lines.slice(0, i + 1).join("\n");

          try {
            // Try to balance and parse this chunk
            let balanced = testContent.replace(/,\s*$/, "");

            // Count braces and brackets
            const openBraces = (balanced.match(/\{/g) || []).length;
            const closeBraces = (balanced.match(/\}/g) || []).length;
            const openBrackets = (balanced.match(/\[/g) || []).length;
            const closeBrackets = (balanced.match(/\]/g) || []).length;

            // Add missing closing characters
            balanced += "]".repeat(Math.max(0, openBrackets - closeBrackets));
            balanced += "}".repeat(Math.max(0, openBraces - closeBraces));

            // Try to parse
            const parsed = JSON.parse(balanced);

            // Score the parsed content based on completeness
            if (parsed && typeof parsed === "object") {
              let score = 0;
              if (parsed.main_description) score += 1;
              if (Array.isArray(parsed.tops) && parsed.tops.length > 0)
                score += 1;
              if (Array.isArray(parsed.bottoms) && parsed.bottoms.length > 0)
                score += 1;
              if (Array.isArray(parsed.shoes) && parsed.shoes.length > 0)
                score += 1;
              if (
                Array.isArray(parsed.accessories) &&
                parsed.accessories.length > 0
              )
                score += 1;

              if (score > bestScore) {
                bestScore = score;
                bestValidContent = balanced;
              }
            }
          } catch {
            // This chunk is invalid, continue
            continue;
          }
        }

        if (bestValidContent && bestScore >= 2) {
          // At least main_description + one category
          return JSON.parse(bestValidContent);
        }

        throw new Error("No valid progressive content found");
      },

      // Strategy 5: Enhanced minimal viable JSON extraction with pattern matching
      () => {
        console.log("Trying enhanced minimal viable JSON extraction");

        // Try to extract data using regex patterns
        const extractData = () => {
          const result: any = {};

          // Extract main description
          const mainDescMatch = cleanedContent.match(
            /"main_description"\s*:\s*"([^"]*)"/,
          );
          if (mainDescMatch) {
            result.main_description = mainDescMatch[1];
          }

          // Extract arrays by finding their boundaries
          const extractArray = (arrayName: string) => {
            const pattern = new RegExp(
              `"${arrayName}"\\s*:\\s*\\[([^\\]]*(?:\\][^\\]]*)*?)\\]`,
              "s",
            );
            const match = cleanedContent.match(pattern);
            if (match) {
              try {
                const arrayContent = `[${match[1]}]`;
                return JSON.parse(arrayContent);
              } catch {
                // If parsing fails, try to extract individual items
                const itemMatches = match[1].match(/\{[^}]*\}/g);
                if (itemMatches) {
                  const items = [];
                  for (const itemMatch of itemMatches) {
                    try {
                      items.push(JSON.parse(itemMatch));
                    } catch {
                      // Skip invalid items
                    }
                  }
                  return items.length > 0 ? items : null;
                }
              }
            }
            return null;
          };

          // Try to extract each category
          const categories = ["tops", "bottoms", "shoes", "accessories"];
          for (const category of categories) {
            const extracted = extractArray(category);
            if (extracted && extracted.length > 0) {
              result[category] = extracted;
            }
          }

          return result;
        };

        const extractedData = extractData();

        // If we have at least a description, create a response
        if (extractedData.main_description) {
          const minimalResponse = {
            main_description: extractedData.main_description,
            tops: extractedData.tops || [
              {
                name: "Stylish Top",
                description: "Trendy piece",
                price: "$50",
                brand: "Fashion Brand",
                website: "Online Store",
                website_url: "#",
                image_url:
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                availability: "In Stock",
              },
            ],
            bottoms: extractedData.bottoms || [
              {
                name: "Stylish Bottom",
                description: "Trendy piece",
                price: "$60",
                brand: "Fashion Brand",
                website: "Online Store",
                website_url: "#",
                image_url:
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                availability: "In Stock",
              },
            ],
            shoes: extractedData.shoes || [
              {
                name: "Stylish Shoes",
                description: "Trendy footwear",
                price: "$80",
                brand: "Shoe Brand",
                website: "Online Store",
                website_url: "#",
                image_url:
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                availability: "In Stock",
              },
            ],
            accessories: extractedData.accessories || [
              {
                name: "Stylish Accessory",
                description: "Trendy accent",
                price: "$30",
                brand: "Accessory Brand",
                website: "Online Store",
                website_url: "#",
                image_url:
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                availability: "In Stock",
              },
            ],
          };

          return minimalResponse;
        }

        throw new Error("Could not extract minimal viable JSON");
      },
    ];

    // Try each parsing strategy with detailed logging
    let lastError = null;
    for (let i = 0; i < parseStrategies.length; i++) {
      try {
        console.log(
          `Attempting parsing strategy ${i + 1}/${parseStrategies.length}`,
        );
        outfitData = parseStrategies[i]();
        console.log(`✅ Successfully parsed JSON with strategy ${i + 1}`);
        console.log(`Parsed data structure:`, {
          hasMainDescription: !!outfitData?.main_description,
          topsCount: Array.isArray(outfitData?.tops)
            ? outfitData.tops.length
            : "not array",
          bottomsCount: Array.isArray(outfitData?.bottoms)
            ? outfitData.bottoms.length
            : "not array",
          shoesCount: Array.isArray(outfitData?.shoes)
            ? outfitData.shoes.length
            : "not array",
          accessoriesCount: Array.isArray(outfitData?.accessories)
            ? outfitData.accessories.length
            : "not array",
        });
        break;
      } catch (error) {
        lastError = error;
        console.warn(
          `❌ Strategy ${i + 1} failed:`,
          error instanceof Error ? error.message : "Unknown error",
        );
        if (i === parseStrategies.length - 1) {
          // All strategies failed - provide detailed error info
          console.error("All parsing strategies failed. Content analysis:");
          console.error("Original content length:", content.length);
          console.error("Cleaned content length:", cleanedContent.length);
          console.error(
            "Content starts with:",
            cleanedContent.substring(0, 100),
          );
          console.error(
            "Content ends with:",
            cleanedContent.substring(Math.max(0, cleanedContent.length - 100)),
          );
          console.error("Last error:", lastError);

          throw new Error(
            `Failed to parse AI response as JSON after ${parseStrategies.length} attempts. ` +
              `Last error: ${lastError instanceof Error ? lastError.message : "Unknown"}. ` +
              `Content preview: ${cleanedContent.substring(0, 200)}...`,
          );
        }
      }
    }

    // Enhanced validation with better error reporting
    const validateOutfitStructure = (data: any) => {
      const errors = [];

      if (!data || typeof data !== "object") {
        errors.push("Data is not an object");
        return errors;
      }

      if (!data.main_description || typeof data.main_description !== "string") {
        errors.push("Missing or invalid main_description");
      }

      const requiredArrays = ["tops", "bottoms", "accessories", "shoes"];
      for (const arrayName of requiredArrays) {
        if (!Array.isArray(data[arrayName])) {
          errors.push(`${arrayName} is not an array`);
        } else if (data[arrayName].length === 0) {
          errors.push(`${arrayName} array is empty`);
        }
      }

      return errors;
    };

    const validationErrors = validateOutfitStructure(outfitData);
    if (validationErrors.length > 0) {
      console.error("Outfit data validation failed:", validationErrors);
      console.error("Received data:", JSON.stringify(outfitData, null, 2));

      // Try to create a minimal valid structure if possible
      if (
        outfitData &&
        typeof outfitData === "object" &&
        outfitData.main_description
      ) {
        console.log("Attempting to repair outfit data structure...");

        const repairedData = {
          main_description: outfitData.main_description,
          tops:
            Array.isArray(outfitData.tops) && outfitData.tops.length > 0
              ? outfitData.tops
              : [
                  {
                    name: "Stylish Top",
                    description: "Trendy piece",
                    price: "$50",
                    brand: "Fashion Brand",
                    website: "Online Store",
                    website_url: "#",
                    image_url:
                      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                    availability: "In Stock",
                  },
                ],
          bottoms:
            Array.isArray(outfitData.bottoms) && outfitData.bottoms.length > 0
              ? outfitData.bottoms
              : [
                  {
                    name: "Stylish Bottom",
                    description: "Trendy piece",
                    price: "$60",
                    brand: "Fashion Brand",
                    website: "Online Store",
                    website_url: "#",
                    image_url:
                      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                    availability: "In Stock",
                  },
                ],
          shoes:
            Array.isArray(outfitData.shoes) && outfitData.shoes.length > 0
              ? outfitData.shoes
              : [
                  {
                    name: "Stylish Shoes",
                    description: "Trendy footwear",
                    price: "$80",
                    brand: "Shoe Brand",
                    website: "Online Store",
                    website_url: "#",
                    image_url:
                      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                    availability: "In Stock",
                  },
                ],
          accessories:
            Array.isArray(outfitData.accessories) &&
            outfitData.accessories.length > 0
              ? outfitData.accessories
              : [
                  {
                    name: "Stylish Accessory",
                    description: "Trendy accent",
                    price: "$30",
                    brand: "Accessory Brand",
                    website: "Online Store",
                    website_url: "#",
                    image_url:
                      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
                    availability: "In Stock",
                  },
                ],
        };

        console.log("Successfully repaired outfit data structure");
        outfitData = repairedData;
      } else {
        throw new Error(
          `Invalid outfit data structure: ${validationErrors.join(", ")}`,
        );
      }
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
