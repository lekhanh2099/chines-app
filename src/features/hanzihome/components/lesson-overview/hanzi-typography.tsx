import type { CSSProperties } from "react";
import { z } from "zod";

import { Typography, type TypographyProps } from "@/components/ui/typography";
import type { HanziReaderFont, HanziReaderSize, LessonDisplayMode } from "./types";
import { hanziReaderSizeSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import { cn } from "@/lib/utils";

const HanziTypographySizeSchema = z.union([hanziReaderSizeSchema, z.literal("inherit")]);
const StaticHanziTextSizeSchema = z.enum([
 "inherit",
 "small",
 "medium",
 "large",
 "card",
 "review",
 "detail",
 "hero",
 "radicalHero",
]);
const StaticHanziTextFontSchema = z.enum(["standard", "popular"]);
const StudyTextElementSchema = z.enum([
 "span",
 "p",
 "h2",
 "h3",
 "h4",
 "h5",
 "strong",
 "em",
 "code",
 "div",
 "th",
 "td",
]);

type StudyTextElement = z.infer<typeof StudyTextElementSchema>;
type StudyTypographyProps = Omit<
 Omit<Omit<TypographyProps<StudyTextElement>, "as">, "lang">,
 "style"
> & { as?: StudyTextElement };
type StudyInstructionTextProps = Omit<TypographyProps<StudyTextElement>, "as"> & {
 as?: StudyTextElement;
};
type HanziTextProps = StudyTypographyProps & {
 size?: z.infer<typeof StaticHanziTextSizeSchema>;
 font?: z.infer<typeof StaticHanziTextFontSchema>;
};
type ReaderHanziTextProps = StudyTypographyProps & {
 displayMode: LessonDisplayMode;
 size?: z.infer<typeof HanziTypographySizeSchema>;
};
type AdaptiveStudyTextProps = StudyTypographyProps & {
 text: string;
 displayMode: LessonDisplayMode;
 hanziSize?: z.infer<typeof HanziTypographySizeSchema>;
};
type HanziFontPreviewProps = StudyTypographyProps & {
 font: HanziReaderFont;
 size?: z.infer<typeof StaticHanziTextSizeSchema>;
};

const staticHanziTextSizes: Record<z.infer<typeof StaticHanziTextSizeSchema>, string> = {
 inherit: "",
 small: "text-sm",
 medium: "text-base",
 large: "text-lg",
 card: "text-2xl",
 review: "text-5xl",
 detail: "text-6xl sm:text-7xl",
 hero: "text-6xl",
 radicalHero: "text-5xl sm:text-6xl",
};
const staticHanziTextFonts: Record<z.infer<typeof StaticHanziTextFontSchema>, string> = {
 standard: "font-hanzi",
 popular: "font-popular-xingkai",
};

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
   options.size === HanziTypographySizeSchema.options[1].value
    ? undefined
    : hanziFontSizes[options.size ?? displayMode.hanziSize],
  fontWeight: hanziFontWeights[displayMode.hanziFont],
 };
}

export function HanziText({
 as = StudyTextElementSchema.enum.span,
 size = StaticHanziTextSizeSchema.enum.card,
 font = StaticHanziTextFontSchema.enum.standard,
 className,
 ...props
}: HanziTextProps) {
 return (
  <Typography
   as={as}
   lang="zh-CN"
   className={cn(staticHanziTextFonts[font], staticHanziTextSizes[size], className)}
   {...props}
  />
 );
}

export function ReaderHanziText({
 as = StudyTextElementSchema.enum.span,
 displayMode,
 size,
 ...props
}: ReaderHanziTextProps) {
 return (
  <Typography
   as={as}
   lang="zh-CN"
   style={getHanziTypographyStyle(displayMode, { size })}
   {...props}
  />
 );
}

export function AdaptiveStudyText({
 text,
 displayMode,
 hanziSize,
 ...props
}: AdaptiveStudyTextProps) {
 if (containsHanziText(text)) {
  return (
   <ReaderHanziText displayMode={displayMode} size={hanziSize} {...props}>
    {text}
   </ReaderHanziText>
  );
 }

 return <StudyInstructionText {...props}>{text}</StudyInstructionText>;
}

export function HanziFontPreview({
 as = StudyTextElementSchema.enum.span,
 font,
 size = StaticHanziTextSizeSchema.enum.inherit,
 className,
 ...props
}: HanziFontPreviewProps) {
 return (
  <Typography
   as={as}
   lang="zh-CN"
   style={{ fontFamily: getHanziFontFamily(font) }}
   className={cn(staticHanziTextSizes[size], className)}
   {...props}
  />
 );
}

export function PinyinText({
 as = StudyTextElementSchema.enum.span,
 variant = "bodySmall",
 tone = "secondary",
 className,
 ...props
}: StudyTypographyProps) {
 return (
  <Typography
   as={as}
   lang="zh-Latn-pinyin"
   variant={variant}
   tone={tone}
   className={cn("font-pinyin", className)}
   {...props}
  />
 );
}

export function TranslationText({
 as = StudyTextElementSchema.enum.p,
 variant = "bodySmall",
 tone = "secondary",
 ...props
}: StudyTypographyProps) {
 return <Typography as={as} lang="vi" variant={variant} tone={tone} {...props} />;
}

export function StudyInstructionText({
 as = StudyTextElementSchema.enum.p,
 variant = "bodySmall",
 tone = "muted",
 ...props
}: StudyInstructionTextProps) {
 return <Typography as={as} variant={variant} tone={tone} {...props} />;
}

export type {
 HanziTextProps,
 AdaptiveStudyTextProps,
 HanziFontPreviewProps,
 ReaderHanziTextProps,
 StudyInstructionTextProps,
 StudyTypographyProps,
};
