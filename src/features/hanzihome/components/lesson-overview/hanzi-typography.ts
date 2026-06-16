import type { CSSProperties } from "react";

import type { HanziReaderFont, HanziReaderSize, LessonDisplayMode } from "./types";

const hanziFontFamilies: Record<HanziReaderFont, string> = {
 system: 'var(--font-hanzi), "PingFang SC", sans-serif',
 songti: '"Hanzi Songti", "Songti SC", "STSong", "Noto Serif CJK SC", "SimSun", serif',
 kai: '"FZKTPY01", "Kaiti SC", "KaiTi", "STKaiti", serif',
 pinyin: '"FZKTPY01", "Kaiti SC", "KaiTi", serif',
 mengshen: '"Mengshen Han Serif", "Hanzi Songti", "Songti SC", serif',
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
 kai: 500,
 pinyin: 500,
 mengshen: 500,
};

export function getHanziTypographyStyle(
 displayMode: LessonDisplayMode,
 options: { size?: HanziReaderSize | "inherit" } = {},
): CSSProperties {
 return {
  fontFamily: hanziFontFamilies[displayMode.hanziFont],
  fontSize:
   options.size === "inherit" ? undefined : hanziFontSizes[options.size ?? displayMode.hanziSize],
  fontWeight: hanziFontWeights[displayMode.hanziFont],
 };
}
