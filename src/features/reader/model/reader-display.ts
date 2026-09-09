import { z } from "zod";

export const readerFontSchema = z.enum([
 "system",
 "songti",
 "noto-sans",
 "pinyin",
 "kaiti",
 "fangsong",
 "ma-shan",
 "xiaowei",
]);
export const readerSizeSchema = z.enum(["md", "lg", "xl", "2xl", "3xl"]);
export const readerRevealModeSchema = z.enum(["always", "tap"]);
export const readerDisplaySchema = z.strictObject({
 showPinyin: z.boolean(),
 showMeaning: z.boolean(),
 hanziFont: readerFontSchema,
 hanziSize: readerSizeSchema,
 revealMode: readerRevealModeSchema,
});
export type ReaderDisplay = z.output<typeof readerDisplaySchema>;
export type ReaderDisplayAdapter = {
 value: ReaderDisplay;
 onChange: (value: ReaderDisplay) => void;
};
export const defaultReaderDisplay: ReaderDisplay = {
 showPinyin: true,
 showMeaning: true,
 hanziFont: "kaiti",
 hanziSize: "lg",
 revealMode: "always",
};
