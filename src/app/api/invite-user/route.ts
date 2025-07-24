import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if user is authenticated and has permission to invite
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, check if a user with this email already exists
    const { data: existingUsers, error: checkError } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Adjust as needed
      });

    if (checkError) {
      console.error("Error checking existing users:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing users" },
        { status: 500 },
      );
    }

    // Check if email already exists
    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User already exists",
          message: `A user with email ${email} is already registered.`,
          userExists: true,
          existingUser: {
            id: existingUser.id,
            email: existingUser.email,
            created_at: existingUser.created_at,
            email_confirmed_at: existingUser.email_confirmed_at,
            last_sign_in_at: existingUser.last_sign_in_at,
          },
        },
        { status: 409 }, // Conflict status
      );
    }

    // If user doesn't exist, proceed with invitation
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo:
          redirectTo ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "https://peacedrobe.ai"}/dashboard`,
        data: {
          invited_by: user.email,
          invited_at: new Date().toISOString(),
        },
      });

    if (inviteError) {
      console.error("Invitation error:", inviteError);
      return NextResponse.json(
        {
          error: "Failed to send invitation",
          message: inviteError.message,
          details: inviteError,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent successfully to ${email}`,
        invitedUser: {
          id: inviteData.user.id,
          email: inviteData.user.email,
          invited_at: inviteData.user.invited_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected error in invite-user API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while processing the invitation",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check if a user exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists
    const { data: existingUsers, error: checkError } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (checkError) {
      console.error("Error checking existing users:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing users" },
        { status: 500 },
      );
    }

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    return NextResponse.json(
      {
        exists: !!existingUser,
        user: existingUser
          ? {
              id: existingUser.id,
              email: existingUser.email,
              created_at: existingUser.created_at,
              email_confirmed_at: existingUser.email_confirmed_at,
              last_sign_in_at: existingUser.last_sign_in_at,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected error in check-user API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while checking user existence",
      },
      { status: 500 },
    );
  }
}
