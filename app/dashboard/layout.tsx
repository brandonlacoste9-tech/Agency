"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/dashboard/projects", label: "Projects", icon: "🎬" },
    { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
    { href: "/dashboard/templates", label: "Templates", icon: "📝" },
    { href: "/dashboard/generations", label: "Generations", icon: "✨" },
    { href: "/dashboard/agent-performance", label: "Agent Performance", icon: "🤖" },
    { href: "/dashboard/rituals", label: "BeeHive Rituals", icon: "🐝" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className="w-64 border-r"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>
            Creator Studio
          </h1>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.href)
                    ? "font-semibold"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  color: "var(--text)",
                  background: isActive(item.href) ? "var(--accent)" : "transparent",
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* User info section at bottom */}
        <div
          className="absolute bottom-0 w-64 p-6 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="p-4 rounded-lg text-sm"
            style={{ background: "var(--bg)", color: "var(--text)" }}
          >
            <div className="font-semibold mb-2">Usage Today</div>
            <div className="opacity-70 text-xs">250K / 1M tokens</div>
            <div className="mt-2 w-full bg-black/20 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: "25%",
                  background: "linear-gradient(90deg, #10b981, #3b82f6)",
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <div
          className="border-b px-8 py-4 flex items-center justify-between"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
              Creator Dashboard
            </h2>
            <p className="text-sm opacity-50 mt-1" style={{ color: "var(--text)" }}>
              Manage your AI-generated content, track metrics, and optimize your creative workflow
            </p>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
