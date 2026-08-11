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
  description: "Chàm rõ, nghiêm túc, với nền trang phớt lạnh cho nội dung dài.",
 },
 jade: {
  label: "Ngọc bích",
  description: "Xanh cân bằng, nền dịu và trạng thái active dễ nhận biết.",
 },
 warm: {
  label: "Trung tính ấm",
  description: "Cam nâu tiết chế, nền ấm nhẹ và thân thiện với phiên đọc lâu.",
 },
 plum: {
  label: "Mận tím",
  description: "Tím mận có nền phớt nhẹ, active rõ nhưng không nhuộm các surface nội dung.",
 },
 mono: {
  label: "Trắng và đen",
  description: "Tương phản trung tính, gần như loại bỏ màu trang trí.",
 },
 tea: {
  label: "Trà xanh",
  description: "Xanh trà ít bão hòa, nền nhẹ và phù hợp học tập kéo dài.",
 },
};
