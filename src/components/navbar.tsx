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
  Search,
  MessageSquare,
  Clock,
} from "lucide-react";
import UserProfile from "./user-profile";
import { User } from "@supabase/supabase-js";

interface SavedPrompt {
  id: string;
  query: string;
  celebrity_name?: string;
  created_at: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const supabase = createClient();

  // Fetch saved prompts for the user
  const fetchSavedPrompts = async (userId: string) => {
    setLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("id, query, celebrity_name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching prompts:", error);
        return;
      }

      setSavedPrompts(data || []);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        fetchSavedPrompts(user.id);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchSavedPrompts(session.user.id);
      } else {
        setSavedPrompts([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    // Force navigation using window.location for immediate response
    if (typeof window !== "undefined") {
      window.location.href = href;
    }
  };

  const handlePromptClick = (query: string, celebrity?: string) => {
    setIsOpen(false);
    const params = new URLSearchParams();
    params.set("query", query);
    if (celebrity) {
      params.set("celebrity", celebrity);
    }

    // Check if we're already on the prompt page
    if (window.location.pathname === "/prompt") {
      // Just update the URL parameters without navigation
      window.history.pushState({}, "", `/prompt?${params.toString()}`);
      // Trigger a custom event to notify the prompt page of the change
      window.dispatchEvent(
        new CustomEvent("promptUpdate", {
          detail: { query, celebrity },
        }),
      );
    } else {
      // Navigate to prompt page
      window.location.href = `/prompt?${params.toString()}`;
    }
  };

  const handleDeletePrompt = async (
    promptId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent triggering the prompt click

    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", promptId);

      if (error) {
        console.error("Error deleting prompt:", error);
        return;
      }

      // Remove the deleted prompt from the local state
      setSavedPrompts((prev) =>
        prev.filter((prompt) => prompt.id !== promptId),
      );
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const navItems = [
    { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transform transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-lg font-semibold text-black">
                peacedrobe
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-6 overflow-y-auto">
            {/* Searches Section - Only show if user is logged in */}
            {user && (
              <div className="px-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 mb-3">
                  <Search className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Searches
                  </span>
                </div>

                {loadingPrompts ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="px-3 py-2 rounded-lg">
                        <div className="h-3 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : savedPrompts.length > 0 ? (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {savedPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        onClick={() =>
                          handlePromptClick(
                            prompt.query,
                            prompt.celebrity_name || undefined,
                          )
                        }
                        className="flex items-start gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 cursor-pointer group relative"
                      >
                        <MessageSquare className="w-3 h-3 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate mb-0.5">
                            {truncateText(prompt.query)}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDate(prompt.created_at)}</span>
                            {prompt.celebrity_name && (
                              <>
                                <span>•</span>
                                <span className="text-violet-500 font-medium">
                                  {prompt.celebrity_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeletePrompt(prompt.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200 flex-shrink-0"
                          title="Delete search"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No searches yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Start exploring styles!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Regular Navigation Items */}
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 group text-sm font-medium cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
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
                      {user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="px-3">
                  <UserProfile />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => handleNavigation("/sign-in")}
                  className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 w-full text-sm font-medium cursor-pointer"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Sign In</span>
                </div>
                <div
                  onClick={() => handleNavigation("/sign-up")}
                  className="flex items-center gap-3 px-3 py-2.5 text-white bg-black hover:bg-gray-800 rounded-lg transition-all duration-200 w-full text-sm font-medium shadow-lg cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Sign Up</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Menu Toggle Button - Fixed position */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-md border border-gray-200"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </>
  );
}
