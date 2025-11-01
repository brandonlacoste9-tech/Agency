export type Theme = "light" | "dark";

const THEME_KEY = "adgenxai-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    
    // Fall back to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches 
      ? "dark" 
      : "light";
  } catch {
    return "light";
  }
}

export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  } catch {
    // localStorage might not be available
    applyTheme(theme);
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  
  if (theme === "dark") {
    root.style.setProperty("--bg", "#0a0a0a");
    root.style.setProperty("--card", "#1a1a1a");
    root.style.setProperty("--border", "#2a2a2a");
    root.style.setProperty("--text", "#ffffff");
  } else {
    root.style.setProperty("--bg", "#ffffff");
    root.style.setProperty("--card", "#f8f9fa");
    root.style.setProperty("--border", "#e9ecef");
    root.style.setProperty("--text", "#212529");
  }
}