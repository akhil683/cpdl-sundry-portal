"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "cpdl-theme";
const THEME_COLORS = { light: "#edf0ea", dark: "#0e1310" } as const;

type Theme = keyof typeof THEME_COLORS;

function applyTheme(theme: Theme, persist: boolean) {
  document.documentElement.dataset.theme = theme;

  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage can be unavailable; the theme still applies for this page.
    }
  }

  const metas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  metas.forEach((meta) => {
    meta.content = THEME_COLORS[theme];
  });
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "light");

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    function handleSystemChange(event: MediaQueryListEvent) {
      try {
        if (window.localStorage.getItem(THEME_KEY)) return;
      } catch {
        return;
      }
      const next: Theme = event.matches ? "dark" : "light";
      applyTheme(next, false);
      setTheme(next);
    }

    query.addEventListener("change", handleSystemChange);
    return () => query.removeEventListener("change", handleSystemChange);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next, true);
    setTheme(next);
  }

  const action =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Dark theme"
      title={action}
    >
      <span className="theme-toggle-thumb" aria-hidden="true" />
      <Sun className="icon-sun" size={15} strokeWidth={1.9} aria-hidden="true" />
      <Moon
        className="icon-moon"
        size={15}
        strokeWidth={1.9}
        aria-hidden="true"
      />
    </button>
  );
}
