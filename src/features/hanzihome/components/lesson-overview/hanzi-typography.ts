import type { CSSProperties } from "react";

import type { HanziReaderFont, HanziReaderSize, LessonDisplayMode } from "./types";

const hanziFontFamilies: Record<HanziReaderFont, string> = {
 system: "var(--font-hanzi)",
 songti: '"Hanzi Songti", "Songti SC", "STSong", "Noto Serif CJK SC", "SimSun", serif',
 pinyin: '"FZKTPY01", "Kaiti SC", "KaiTi", serif',
};

const hanziFontSizes: Record<HanziReaderSize, string> = {
 md: "1.125rem",
 lg: "1.375rem",
 xl: "1.75rem",
 "2xl": "2.125rem",
 "3xl": "2.625rem",
};

const hanziFontWeights: Record<HanziReaderFont, CSSProperties["fontWeight"]> = {
 system: 400,
 songti: 500,
 pinyin: 500,
};

export function getHanziFontFamily(font: HanziReaderFont): string {
 return hanziFontFamilies[font];
}

export function getHanziTypographyStyle(
 displayMode: LessonDisplayMode,
 options: { size?: HanziReaderSize | "inherit" } = {},
): CSSProperties {
 return {
  fontFamily: getHanziFontFamily(displayMode.hanziFont),
  fontSize:
   options.size === "inherit" ? undefined : hanziFontSizes[options.size ?? displayMode.hanziSize],
  fontWeight: hanziFontWeights[displayMode.hanziFont],
 };
}
