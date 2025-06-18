"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { User } from "@supabase/supabase-js";

interface SubscriptionCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function SubscriptionCheck({
  children,
  redirectTo = "/pricing",
}: SubscriptionCheckProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (hasChecked) return;

    const checkSubscription = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setHasChecked(true);
          setLoading(false);
          router.push("/sign-in");
          return;
        }

        setUser(user);

        // Check subscription status
        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        const subscribed = !error && !!subscription;
        setIsSubscribed(subscribed);

        if (!subscribed) {
          setHasChecked(true);
          setLoading(false);
          router.push(redirectTo);
          return;
        }

        setHasChecked(true);
        setLoading(false);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasChecked(true);
        setLoading(false);
        router.push("/sign-in");
      }
    };

    checkSubscription();
  }, [hasChecked, redirectTo, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || !isSubscribed) {
    return null;
  }

  return <>{children}</>;
}
