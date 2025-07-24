"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const supabase = await createClient();

  if (!email || !password || !fullName) {
    return encodedRedirect("error", "/sign-up", "All fields are required");
  }

  if (password.length < 6) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must be at least 6 characters long",
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        name: fullName,
        email: email,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://peacedrobe.ai"}/dashboard`,
    },
  });

  if (error) {
    console.error("Sign up error:", error);

    // Provide more specific error messages
    if (error.message.includes("email")) {
      return encodedRedirect(
        "error",
        "/sign-up",
        "There was an issue sending the verification email. Please check your email address and try again, or contact support if the problem persists.",
      );
    }

    return encodedRedirect("error", "/sign-up", error.message);
  }

  // Check if user was created but email might not have been sent
  if (data.user && !data.user.email_confirmed_at) {
    console.log("User created, verification email should be sent to:", email);

    return encodedRedirect(
      "success",
      "/sign-up",
      "Welcome to Peacedrobe! Please check your email (including spam folder) for a verification link from support@peacedrobe.com. If you don't receive it within 5 minutes, please try signing up again or contact support.",
    );
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Welcome to Peacedrobe! Please check your email from support@peacedrobe.com for a verification link to complete your registration.",
  );
};

export const signInAction = async (formData: FormData) => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate input
    if (!email || !password) {
      return encodedRedirect(
        "error",
        "/sign-in",
        "Email and password are required",
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      return encodedRedirect("error", "/sign-in", error.message);
    }

    if (!data.user) {
      return encodedRedirect("error", "/sign-in", "Authentication failed");
    }

    // Force a small delay to ensure session is properly set
    await new Promise((resolve) => setTimeout(resolve, 100));

    return redirect("/dashboard");
  } catch (error) {
    console.error("Unexpected error during sign in:", error);
    return encodedRedirect(
      "error",
      "/sign-in",
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};
