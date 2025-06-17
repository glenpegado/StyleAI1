import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
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
      temperature: 0.7,
      max_tokens: 2000,
    };

    // Robust retry mechanism with exponential backoff
    const makeRequestWithRetry = async (maxRetries = 5) => {
      let attempt = 0;
      const baseDelay = 1000;

      while (attempt <= maxRetries) {
        try {
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
            },
          );

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

          // Retry on server errors (500, 502, 503, 504)
          if (
            [500, 502, 503, 504].includes(response.status) &&
            attempt < maxRetries
          ) {
            const delay =
              baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
            continue;
          }

          return response;
        } catch (error) {
          if (attempt < maxRetries) {
            const delay =
              baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          throw error;
        }
      }

      throw new Error("Max retries reached");
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

    // Try to enhance images if scraping service is available
    try {
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
      }
    } catch (error) {
      // Continue with original images if enhancement fails
      console.warn("Image enhancement failed:", error);
    }

    return NextResponse.json(outfitData);
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
