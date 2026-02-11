"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { setTheme, initTheme, type Theme } from "@/lib/theme";

// ── Tiny external store for theme state ────────────────────────
// Avoids calling setState inside an effect (react-hooks/set-state-in-effect).
let listeners: Array<() => void> = [];
let currentTheme: Theme = "light";

function subscribe(cb: () => void) {
  listeners = [...listeners, cb];
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function getSnapshot(): Theme {
  return currentTheme;
}
function getServerSnapshot(): Theme {
  return "light";
}
function updateTheme(t: Theme) {
  currentTheme = t;
  for (const l of listeners) l();
}

// ── Component ──────────────────────────────────────────────────
interface ThemeToggleProps {
  variant?: "icon" | "full";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Sync persisted preference into the store & listen for system changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = (localStorage.getItem("theme") as Theme) || "system";
      updateTheme(stored);
    }
    const cleanup = initTheme();
    return cleanup;
  }, []);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggle = () => {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    updateTheme(next);
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
