"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import type { TypographyProps } from "@/components/ui/display/typography";
import {
 containsHanziText,
 HanziAwareText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import {
 getChineseSpeechSegments,
 splitDialogueTurn,
 splitTrailingTranslation,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { defaultTextbookDisplaySettings } from "@/features/hanzihome/utils/learning-state";
import {
 nextAvailableRevealStage,
 type RevealStage,
} from "@/features/reader/model/progressive-reveal";
import { cn } from "@/lib/utils";
import { BusinessChineseText, SpeakableBusinessChineseText } from "./BusinessChineseText";
import {
 isChineseOnlyText,
 splitBusinessChineseGrammarExample,
} from "./business-chinese-study-utils";

export function BusinessChineseTextBlock({
 pronunciationId,
 text,
 translation,
 displayMode: propDisplayMode,
 compactHanzi = false,
 variant,
 weight,
 grammar = false,
 practice = false,
 speakable = true,
}: {
 pronunciationId: string;
 text: string;
 translation?: string;
 displayMode?: LessonDisplayMode;
 compactHanzi?: boolean;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 grammar?: boolean;
 practice?: boolean;
 speakable?: boolean;
}) {
 const displayMode = useMemo(
  () => ({
   ...defaultTextbookDisplaySettings,
   ...propDisplayMode,
  }),
  [propDisplayMode],
 );
 const t = useTranslations("BusinessChinese");
 const [revealStage, setRevealStage] = useState<RevealStage>(0);
 const grammarFormula = grammar && /^(?:\d+[.．]\s*)?(?:Cấu trúc|Công thức):/u.test(text.trim());
 // Optional formula operands are source text, not parenthesized translations.
 const inlineText = grammarFormula
  ? { source: text.trim(), translation: "" }
  : splitTrailingTranslation(text);
 const grammarExample =
  grammar || !practice ? splitBusinessChineseGrammarExample(inlineText.source) : inlineText;
 const sourceTurn =
  (grammar || !practice) && grammarExample.translation
   ? { speaker: "", content: grammarExample.source }
   : splitDialogueTurn(grammarExample.source);
 const resolvedTranslation =
  translation?.trim() || grammarExample.translation || inlineText.translation;
 const grammarNote =
  (grammar || !practice) && grammarExample.translation ? inlineText.translation : "";
 const translationTurn =
  grammar || Boolean(grammarExample.translation)
   ? { speaker: "", content: resolvedTranslation }
   : splitDialogueTurn(resolvedTranslation);
 const progressiveReveal =
  displayMode.revealMode === "tap" &&
  containsHanziText(sourceTurn.content) &&
  (!compactHanzi ||
   ((grammar || practice) && variant === "body" && isChineseOnlyText(sourceTurn.content)));
 const speechSegments = speakable ? getChineseSpeechSegments(sourceTurn.content) : [];
 const hasRevealPinyin = displayMode.autoDetectPinyin;
 const hasRevealMeaning = Boolean(translationTurn.content);
 const visibleRevealStage =
  (revealStage === 1 && !hasRevealPinyin) || (revealStage === 2 && !hasRevealMeaning)
   ? 0
   : revealStage;
 const revealDisplayMode: LessonDisplayMode = useMemo(
  () => ({ ...displayMode, showPinyin: hasRevealPinyin && visibleRevealStage === 1 }),
  [displayMode, hasRevealPinyin, visibleRevealStage],
 );
 const nextRevealStage = nextAvailableRevealStage(visibleRevealStage, {
  hasPinyin: hasRevealPinyin,
  hasMeaning: hasRevealMeaning,
 });
 const revealLabel =
  nextRevealStage === 0
   ? t("actions.revealHanzi")
   : nextRevealStage === 1
     ? t("actions.revealPinyin")
     : t("actions.revealMeaning");
 const inlineGrammarLabel =
  grammar &&
  !grammarFormula &&
  /^(?:Cách dùng|Ý nghĩa(?: \d+)?|Lưu ý(?: khác| về vị trí)?|Các cụm(?: từ)? thường gặp)$/u.test(
   sourceTurn.speaker,
  );

 return (
  <div
   id={progressiveReveal ? pronunciationId : undefined}
   data-textbook-block={pronunciationId}
   className={cn(
    "grid min-w-0 scroll-mt-24 gap-1.5",
    inlineGrammarLabel && "sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline sm:gap-x-3",
   )}
  >
   {sourceTurn.speaker ? (
    <HanziAwareText
     as="span"
     text={grammar ? `${sourceTurn.speaker}:` : sourceTurn.speaker}
     variant={grammar ? "body" : "overline"}
     tone={grammar ? "default" : "muted"}
     weight={grammar ? "semibold" : "black"}
     tracking={grammar ? "normal" : "wide"}
     transform={grammar ? "none" : "uppercase"}
    />
   ) : null}
   <div
    data-textbook-formula={grammarFormula && variant === "body" ? "true" : undefined}
    className={cn(
     "min-w-0",
     grammarFormula && variant === "body" && "rounded-lg bg-surface-muted/50 px-3 py-2",
    )}
   >
    {progressiveReveal ? (
     <div className="grid min-w-0 gap-1.5">
      <div className="flex min-w-0 items-start gap-2">
       <div className="min-w-0 flex-1">
        {visibleRevealStage === 2 && hasRevealMeaning ? (
         <TranslationText
          weight={grammar ? "normal" : "medium"}
          leading="relaxed"
          wrapping="preWrap"
         >
          {translationTurn.content}
         </TranslationText>
        ) : (
         <BusinessChineseText
          pronunciationId={pronunciationId}
          text={sourceTurn.content}
          displayMode={revealDisplayMode}
          compactHanzi={compactHanzi}
          learnerContent={grammar || practice}
          variant={variant}
          weight={weight}
         />
        )}
       </div>
       {speechSegments.length > 0 ? (
        <MandarinSpeakButton
         text={speechSegments.join(" ")}
         segments={speechSegments}
         touchTarget
        />
       ) : null}
      </div>
      {nextRevealStage !== visibleRevealStage ? (
       <Button
        type="button"
        variant="ghost"
        size="compact"
        align="start"
        className="justify-self-start"
        onClick={() => setRevealStage(nextRevealStage)}
       >
        {revealLabel}
       </Button>
      ) : null}
     </div>
    ) : (
     <SpeakableBusinessChineseText
      pronunciationId={pronunciationId}
      text={sourceTurn.content}
      displayMode={displayMode}
      compactHanzi={compactHanzi}
      variant={variant}
      weight={weight}
      learnerContent={grammar || practice}
      speakable={speakable}
     />
    )}
   </div>
   {!progressiveReveal && translationTurn.content && displayMode.showMeaning ? (
    <TranslationText
     variant={variant === "body" ? "body" : "bodySmall"}
     tone={grammar ? "secondary" : "muted"}
     weight={grammar ? "normal" : "medium"}
     leading="relaxed"
     wrapping="preWrap"
     className={inlineGrammarLabel ? "sm:col-span-2" : undefined}
    >
     {translationTurn.content}
    </TranslationText>
   ) : null}
   {grammarNote && (progressiveReveal ? visibleRevealStage === 2 : displayMode.showMeaning) ? (
    <TranslationText
     tone="muted"
     weight="normal"
     leading="relaxed"
     wrapping="preWrap"
     className={inlineGrammarLabel ? "sm:col-span-2" : undefined}
    >
     {grammarNote}
    </TranslationText>
   ) : null}
  </div>
 );
}
