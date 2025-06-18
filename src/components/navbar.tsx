"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { Button } from "./ui/button";
import {
  Menu,
  X,
  Home,
  Sparkles,
  CreditCard,
  User as UserIcon,
  LogIn,
  UserPlus,
  Heart,
} from "lucide-react";
import UserProfile from "./user-profile";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user profile from the database
        const { data: profile, error } = await supabase
          .from("users")
          .select("full_name, name, email")
          .eq("user_id", user.id)
          .single();

        console.log("Profile data:", profile, "Error:", error);
        setUserProfile(profile);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch user profile from the database
        const { data: profile, error } = await supabase
          .from("users")
          .select("full_name, name, email")
          .eq("user_id", session.user.id)
          .single();

        console.log("Profile data:", profile, "Error:", error);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const navItems = [
    { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  return (
    <>
      {/* Hover trigger area */}
      <div
        className="fixed top-0 left-0 w-4 h-full z-40"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transform transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 shadow-lg`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-lg font-semibold text-black">
                peacedrobe
              </span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-6 overflow-y-auto">
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 group text-sm font-medium"
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Section */}
          <div className="border-t border-gray-100 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.full_name ||
                        userProfile?.name ||
                        "Ana Volta"}
                    </p>
                  </div>
                </div>
                <div className="px-3">
                  <UserProfile />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 w-full text-sm font-medium"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Sign In</span>
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-white bg-black hover:bg-gray-800 rounded-lg transition-all duration-200 w-full text-sm font-medium shadow-lg"
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Peacedrobe Name */}
          <div className="flex items-center gap-3">
            {/* Peacedrobe Name */}
            <Link
              href="/"
              className="text-lg font-semibold text-black hover:opacity-80 transition-opacity"
            >
              peacedrobe
            </Link>
          </div>

          {/* Right side - empty for now */}
          <div></div>
        </div>
      </div>
    </>
  );
}
