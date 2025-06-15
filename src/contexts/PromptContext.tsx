"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PromptContextType {
  promptCount: number;
  incrementPrompt: () => void;
  resetPrompts: () => void;
  hasReachedLimit: boolean;
  userIP: string | null;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

const PROMPT_LIMIT = 7;
const STORAGE_KEY = "urban_stylist_prompts";
const IP_KEY = "urban_stylist_ip";

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [promptCount, setPromptCount] = useState(0);
  const [userIP, setUserIP] = useState<string | null>(null);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  // Get user's IP address
  useEffect(() => {
    const getIP = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        const ip = data.ip;
        setUserIP(ip);

        // Check if this IP has existing prompt data
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed.ip === ip) {
            setPromptCount(parsed.count || 0);
            setHasReachedLimit(parsed.count >= PROMPT_LIMIT);
          } else {
            // Different IP, reset counter
            localStorage.removeItem(STORAGE_KEY);
            setPromptCount(0);
            setHasReachedLimit(false);
          }
        }
      } catch (error) {
        console.error("Failed to get IP address:", error);
        // Fallback to localStorage without IP tracking
        const storedCount = localStorage.getItem("prompt_count");
        if (storedCount) {
          const count = parseInt(storedCount, 10);
          setPromptCount(count);
          setHasReachedLimit(count >= PROMPT_LIMIT);
        }
      }
    };

    getIP();
  }, []);

  const incrementPrompt = () => {
    const newCount = promptCount + 1;
    setPromptCount(newCount);

    const reachedLimit = newCount >= PROMPT_LIMIT;
    setHasReachedLimit(reachedLimit);

    // Store in localStorage with IP
    const dataToStore = {
      count: newCount,
      ip: userIP,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    localStorage.setItem("prompt_count", newCount.toString());
  };

  const resetPrompts = () => {
    setPromptCount(0);
    setHasReachedLimit(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("prompt_count");
  };

  // Development reset function - immediately reset for testing
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" ||
      window.location.hostname.includes("tempo-dev")
    ) {
      // Auto-reset if we've reached the limit for testing purposes
      if (hasReachedLimit) {
        console.log(
          "Development mode: Auto-resetting prompt count for testing",
        );
        resetPrompts();
      }
    }
  }, [hasReachedLimit]);

  return (
    <PromptContext.Provider
      value={{
        promptCount,
        incrementPrompt,
        resetPrompts,
        hasReachedLimit,
        userIP,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error("usePrompt must be used within a PromptProvider");
  }
  return context;
}
