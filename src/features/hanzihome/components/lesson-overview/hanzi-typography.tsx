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
type HanziAwareTextProps = Omit<StudyInstructionTextProps, "children"> & {
 text: string;
};
type HanziInlineTextProps = {
 text: string;
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

const hanziFontFamilies: Record<HanziReaderFont, string> = {
 system:
  'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", var(--font-reading-noto-sans), sans-serif',
 songti: 'var(--font-reading-noto-serif), "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif',
 "noto-sans":
  'var(--font-reading-noto-sans), "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
 pinyin: '"FZKTPY01", "Kaiti SC", "KaiTi", var(--font-reading-noto-serif), "Noto Serif SC", serif',
 kaiti:
  '"Kaiti SC", "KaiTi", "STKaiti", "DFKai-SB", var(--font-reading-noto-serif), "Noto Serif SC", serif',
 fangsong:
  '"FangSong", "STFangsong", "FangSong_GB2312", var(--font-reading-noto-serif), "Noto Serif SC", serif',
 "ma-shan": 'var(--font-reading-ma-shan), "Ma Shan Zheng", "Kaiti SC", "KaiTi", serif',
 xiaowei: 'var(--font-reading-xiaowei), "ZCOOL XiaoWei", "Kaiti SC", "KaiTi", serif',
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
 songti: 400,
 "noto-sans": 400,
 pinyin: 500,
 kaiti: 400,
 fangsong: 400,
 "ma-shan": 400,
 xiaowei: 400,
};

const HAN_SCRIPT_PATTERN = /\p{Script=Han}/u;
const HANZI_SEGMENT_PATTERN = /(\p{Script=Han}+)/gu;

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
 className,
 ...props
}: HanziTextProps) {
 return (
  <Typography
   as={as}
   lang="zh-CN"
   className={cn("font-hanzi", staticHanziTextSizes[size], className)}
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

export function HanziInlineText({ text }: HanziInlineTextProps) {
 return (
  <>
   {text.split(HANZI_SEGMENT_PATTERN).map((segment, index) =>
    containsHanziText(segment) ? (
     <span key={index} lang="zh-CN" className="font-hanzi">
      {segment}
     </span>
    ) : (
     segment
    ),
   )}
  </>
 );
}

export function HanziAwareText({
 text,
 as = StudyTextElementSchema.enum.p,
 ...props
}: HanziAwareTextProps) {
 return (
  <StudyInstructionText as={as} {...props}>
   <HanziInlineText text={text} />
  </StudyInstructionText>
 );
}

export function AdaptiveStudyText({
 text,
 displayMode,
 hanziSize,
 ...props
}: AdaptiveStudyTextProps) {
 const { as, className, ...typographyProps } = props;

 return (
  <StudyInstructionText as={as} className={className} {...typographyProps}>
   {text.split(HANZI_SEGMENT_PATTERN).map((segment, index) =>
    containsHanziText(segment) ? (
     <ReaderHanziText
      key={index}
      as="span"
      displayMode={displayMode}
      size={hanziSize}
      {...typographyProps}
     >
      {segment}
     </ReaderHanziText>
    ) : (
     segment
    ),
   )}
  </StudyInstructionText>
 );
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
 lang,
 className,
 ...props
}: StudyInstructionTextProps) {
 return (
  <Typography
   as={as}
   lang={lang}
   variant={variant}
   tone={tone}
   className={cn(lang === "zh-CN" && "font-hanzi", className)}
   {...props}
  />
 );
}

export type {
 HanziTextProps,
 AdaptiveStudyTextProps,
 HanziAwareTextProps,
 HanziFontPreviewProps,
 HanziInlineTextProps,
 ReaderHanziTextProps,
 StudyInstructionTextProps,
 StudyTypographyProps,
};
