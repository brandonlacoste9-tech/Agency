"use client";

import { useEffect, useState, useCallback } from "react";
import { getInitialTheme, setTheme, applyTheme, Theme } from "@/lib/theme";

export default function TopBar({
  onOpenPalette,
}: {
  onOpenPalette: () => void;
}) {
  const [theme, setLocalTheme] = useState<Theme>("light");

  useEffect(() => {
    // Only read from localStorage once on mount
    const t = getInitialTheme();
    setLocalTheme(t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setLocalTheme(next);
    setTheme(next);
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 border-b" style={{borderColor:"var(--border)", background:"color-mix(in oklab, var(--bg) 85%, transparent)"}}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-semibold" aria-label="AdGenXAI home">
          <span className="inline-block h-6 w-6 rounded-full shadow-[0_0_24px_rgba(124,77,255,.4)]" style={{background:"radial-gradient(60% 60% at 50% 50%, #35E3FF 0%, #7C4DFF 50%, #FFD76A 100%)"}}/>
          <span>AdGenXAI</span>
        </a>

        <div className="flex items-center gap-2">
          <input
            type="search"
            role="searchbox"
            placeholder="Search…  (⌘K)"
            className="hidden md:block w-64 rounded-lg border px-3 py-1.5 text-sm"
            style={{background:"var(--card)", borderColor:"var(--border)", color:"var(--text)"}}
            onFocus={(e)=>e.currentTarget.select()}
            onKeyDown={(e)=>{ if(e.key==="Enter") onOpenPalette(); }}
          />
          <a
            href="/dashboard"
            className="rounded-lg border px-3 py-1.5 text-sm hover:opacity-70 transition"
            style={{background:"var(--card)", borderColor:"var(--border)", color:"var(--text)"}}
            title="Creator Dashboard"
          >📊 Dashboard</a>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm"
            style={{background:"var(--card)", borderColor:"var(--border)", color:"var(--text)"}}
            onClick={onOpenPalette}
            aria-label="Open command palette"
            title="Open palette (⌘K)"
          >⌘K</button>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm"
            style={{background:"var(--card)", borderColor:"var(--border)", color:"var(--text)"}}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >{theme === "light" ? "☀️" : "🌙"}</button>
        </div>
      </div>
    </header>
  );
}
