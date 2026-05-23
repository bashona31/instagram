"use client";

// ============================================================
// useTheme Hook - Dark/Light mode toggle
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { ThemeMode } from "@/types";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      // Default to dark mode
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
