import { z } from "zod";

const TOKEN_SPLIT_PATTERN = /[\s,.;:!?()[\]{}"'“”‘’/\\|+\-_=<>，。；：！？、]+/u;
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

export function tokenizeSearchText(...values: Array<z.input<typeof SearchTextInputSchema>>) {
 const tokens = new Set<string>();

 values.forEach((value) => {
  if (!value) return;

  const normalized = normalizeSearchText(value);
  if (!normalized) return;

  tokens.add(normalized);
  normalized
   .split(TOKEN_SPLIT_PATTERN)
   .filter(Boolean)
   .forEach((token) => tokens.add(token));
 });

 return [...tokens];
}
