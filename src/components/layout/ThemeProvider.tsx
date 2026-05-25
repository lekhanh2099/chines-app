"use client";

import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
 theme: Theme;
 toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "chines-app-theme";

function getInitialTheme(): Theme {
 if (typeof window === "undefined") return "light";

 const stored = localStorage.getItem(STORAGE_KEY);
 if (stored === "dark" || stored === "light") return stored;

 return window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
 const [theme, setTheme] = useState<Theme>(getInitialTheme);

 // Sync attribute to <html>
 useEffect(() => {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme-transitioning", "");
  localStorage.setItem(STORAGE_KEY, theme);

  // Remove transition flag after animation completes
  const timer = setTimeout(() => {
   root.removeAttribute("data-theme-transitioning");
  }, 250);

  return () => clearTimeout(timer);
 }, [theme]);

 const toggleTheme = useCallback(() => {
  setTheme((prev) => (prev === "light" ? "dark" : "light"));
 }, []);

 return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
 const ctx = useContext(ThemeContext);
 if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
 return ctx;
}
