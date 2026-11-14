import type { CSSProperties } from "react";
import { z } from "zod";
import { readerSizeSchema, type ReaderDisplay } from "../model/reader-display";

const readerTypographySizeSchema = z.union([readerSizeSchema, z.literal("inherit")]);
const fontFamilies: Record<ReaderDisplay["hanziFont"], string> = {
 system:
  'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", var(--font-reading-noto-sans), sans-serif',
 songti: 'var(--font-reading-noto-serif), "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif',
 "noto-sans":
  'var(--font-reading-noto-sans), "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
 pinyin: '"FZKTPY01", "Kaiti SC", "KaiTi", var(--font-reading-noto-serif), "Noto Serif SC", serif',
 kaiti:
  '"HanziHome Kaiti", "Kaiti SC", "KaiTi", "STKaiti", "DFKai-SB", var(--font-reading-noto-serif), "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif',
 fangsong:
  '"FangSong", "STFangsong", "FangSong_GB2312", var(--font-reading-noto-serif), "Noto Serif SC", serif',
 "ma-shan": 'var(--font-reading-ma-shan), "Ma Shan Zheng", "Kaiti SC", "KaiTi", serif',
 xiaowei: 'var(--font-reading-xiaowei), "ZCOOL XiaoWei", "Kaiti SC", "KaiTi", serif',
};
const fontSizes: Record<ReaderDisplay["hanziSize"], string> = {
 md: "1.125rem",
 lg: "clamp(1.25rem, 3.5vw, 1.375rem)",
 xl: "clamp(1.375rem, 4vw, 1.75rem)",
 "2xl": "clamp(1.5rem, 4.5vw, 2.125rem)",
 "3xl": "clamp(1.75rem, 5vw, 2.625rem)",
};
export function getReaderFontFamily(font: ReaderDisplay["hanziFont"]) {
 return fontFamilies[font];
}
export function getReaderTypographyStyle(
 display: Pick<ReaderDisplay, "hanziFont" | "hanziSize">,
 options: { size?: z.output<typeof readerTypographySizeSchema> } = {},
): CSSProperties {
 return {
  fontFamily: getReaderFontFamily(display.hanziFont),
  fontSize: options.size === "inherit" ? undefined : fontSizes[options.size ?? display.hanziSize],
  fontWeight: display.hanziFont === "pinyin" ? 500 : 400,
 };
}
