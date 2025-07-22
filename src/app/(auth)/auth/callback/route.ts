import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // Handle errors from Supabase
  if (error) {
    console.error("Auth callback error:", error, error_description);
    // Redirect to sign-in page with error message using production URL
    const errorRedirectUrl = new URL(
      `/sign-in?error=${encodeURIComponent(error_description || error)}`,
      "https://peacedrobe.ai",
    );
    return NextResponse.redirect(errorRedirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      const exchangeErrorUrl = new URL(
        `/sign-in?error=${encodeURIComponent(exchangeError.message)}`,
        "https://peacedrobe.ai",
      );
      return NextResponse.redirect(exchangeErrorUrl);
    }
  }

  // URL to redirect to after sign in process completes
  const redirectTo = redirect_to || "/dashboard";

  // Use the production URL instead of request origin to avoid localhost issues
  const redirectUrl = new URL(redirectTo, "https://peacedrobe.ai");

  return NextResponse.redirect(redirectUrl);
}
