import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { productId, affiliateUrl, affiliateNetwork } = await request.json();

    if (!productId || !affiliateUrl) {
      return NextResponse.json(
        { error: "Product ID and affiliate URL are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user agent and referrer from headers
    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;
    
    // Get IP address (basic implementation)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Track the click
    const { error } = await supabase
      .from('product_clicks')
      .insert({
        product_id: productId,
        user_id: user?.id || null,
        affiliate_network: affiliateNetwork,
        click_timestamp: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ip,
        referrer: referrer
      });

    if (error) {
      console.error('Failed to track product click:', error);
      return NextResponse.json(
        { error: "Failed to track click" },
        { status: 500 }
      );
    }

    // Log successful tracking
    console.log(`Product click tracked: ${productId} via ${affiliateNetwork}`);

    return NextResponse.json({ 
      success: true, 
      message: "Click tracked successfully" 
    });

  } catch (error) {
    console.error('Error tracking product click:', error);
    
    return NextResponse.json(
      {
        error: "Failed to track product click",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 