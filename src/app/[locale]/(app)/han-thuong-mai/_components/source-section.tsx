"use client";

import { useMemo } from "react";

import { Typography } from "@/components/ui/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 analyzeContextualPronunciation,
 formatContextualSpokenPinyin,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";

import type {
 BusinessChineseLessonBlock,
 BusinessChineseLessonSection,
} from "../_lib/business-chinese-data";
import { MandarinAudioButton } from "./mandarin-audio-button";

const hanziPattern = /\p{Script=Han}/u;
const trailingVietnameseTranslationPattern = /\s+\([^()\p{Script=Han}]+\)\s*$/u;
const meaningHeaderPattern = /^(Tiếng Việt|Dịch nghĩa|Nghĩa tiếng Việt)$/iu;

function containsHanzi(text: string) {
 return hanziPattern.test(text);
}

function pronunciationTarget(text: string) {
 return text.replace(trailingVietnameseTranslationPattern, "").trim();
}

function generatedPinyin(text: string) {
 const target = pronunciationTarget(text);
 if (!containsHanzi(target) || target.length > 2_000) return null;
 try {
  return formatContextualSpokenPinyin(analyzeContextualPronunciation({ text: target }));
 } catch {
  return null;
 }
}

function ChineseStudyLine({
 text,
 showPinyin,
 heading = false,
}: {
 text: string;
 showPinyin: boolean;
 heading?: boolean;
}) {
 const pinyin = useMemo(() => (showPinyin ? generatedPinyin(text) : null), [showPinyin, text]);
 const audioText = pronunciationTarget(text);

 return (
  <div className="grid min-w-0 gap-1">
   {pinyin !== null ? <PinyinText tone="secondary">{pinyin}</PinyinText> : null}
   <div className="flex min-w-0 items-start gap-1">
    <HanziText
     as={heading ? "h3" : "p"}
     variant={heading ? "cardTitle" : "body"}
     size="inherit"
     className="min-w-0 flex-1 whitespace-pre-wrap"
    >
     {text}
    </HanziText>
    {containsHanzi(audioText) ? <MandarinAudioButton text={audioText} /> : null}
   </div>
  </div>
 );
}

function SourceTable({
 rows,
 showPinyin,
 showMeaning,
}: {
 rows: string[][];
 showPinyin: boolean;
 showMeaning: boolean;
}) {
 const header = rows.at(0) ?? [];
 const hiddenColumns = new Set(
  header.flatMap((cell, index) => (!showMeaning && meaningHeaderPattern.test(cell.trim()) ? [index] : [])),
 );
 const hasPinyinColumn = header.some((cell) => cell.trim().toLocaleLowerCase() === "pinyin");

 return (
  <div className="max-w-full overflow-x-auto rounded-xl border border-border-default">
   <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
    <tbody>
     {rows.map((row, rowIndex) => (
      <tr key={`${rowIndex}-${row.join("|")}`} className="border-b border-border-default last:border-b-0">
       {row.map((cell, columnIndex) => {
        if (hiddenColumns.has(columnIndex)) return null;
        const Cell = rowIndex === 0 ? "th" : "td";
        const pinyin =
         showPinyin && !hasPinyinColumn && containsHanzi(cell) ? generatedPinyin(cell) : null;
        return (
         <Cell
          key={`${columnIndex}-${cell}`}
          className="min-w-32 px-3 py-2.5 align-top first:min-w-16 first:font-semibold"
         >
          {pinyin !== null ? <PinyinText tone="secondary">{pinyin}</PinyinText> : null}
          {containsHanzi(cell) ? (
           <HanziText as="span" variant="body" size="inherit" className="whitespace-pre-wrap">
            {cell}
           </HanziText>
          ) : (
           <Typography as="span" variant="bodySmall" wrapping="preWrap">
            {cell}
           </Typography>
          )}
         </Cell>
        );
       })}
      </tr>
     ))}
    </tbody>
   </table>
  </div>
 );
}

export function SourceBlock({
 block,
 showPinyin,
 showMeaning,
}: {
 block: BusinessChineseLessonBlock;
 showPinyin: boolean;
 showMeaning: boolean;
}) {
 if (block.type === "table") {
  return <SourceTable rows={block.rows} showPinyin={showPinyin} showMeaning={showMeaning} />;
 }

 if (block.type === "subheading") {
  return containsHanzi(block.text) ? (
   <ChineseStudyLine text={block.text} showPinyin={showPinyin} heading />
  ) : (
   <Typography variant="cardTitle" wrapping="preWrap">
    {block.text}
   </Typography>
  );
 }

 if (containsHanzi(block.text)) {
  return <ChineseStudyLine text={block.text} showPinyin={showPinyin} />;
 }

 return (
  <Typography variant="body" tone="secondary" wrapping="preWrap">
   {block.text}
  </Typography>
 );
}

function isTranslationSection(section: BusinessChineseLessonSection) {
 return section.title.includes("DỊCH BÀI KHÓA") || section.title.includes("Bản dịch tiếng Việt");
}

export function SourceSection({
 section,
 showPinyin,
 showMeaning,
}: {
 section: BusinessChineseLessonSection;
 showPinyin: boolean;
 showMeaning: boolean;
}) {
 if (!showMeaning && isTranslationSection(section)) return null;

 return (
  <section className="grid gap-4 border-b border-border-default pb-6 last:border-b-0 last:pb-0">
   <Typography variant="sectionTitle">{section.title}</Typography>
   <div className="grid gap-3">
    {section.blocks.map((block, index) => (
     <SourceBlock
      key={`${section.title}-${index}`}
      block={block}
      showPinyin={showPinyin}
      showMeaning={showMeaning}
     />
    ))}
   </div>
  </section>
 );
}
