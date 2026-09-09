"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { LearnerHanziText } from "@/components/patterns/learner-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils";
import { formatContextualSpokenPinyin } from "@/lib/pronunciation/contextual-pronunciation";
import { captureReaderSelection } from "../runtime/reader-selection";
import { getReaderTypographyStyle } from "./reader-typography";
import { nextAvailableRevealStage, type RevealStage } from "../model/progressive-reveal";
import {
 useReaderCommands,
 useReaderDisplay,
 useReaderPlaybackProgress,
 useReaderPlaybackStatus,
 useReaderPlaybackStartOffset,
 useReaderRegistry,
 useReaderSegment,
 useReaderSegmentIsActive,
 useReaderServices,
} from "../runtime/reader-context";

export const ReaderSegment = memo(function ReaderSegment({ segmentId }: { segmentId: string }) {
 const commands = useReaderCommands();
 const { value: display } = useReaderDisplay();
 const services = useReaderServices();
 const registry = useReaderRegistry();
 const segment = useReaderSegment(segmentId);
 const active = useReaderSegmentIsActive(segmentId);
 const progress = useReaderPlaybackProgress(segmentId);
 const status = useReaderPlaybackStatus(segmentId);
 const startOffset = useReaderPlaybackStartOffset(segmentId);
 const graphemes = useMemo(
  () => [...new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(segment?.zh ?? "")],
  [segment?.zh],
 );
 const textLabels = useTranslations("Reader.document.text");
 const commandLabels = useTranslations("Reader.study.chrome.commands");
 const toolsLabels = useTranslations("Reader.study.chrome.tools");
 const [stage, setStage] = useState<RevealStage>(0);
 const providedAnalysis = services.pronunciationReview?.analyses.get(segmentId);
 const analysis = providedAnalysis?.normalizedText === segment?.zh ? providedAnalysis : undefined;
 const glyphs = useMemo(
  () => new Map(analysis?.glyphs.map((glyph) => [glyph.start, glyph]) ?? []),
  [analysis],
 );
 const annotations =
  services.annotations?.items.filter((item) => item.segmentId === segmentId) ?? [];
 const register = useCallback(
  (element: HTMLElement | null) => registry.set(segmentId, element),
  [registry, segmentId],
 );
 if (!segment) return null;
 const tapMode = display.revealMode === "tap";
 const inlinePinyin =
  !tapMode &&
  analysis !== undefined &&
  (!segment.pinyin ||
   segment.pinyin === formatContextualSpokenPinyin(analysis) ||
   analysis.sourcePinyinStatus === "aligned" ||
   analysis.glyphs.some((glyph) => glyph.evidence.includes("manual-override")));
 const nextStage = nextAvailableRevealStage(stage, {
  hasPinyin: Boolean(segment.pinyin),
  hasMeaning: Boolean(segment.vi),
 });
 const captureSelection = (element: HTMLElement) => {
  if (!services.lookup && !services.annotations) return;
  const selection = captureReaderSelection(element, segment);
  if (!selection) return;
  if (services.annotations) services.annotations.onSelection(selection);
  else services.lookup?.(selection);
 };
 const hanziContent = (
  <LearnerHanziText
   as={segment.kind === "heading" ? "h3" : "p"}
   variant={segment.kind === "heading" ? "sectionTitle" : "body"}
   wrapping="preWrap"
   style={getReaderTypographyStyle(display)}
   data-reader-source
   hidden={tapMode && stage !== 0}
   aria-hidden={tapMode && stage !== 0}
  >
   {services.speech || annotations.length > 0 || inlinePinyin
    ? graphemes.map((grapheme) => {
       const glyph = glyphs.get(grapheme.index);
       const annotation = annotations.find(
        (item) =>
         item.start <= grapheme.index &&
         item.end >= grapheme.index + grapheme.segment.length &&
         segment.zh.slice(item.start, item.end) === item.text,
       );
       const playable =
        Boolean(annotation) ||
        (Boolean(services.speech) && /\p{Script=Han}/u.test(grapheme.segment));
       const currentOffset = Math.min(
        segment.zh.length - 1,
        startOffset + (segment.zh.length - startOffset) * progress,
       );
       const highlighted =
        status !== "idle" &&
        grapheme.index <= currentOffset &&
        currentOffset < grapheme.index + grapheme.segment.length;
       const play = (element: HTMLElement) => {
        if (window.getSelection()?.isCollapsed === false) return;
        if (annotation) services.annotations?.onOpen(annotation, element.getBoundingClientRect());
        else commands.playFromCharacter(segmentId, grapheme.index);
       };
       const hanzi = (
        <span
         key={grapheme.index}
         className={cn(
          playable && focusRingClassName,
          playable && "cursor-pointer rounded-sm",
          highlighted && "reading-progress-highlight",
          annotation && "reading-highlight",
         )}
         role={playable ? "button" : undefined}
         tabIndex={playable ? 0 : undefined}
         aria-label={
          annotation
           ? textLabels("openAnnotation", { text: annotation.text })
           : playable
             ? textLabels("playFromCharacter", { character: grapheme.segment })
             : undefined
         }
         aria-current={highlighted ? "true" : undefined}
         onClick={playable ? (event) => play(event.currentTarget) : undefined}
         onKeyDown={
          playable
           ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              play(event.currentTarget);
             }
           : undefined
         }
        >
         {grapheme.segment}
        </span>
       );
       if (!inlinePinyin || !display.showPinyin || !glyph?.spokenPinyin || !analysis) return hanzi;
       const needsPronunciationReview =
        glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
       const inspect = (element: HTMLElement) =>
        services.pronunciationReview?.onInspect({
         segmentId,
         analysis,
         glyph,
         rect: element.getBoundingClientRect(),
        });
       return (
        <ruby key={grapheme.index}>
         {hanzi}
         <rt className="select-none font-pinyin text-[0.45em] font-semibold text-accent-text">
          <span
           role="button"
           tabIndex={0}
           className={cn(
            "cursor-pointer rounded-sm",
            focusRingClassName,
            needsPronunciationReview &&
             "text-warning underline decoration-dotted underline-offset-2",
           )}
           aria-label={textLabels(
            needsPronunciationReview ? "inspectUnconfirmedPinyin" : "inspectPinyin",
            { character: grapheme.segment },
           )}
           onClick={(event) => {
            event.stopPropagation();
            inspect(event.currentTarget);
           }}
           onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            inspect(event.currentTarget);
           }}
          >
           {glyph.spokenPinyin}
          </span>
         </rt>
        </ruby>
       );
      })
    : segment.zh}
  </LearnerHanziText>
 );
 const content = (
  <Card asChild variant={active ? "subtle" : "section"}>
   <article
    ref={register}
    data-reader-segment={segmentId}
    data-active={active}
    data-no-inspector="true"
    className="grid min-w-0 gap-2"
    onMouseUp={(event) => captureSelection(event.currentTarget)}
    onTouchEnd={(event) => captureSelection(event.currentTarget)}
    onKeyUp={(event) => captureSelection(event.currentTarget)}
   >
    <div className="flex min-w-0 flex-wrap items-center gap-2">
     {segment.speaker?.label ? (
      <Typography variant="caption" tone="muted" weight="semibold">
       {segment.speaker.label}
      </Typography>
     ) : null}
     {segment.role ? (
      <Typography variant="caption" tone="muted">
       {segment.role}
      </Typography>
     ) : null}
    </div>
    <div className="flex min-w-0 items-end gap-2">
     <div className="min-w-0 flex-1">
      {services.renderHanzi ? (
       <div hidden={tapMode && stage !== 0} aria-hidden={tapMode && stage !== 0}>
        {services.renderHanzi({ segment, content: hanziContent })}
       </div>
      ) : (
       hanziContent
      )}
      {(tapMode ? stage === 1 : display.showPinyin && !inlinePinyin) && segment.pinyin ? (
       <Typography lang="zh-Latn-pinyin" tone="muted" wrapping="preWrap">
        {segment.pinyin}
       </Typography>
      ) : null}
      {(tapMode ? stage === 2 : display.showMeaning) && segment.vi ? (
       <Typography wrapping="preWrap">{segment.vi}</Typography>
      ) : null}
      {tapMode ? (
       <Button
        variant="ghost"
        size="touch"
        disabled={nextStage === stage}
        onClick={() => setStage(nextStage)}
       >
        {toolsLabels("revealNext")}
       </Button>
      ) : null}
     </div>
     {services.speech ? (
      <Button
       type="button"
       variant="ghost"
       size="icon"
       className="shrink-0 self-end"
       aria-label={commandLabels("listen")}
       onClick={() => commands.playFromCharacter(segmentId, 0)}
      >
       <Volume2 />
      </Button>
     ) : null}
    </div>
    {status !== "idle" ? (
     <Typography variant="caption" tone="muted" aria-live="off">
      {Math.round(progress * 100)}%
     </Typography>
    ) : null}
   </article>
  </Card>
 );
 return services.renderSegment ? services.renderSegment({ segment, content }) : content;
});
