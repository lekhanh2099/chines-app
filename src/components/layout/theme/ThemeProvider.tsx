"use client";

import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore } from "react";

import {
 DEFAULT_THEME_MODE,
 DEFAULT_THEME_PALETTE,
 THEME_MODE_STORAGE_KEY,
 THEME_PALETTE_STORAGE_KEY,
 ThemeModeSchema,
 ThemePaletteSchema,
 type Theme,
 type ThemeMode,
 type ThemePalette,
} from "./theme-contract";

export { ThemeSchema, ThemeModeSchema, ThemePaletteSchema } from "./theme-contract";
export type { Theme, ThemeMode, ThemePalette } from "./theme-contract";

type ThemeContextValue = {
 theme: Theme;
 mode: ThemeMode;
 palette: ThemePalette;
 setMode: (mode: ThemeMode) => void;
 setPalette: (palette: ThemePalette) => void;
 toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialMode(): ThemeMode {
 if (typeof window === "undefined") return DEFAULT_THEME_MODE;

 const stored = ThemeModeSchema.safeParse(localStorage.getItem(THEME_MODE_STORAGE_KEY));
 return stored.success ? stored.data : DEFAULT_THEME_MODE;
}

function getInitialPalette(): ThemePalette {
 if (typeof window === "undefined") return DEFAULT_THEME_PALETTE;

 const stored = ThemePaletteSchema.safeParse(localStorage.getItem(THEME_PALETTE_STORAGE_KEY));
 return stored.success ? stored.data : DEFAULT_THEME_PALETTE;
}

function subscribeSystemTheme(onStoreChange: () => void) {
 if (typeof window === "undefined") return () => undefined;

 const media = window.matchMedia("(prefers-color-scheme: dark)");
 media.addEventListener("change", onStoreChange);
 return () => media.removeEventListener("change", onStoreChange);
}

function getSystemThemeSnapshot(): Theme {
 if (typeof window === "undefined") return "light";
 return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
 return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
 const [mode, setMode] = useState<ThemeMode>(getInitialMode);
 const [palette, setPalette] = useState<ThemePalette>(getInitialPalette);
 const systemTheme = useSyncExternalStore(
  subscribeSystemTheme,
  getSystemThemeSnapshot,
  getServerThemeSnapshot,
 );
 const theme: Theme = mode === ThemeModeSchema.enum.system ? systemTheme : mode;

 useLayoutEffect(() => {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-theme-mode", mode);
  root.setAttribute("data-palette", palette);
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme-transitioning", "");
  localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  localStorage.setItem(THEME_PALETTE_STORAGE_KEY, palette);

  const timer = window.setTimeout(() => {
   root.removeAttribute("data-theme-transitioning");
  }, 180);

  return () => window.clearTimeout(timer);
 }, [mode, palette, theme]);

 const toggleTheme = () => {
  setMode(theme === "light" ? ThemeModeSchema.enum.dark : ThemeModeSchema.enum.light);
 };

 return (
  <ThemeContext value={{ theme, mode, palette, setMode, setPalette, toggleTheme }}>
   {children}
  </ThemeContext>
 );
}

export function useTheme() {
 const context = useContext(ThemeContext);
 if (!context) throw new Error("useTheme must be used within ThemeProvider");
 return context;
}
