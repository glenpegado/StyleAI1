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
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Style Generator", icon: Sparkles },
    { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  return (
    <>
      {/* Logo in top left */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 mb-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">
            Urban Stylist AI
          </span>
        </Link>

        {/* Mobile/Desktop Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 w-full"
        >
          {isOpen ? (
            <X className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
          ) : (
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
          )}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/50 z-40 transform transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 sm:w-72 shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-gray-100/50">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 sm:gap-3"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                Urban Stylist AI
              </span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4">
            <div className="px-2 sm:px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 text-gray-700 hover:bg-gray-100/70 hover:text-gray-900 rounded-xl transition-all duration-200 group text-sm font-medium"
                  >
                    <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Section */}
          <div className="border-t border-gray-100/50 p-3 sm:p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 bg-gray-50/70 rounded-xl">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="px-2 sm:px-3">
                  <UserProfile />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 text-gray-700 hover:bg-gray-100/70 rounded-xl transition-all duration-200 w-full text-sm font-medium"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Sign In</span>
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 rounded-xl transition-all duration-200 w-full text-sm font-medium shadow-lg"
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
