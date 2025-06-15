import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Testing OpenAI connection through Pica...");

    // Check environment variables
    if (!process.env.PICA_SECRET_KEY) {
      return NextResponse.json(
        { error: "PICA_SECRET_KEY is not configured" },
        { status: 500 },
      );
    }

    if (!process.env.PICA_OPENAI_CONNECTION_KEY) {
      return NextResponse.json(
        { error: "PICA_OPENAI_CONNECTION_KEY is not configured" },
        { status: 500 },
      );
    }

    // Simple test request to OpenAI via Pica
    const testRequestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            "Say 'Hello! Your OpenAI API key is working correctly through Pica.'",
        },
      ],
      max_tokens: 50,
    };

    console.log("Making test request to Pica API...");

    const response = await fetch(
      "https://api.picaos.com/v1/passthrough/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pica-secret": process.env.PICA_SECRET_KEY!,
          "x-pica-connection-key": process.env.PICA_OPENAI_CONNECTION_KEY!,
          "x-pica-action-id":
            "conn_mod_def::GDzgi1QfvM4::4OjsWvZhRxmAVuLAuWgfVA",
        },
        body: JSON.stringify(testRequestBody),
      },
    );

    console.log("Test API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Test API error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `API test failed: ${response.status} ${response.statusText}`,
          details: errorText,
          timestamp: new Date().toISOString(),
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const data = await response.json();
    console.log("Test API response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "No response content from OpenAI",
          timestamp: new Date().toISOString(),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "OpenAI API key is working correctly!",
      response: content,
      model_used: testRequestBody.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error testing OpenAI connection:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test OpenAI connection",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
