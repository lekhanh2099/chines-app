import { z } from "zod";
export const SearchTextInputSchema = z.string().nullable().optional();

export function normalizeSearchText(value: string) {
 return value
  .trim()
  .toLocaleLowerCase("vi-VN")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/đ/g, "d")
  .replace(/\s+/g, " ");
}
