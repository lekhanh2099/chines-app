import type { CSSProperties } from "react";
import { z } from "zod";

import type { HanziReaderFont, HanziReaderSize, LessonDisplayMode } from "./types";
import { hanziReaderSizeSchema } from "@/features/hanzihome/schemas/learning-state.schema";

const HanziTypographySizeSchema = z.union([hanziReaderSizeSchema, z.literal("inherit")]);

const hanziFontFamilies: Record<HanziReaderFont, string> = {
 system: "var(--font-hanzi)",
 songti: '"Hanzi Songti", "Songti SC", "STSong", "Noto Serif CJK SC", "SimSun", serif',
 pinyin: '"FZKTPY01", "Kaiti SC", "KaiTi", serif',
};

const hanziFontSizes: Record<HanziReaderSize, string> = {
 md: "1.125rem",
 lg: "clamp(1.25rem, 3.5vw, 1.375rem)",
 xl: "clamp(1.375rem, 4vw, 1.75rem)",
 "2xl": "clamp(1.5rem, 4.5vw, 2.125rem)",
 "3xl": "clamp(1.75rem, 5vw, 2.625rem)",
};

const hanziFontWeights: Record<HanziReaderFont, CSSProperties["fontWeight"]> = {
 system: 400,
 songti: 500,
 pinyin: 500,
};

const HAN_SCRIPT_PATTERN = /\p{Script=Han}/u;

export function containsHanziText(value: string): boolean {
 return HAN_SCRIPT_PATTERN.test(value);
}

export function getHanziFontFamily(font: HanziReaderFont): string {
 return hanziFontFamilies[font];
}

export function getHanziTypographyStyle(
 displayMode: LessonDisplayMode,
 options: { size?: z.infer<typeof HanziTypographySizeSchema> } = {},
): CSSProperties {
 return {
  fontFamily: getHanziFontFamily(displayMode.hanziFont),
  fontSize:
   options.size === "inherit" ? undefined : hanziFontSizes[options.size ?? displayMode.hanziSize],
  fontWeight: hanziFontWeights[displayMode.hanziFont],
 };
}
