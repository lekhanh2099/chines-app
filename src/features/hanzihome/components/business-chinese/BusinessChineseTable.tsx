"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import {
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { cn } from "@/lib/utils";
import { BusinessChineseText, SpeakableBusinessChineseText } from "./BusinessChineseText";
import { businessChineseTableColumns } from "./business-chinese-study-utils";

export function BusinessChineseTable({
 block,
 displayMode,
 vocabularyCards = false,
 learnerContent = false,
}: {
 block: TextbookLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
 vocabularyCards?: boolean;
 learnerContent?: boolean;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const [rowChoices, setRowChoices] = useState<Map<number, string>>(() => new Map());
 const answerVisible = displayMode.showAnswers || revealed;
 const { headers, pinyinColumnIndex, hanziColumnIndex, isVocabularyTable, visibleColumnIndexes } =
  businessChineseTableColumns(block, displayMode, answerVisible);
 const trueFalseColumnIndex = headers.findIndex(
  (header, index) => /^đ\/s$/iu.test(header.trim()) && block.answerColumnIndexes?.includes(index),
 );
 const hanvietColumnIndex = headers.findIndex((header) => /^hán việt$/iu.test(header));
 const posColumnIndex = headers.findIndex((header) => /^từ loại$/iu.test(header));
 const meaningColumnIndex = headers.findIndex((header) =>
  /^(dịch )?nghĩa( tiếng việt)?$/iu.test(header),
 );
 const metadataColumnIndexes = visibleColumnIndexes.filter(
  (index) =>
   index !== hanziColumnIndex &&
   index !== pinyinColumnIndex &&
   index !== hanvietColumnIndex &&
   index !== posColumnIndex &&
   index !== meaningColumnIndex &&
   headers[index] !== "STT",
 );

 return (
  <div className="grid min-w-0 gap-2">
   {block.text ? (
    <SpeakableBusinessChineseText
     pronunciationId={`${block.id}:prompt`}
     text={block.text}
     displayMode={displayMode}
     compactHanzi
     learnerContent={learnerContent}
     variant={learnerContent ? "body" : undefined}
    />
   ) : null}
   {block.answerColumnIndexes?.length && !displayMode.showAnswers ? (
    <Button
     type="button"
     variant="outline"
     size="compact"
     className="justify-self-start"
     aria-expanded={revealed}
     onClick={() => setRevealed((current) => !current)}
    >
     {revealed ? t("actions.hideAnswer") : t("actions.showAnswer")}
    </Button>
   ) : null}
   {visibleColumnIndexes.length > 0 ? (
    vocabularyCards && isVocabularyTable ? (
     <div className="grid min-w-0 gap-2 sm:grid-cols-2">
      {block.rows.slice(1).map((row, rowIndex) => (
       <VocabPreviewRow
        key={`${block.id}-row-${rowIndex}`}
        hanzi={row[hanziColumnIndex] ?? ""}
        pinyin={row[pinyinColumnIndex] ?? ""}
        hanviet={
         visibleColumnIndexes.includes(hanvietColumnIndex) ? (row[hanvietColumnIndex] ?? "") : ""
        }
        category={visibleColumnIndexes.includes(posColumnIndex) ? (row[posColumnIndex] ?? "") : ""}
        meaning={
         visibleColumnIndexes.includes(meaningColumnIndex) ? (row[meaningColumnIndex] ?? "") : ""
        }
        header={
         <SpeakableBusinessChineseText
          pronunciationId={`${block.id}:row:${rowIndex}:cell:${hanziColumnIndex}`}
          text={row[hanziColumnIndex] ?? ""}
          sourcePinyin={row[pinyinColumnIndex]}
          displayMode={displayMode}
          variant="body"
         />
        }
       >
        {metadataColumnIndexes.length > 0 ? (
         <div className="grid min-w-0 gap-1">
          {metadataColumnIndexes.map((cellIndex) => (
           <div
            key={`${block.id}-row-${rowIndex}-cell-${cellIndex}`}
            className="grid min-w-0 gap-1"
           >
            <StudyInstructionText variant="caption" tone="muted" weight="bold">
             {headers[cellIndex]}
            </StudyInstructionText>
            <SpeakableBusinessChineseText
             pronunciationId={`${block.id}:row:${rowIndex}:cell:${cellIndex}`}
             text={row[cellIndex] ?? ""}
             displayMode={displayMode}
             variant="bodySmall"
             compactHanzi
            />
           </div>
          ))}
         </div>
        ) : null}
       </VocabPreviewRow>
      ))}
     </div>
    ) : (
     <div className="max-w-full overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full min-w-2xl border-collapse text-left">
       <thead className="bg-surface-muted">
        <tr>
         {visibleColumnIndexes.map((cellIndex) => (
          <th
           key={`${block.id}-header-${cellIndex}`}
           scope="col"
           className={cn(
            "border-b border-border-default align-top",
            isVocabularyTable ? "px-4 py-3" : "px-3 py-2",
           )}
          >
           <BusinessChineseText
            pronunciationId={`${block.id}:header:${cellIndex}`}
            text={headers[cellIndex] ?? ""}
            displayMode={displayMode}
            variant={isVocabularyTable || learnerContent ? "body" : "label"}
            weight={isVocabularyTable ? "black" : undefined}
            compactHanzi
            learnerContent={learnerContent}
           />
          </th>
         ))}
        </tr>
       </thead>
       <tbody>
        {block.rows.slice(1).map((row, rowIndex) => (
         <tr
          key={`${block.id}-row-${rowIndex}`}
          className="border-b border-border-default last:border-b-0"
         >
          {visibleColumnIndexes.map((cellIndex) => (
           <td
            key={`${block.id}-row-${rowIndex}-cell-${cellIndex}`}
            className={cn("align-top", isVocabularyTable ? "px-4 py-3" : "px-3 py-2")}
           >
            {cellIndex === pinyinColumnIndex ? (
             <PinyinText
              as="span"
              variant={isVocabularyTable || learnerContent ? "body" : "bodySmall"}
              tone="secondary"
              weight="semibold"
              wrapping="preWrap"
             >
              {row[cellIndex] ?? ""}
             </PinyinText>
            ) : (
             <SpeakableBusinessChineseText
              pronunciationId={`${block.id}:row:${rowIndex}:cell:${cellIndex}`}
              text={row[cellIndex] ?? ""}
              displayMode={displayMode}
              sourcePinyin={
               cellIndex === hanziColumnIndex && pinyinColumnIndex >= 0
                ? row[pinyinColumnIndex]
                : undefined
              }
              variant={isVocabularyTable || learnerContent ? "body" : "bodySmall"}
              compactHanzi={!isVocabularyTable && headers.length !== 2}
              learnerContent={learnerContent}
             />
            )}
            {trueFalseColumnIndex >= 0 && cellIndex === 1 ? (
             <div className="flex flex-wrap gap-2">
              {[
               { value: "Đ", label: t("practice.trueChoice") },
               { value: "S", label: t("practice.falseChoice") },
              ].map((choice) => (
               <Button
                key={choice.value}
                type="button"
                size="compact"
                variant={
                 rowChoices.get(rowIndex) === choice.value
                  ? choice.value === row[trueFalseColumnIndex].match(/^[ĐS](?=\s|$)/u)?.[0]
                   ? "success"
                   : "warning"
                  : "outline"
                }
                aria-pressed={rowChoices.get(rowIndex) === choice.value}
                onClick={() =>
                 setRowChoices((current) => new Map(current).set(rowIndex, choice.value))
                }
               >
                {choice.label}
               </Button>
              ))}
             </div>
            ) : null}
           </td>
          ))}
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    )
   ) : null}
  </div>
 );
}
