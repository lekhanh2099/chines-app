import { z } from "zod";

export const ThemeSchema = z.enum(["light", "dark"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const ThemeModeSchema = z.enum(["system", "light", "dark"]);
export type ThemeMode = z.infer<typeof ThemeModeSchema>;

export const ThemePaletteSchema = z.enum(["editorial", "jade", "warm", "plum", "mono", "tea"]);
export type ThemePalette = z.infer<typeof ThemePaletteSchema>;

type ThemePaletteMeta = {
 label: string;
 description: string;
};

export const THEME_PALETTE_META: Record<ThemePalette, ThemePaletteMeta> = {
 editorial: {
  label: "Chàm Hanzi Studio",
  description: "Chàm lạnh, mặt giấy sáng và nhấn indigo theo Editorial Study Workspace.",
 },
 jade: {
  label: "Ngọc bích",
  description: "Xanh cân bằng; canvas, Card dịu và trạng thái active dễ nhận biết.",
 },
 warm: {
  label: "Sepia ấm",
  description: "Palette sepia của Hanzi Studio; ấm vừa đủ cho phiên đọc dài, vẫn giữ phân cấp rõ.",
 },
 plum: {
  label: "Mận tím",
  description: "Tím mận phớt nhẹ trên canvas và Card, active rõ mà không nhuộm popover/input.",
 },
 mono: {
  label: "Trắng và đen",
  description: "Tương phản trung tính, gần như loại bỏ màu trang trí.",
 },
 tea: {
  label: "Trà xanh",
  description: "Xanh trà ít bão hòa; canvas và Card dịu, phù hợp học tập kéo dài.",
 },
};
