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
  label: "Chàm biên tập",
  description: "Chàm rõ, nghiêm túc; canvas và Card phớt lạnh nhẹ cho nội dung dài.",
 },
 jade: {
  label: "Ngọc bích",
  description: "Xanh cân bằng; canvas, Card dịu và trạng thái active dễ nhận biết.",
 },
 warm: {
  label: "Trung tính ấm",
  description: "Cam nâu tiết chế; canvas và Card ấm nhẹ, hợp với phiên đọc lâu.",
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
