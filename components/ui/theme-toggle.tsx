"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTheme, setTheme, initTheme, type Theme } from "@/lib/theme";

interface ThemeToggleProps {
  variant?: "icon" | "full";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const [theme, setLocalTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocalTheme(getTheme());
    setMounted(true);
    const cleanup = initTheme();
    return cleanup;
  }, []);

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) {
    if (variant === "icon") {
      return <div className={cn("p-2 w-9 h-9", className)} />;
    }
    return <div className={cn("flex items-center gap-2 px-3 py-2 w-24 h-9", className)} />;
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggle = () => {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    setLocalTheme(next);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        className={cn(
          "p-2 rounded-full hover:bg-secondary transition-colors",
          className
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Sun size={20} className="text-muted-foreground" />
        ) : (
          <Moon size={20} className="text-muted-foreground" />
        )}
      </button>
    );
  }

  // Full variant with icon and label
  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary transition-colors",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <Sun size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Light</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Dark</span>
        </>
      )}
    </button>
  );
}
