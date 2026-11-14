import { z } from "zod";

export const ThemeSchema = z.enum(["light", "dark"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const ThemeModeSchema = z.enum(["system", "light", "dark"]);
export type ThemeMode = z.infer<typeof ThemeModeSchema>;
export const THEME_MODE_STORAGE_KEY = "chines-app-theme";
export const DEFAULT_THEME_MODE: ThemeMode = ThemeModeSchema.enum.system;

export const ThemePaletteSchema = z.enum(["editorial", "jade", "warm", "plum", "mono", "tea"]);
export type ThemePalette = z.infer<typeof ThemePaletteSchema>;
export const THEME_PALETTE_STORAGE_KEY = "chines-app-theme-palette";
export const DEFAULT_THEME_PALETTE: ThemePalette = ThemePaletteSchema.enum.editorial;
