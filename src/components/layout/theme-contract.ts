import { z } from "zod";

export const ThemeSchema = z.enum(["light", "dark"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const ThemeModeSchema = z.enum(["system", "light", "dark"]);
export type ThemeMode = z.infer<typeof ThemeModeSchema>;

export const ThemePaletteSchema = z.enum([
 "editorial",
 "jade",
 "warm",
 "plum",
 "mono",
 "tea",
]);
export type ThemePalette = z.infer<typeof ThemePaletteSchema>;

type ThemePaletteMeta = {
 label: string;
 description: string;
};

export const THEME_PALETTE_META: Record<ThemePalette, ThemePaletteMeta> = {
 editorial: {
  label: "Chàm biên tập",
  description: "Chàm rõ, nghiêm túc, hợp học và biên tập nội dung dài.",
 },
 jade: {
  label: "Ngọc bích",
  description: "Xanh cân bằng, dễ nhận trạng thái mà không lấn nội dung.",
 },
 warm: {
  label: "Trung tính ấm",
  description: "Cam nâu tiết chế, thân thiện với phiên đọc lâu.",
 },
 plum: {
  label: "Mận tím",
  description: "Tím mận làm màu nhấn; canvas và surface vẫn trung tính.",
 },
 mono: {
  label: "Trắng và đen",
  description: "Tương phản trung tính, gần như loại bỏ màu trang trí.",
 },
 tea: {
  label: "Trà xanh",
  description: "Xanh trà ít bão hòa, dịu mắt và phù hợp học tập kéo dài.",
 },
};
