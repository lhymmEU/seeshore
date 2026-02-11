// ============================================
// DARK MODE THEME MANAGEMENT
// Persists preference in localStorage.
// Applies/removes the "dark" class on <html>.
// ============================================

const THEME_KEY = "theme";

export type Theme = "light" | "dark" | "system";

/** Read the stored preference (defaults to "system"). */
export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(THEME_KEY) as Theme) || "system";
}

/** Persist a theme preference and apply it immediately. */
export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

/** Resolve "system" to an actual light/dark value. */
function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/** Apply the resolved theme to the document. */
export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/**
 * Initialise theme on mount and listen for system preference changes.
 * Returns a cleanup function to remove the listener.
 */
export function initTheme(): () => void {
  const theme = getTheme();
  applyTheme(theme);

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (getTheme() === "system") applyTheme("system");
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
