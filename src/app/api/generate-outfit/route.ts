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
          content: `You are a Gen-Z fashion stylist AI specializing in streetwear and urban fashion. When given a fashion query, respond with a JSON object containing outfit suggestions. The response should include:
- main_description: A brief description of the overall outfit vibe
- tops: Array of 2-3 top items (shirts, hoodies, jackets, etc.)
- accessories: Array of 2-3 accessories (jewelry, bags, hats, etc.)
- shoes: Array of 2-3 shoe options

Each item should have:
- name: Specific item name
- description: Brief style description
- price_range: Like "$50-80" or "$200-400"
- suggested_image_search: Search term for finding similar images

Include both high-end and budget alternatives. Keep the style trendy and streetwear-focused.

Example format:
{
  "main_description": "Elevated streetwear with luxury touches",
  "tops": [{"name": "Oversized Hoodie", "description": "Premium cotton blend", "price_range": "$80-120", "suggested_image_search": "oversized streetwear hoodie"}],
  "accessories": [{"name": "Chain Necklace", "description": "Chunky silver chain", "price_range": "$40-80", "suggested_image_search": "silver chain necklace streetwear"}],
  "shoes": [{"name": "High-top Sneakers", "description": "Classic basketball style", "price_range": "$100-180", "suggested_image_search": "high top sneakers streetwear"}]
}

Format your response as valid JSON only, no additional text.`,
        },
        {
          role: "user",
          content: `Create outfit suggestions for: ${query}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    console.log(
      "Making request to PICA API with body:",
      JSON.stringify(requestBody, null, 2),
    );

    // Retry logic with exponential backoff for 429 errors
    const makeRequestWithRetry = async (maxRetries = 5) => {
      let retries = 0;
      let delay = 1000; // Start with 1 second

      while (retries < maxRetries) {
        try {
          console.log(`Attempt ${retries + 1}/${maxRetries}`);

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

          // If successful or non-429 error, return the response
          if (response.ok || response.status !== 429) {
            return response;
          }

          // Handle 429 error with retry
          if (response.status === 429) {
            console.log(
              `Rate limited (429). Retry ${retries + 1}/${maxRetries} after ${delay}ms`,
            );

            // Check for Retry-After header
            const retryAfter = response.headers.get("retry-after");
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;

            if (retries < maxRetries - 1) {
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              delay = Math.min(delay * 2, 60000); // Cap at 60 seconds
              retries++;
              continue;
            }
          }

          // If we've exhausted retries or it's not a 429, return the response
          return response;
        } catch (error) {
          console.error(`Network error on attempt ${retries + 1}:`, error);

          if (retries < maxRetries - 1) {
            console.log(`Retrying after network error in ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 60000);
            retries++;
            continue;
          }

          throw error;
        }
      }

      throw new Error("Max retries reached");
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

    let outfitData;
    try {
      outfitData = JSON.parse(content);
      console.log("Parsed outfit data:", outfitData);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content);
      throw new Error("Response formatting error");
    }

    if (
      !outfitData.main_description ||
      !Array.isArray(outfitData.tops) ||
      !Array.isArray(outfitData.accessories) ||
      !Array.isArray(outfitData.shoes)
    ) {
      console.error("Invalid outfit data structure:", outfitData);
      throw new Error("Invalid outfit data structure");
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

    if (error instanceof Error) {
      console.error("Error message:", error.message);

      if (error.message.includes("PICA API error")) {
        errorMessage = "API connection error. Please try again.";
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
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: statusCode },
    );
  }
}
