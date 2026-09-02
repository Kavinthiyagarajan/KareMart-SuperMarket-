// src/components/SmartCommandBar.tsx

"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { normalize, resolveCommand, suggestCommands } from "@/lib/commandMatcher";

/**
 * Smart navigation / command bar component.
 * - Allows users to type navigation commands or product queries.
 * - Supports keyboard shortcut Ctrl+K to focus.
 * - Shows suggestions for navigation commands and recent commands.
 * - Falls back to existing product search when no command matches.
 */
export default function SmartCommandBar() {
  const router = useRouter();
  const { token, role } = useAuthStore();
  const isAuthenticated = !!token;
  const isAdmin = role === "ADMIN";

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ label: string; route: string }>>([]);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("smartCommandRecent");
    if (stored) {
      try {
        setRecentCommands(JSON.parse(stored));
      } catch (_) {}
    }
  }, []);

  // Global shortcut Ctrl+K to focus the input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    // Need to add as a normal JS listener (not React synthetic)
    const fn = (e: KeyboardEvent) => handler(e);
    window.addEventListener("keydown", fn as any);
    return () => window.removeEventListener("keydown", fn as any);
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update suggestions whenever query changes or focus state changes
  useEffect(() => {
    if (!focused) {
      setSuggestions([]);
      return;
    }
    const norm = normalize(query);
    if (!norm) {
      // Show quick navigation suggestions (static list)
      const quick = [
        { label: "Go to Wishlist", route: "/profile/wishlist" },
        { label: "Go to My Orders", route: "/profile/orders" },
        { label: "Go to Cart", route: "/cart" },
        { label: "Go to Deals", route: "/deals" },
        { label: "Go to Addresses", route: "/profile/addresses" },
        { label: "Go to Notifications", route: "/profile/notifications" },
        { label: "Go to Support", route: "/support" },
        { label: "Go to Help", route: "/help" },
        { label: "Go to Profile", route: "/profile" },
        ...(isAdmin ? [{ label: "Go to Admin Dashboard", route: "/admin" }] : []),
      ];
      setSuggestions(quick);
    } else {
      // Combine navigation suggestions and recent commands that start with the query
      const commandSuggestions = suggestCommands(query, isAdmin, isAuthenticated);
      const recent = recentCommands
        .filter((c) => normalize(c).startsWith(norm))
        .map((c) => ({ label: `Recent: ${c}`, route: resolveCommand(c) ?? `/?q=${encodeURIComponent(c)}` }));
      setSuggestions([...recent, ...commandSuggestions]);
    }
  }, [query, focused, isAdmin, isAuthenticated, recentCommands]);

  const execute = (target: string) => {
    // Determine if target is a navigation route or product search
    const route = resolveCommand(target);
    if (route) {
      // Update recent commands list
      const updated = [target, ...recentCommands.filter((c) => c !== target)].slice(0, 5);
      setRecentCommands(updated);
      localStorage.setItem("smartCommandRecent", JSON.stringify(updated));
      router.push(route);
    } else {
      // Fallback to product search
      const trimmed = target.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentCommands.filter((c) => c !== trimmed)].slice(0, 5);
      setRecentCommands(updated);
      localStorage.setItem("smartCommandRecent", JSON.stringify(updated));
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    }
    setFocused(false);
    setQuery("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      execute(query);
    } else if (e.key === "Escape") {
      setFocused(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Move focus within suggestion list – simple implementation using index state
      // For brevity, we rely on native focus; users can also click.
    }
  };

  const handleSuggestionClick = (route: string, label: string) => {
    execute(label);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search products or type where you want to go..."
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        aria-label="Smart navigation / command bar"
        className="w-full bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
      />
      {focused && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2"
        >
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              role="option"
              className="px-4 py-2 hover:bg-surface/80 cursor-pointer flex items-center"
              onMouseDown={(e) => {
                // Prevent input blur before click
                e.preventDefault();
                handleSuggestionClick(s.route, s.label.replace(/^Go to /, ""));
              }}
            >
              {/* Icon distinguishes navigation vs product search */}
              <span className="mr-2 text-sm">{s.route.startsWith('/') ? "↗" : "🔎"}</span>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
