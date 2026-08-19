"use client";

import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HanziHomeVocabItem, LearningStatus } from "@/features/hanzihome/types";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import { CreateNormalizedChildDialog } from "@/features/hanzihome/editing/components/CreateNormalizedChildDialog";
import { HanziStrokeWriter } from "@/features/hanzihome/components/HanziStrokeWriter";

import { hasCultureContent, hasSectionInItem, hasWarningContent } from "./content-checks";
import { sectionShortcutTabs, type SectionView } from "./types";
import { VocabDetailHeader } from "./VocabDetailHeader";
import {
 CultureSection,
 StructuredVocabSections,
 WarningSection,
 WordFormationPreview,
} from "./VocabDetailSections";
import { cn } from "@/lib/utils";
import { z } from "zod";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

function isTypingTarget(element: Document["activeElement"]) {
 return (
  element instanceof HTMLInputElement ||
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement ||
  element?.getAttribute("role") === "textbox" ||
  Boolean(element?.closest("[contenteditable='true'], [data-editor-root]"))
 );
}

type VocabDetailPanelProps = {
 word: Nullable<HanziHomeVocabItem>;
 wordPath?: Nullable<EditableNodePath>;
 status: LearningStatus;
 bookmarked: boolean;
 onBookmark: () => void;
 lessonId?: string;
 compact?: boolean;
 onMarkStatus: (status: LearningStatus) => void;
};

export function VocabDetailPanel({
 word,
 wordPath,
 bookmarked,
 onBookmark,
 lessonId,
 compact = false,
}: VocabDetailPanelProps) {
 const [sectionView, setSectionView] = useState<SectionView>("all");
 const [selectedWritableCharacterIndex, setSelectedWritableCharacterIndex] = useState(0);
 const editMode = useHanziHomeEditMode();

 useEffect(() => {
  if (!word) return;

  const availableTabs = sectionShortcutTabs.filter((item) => {
   return hasSectionInItem(word, item.key);
  });

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
   }

   if (isTypingTarget(document.activeElement)) return;

   const nextTab = availableTabs.find((item) => item.shortcut === event.key);

   if (!nextTab) return;

   event.preventDefault();
   setSectionView(nextTab.key);
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
   window.removeEventListener("keydown", handleKeyDown);
  };
 }, [word]);

 if (!word) {
  return (
   <Card variant="subtle" padding="lg">
    <StudyInstructionText tone="muted" weight="semibold">
     Chọn một từ để xem chi tiết.
    </StudyInstructionText>
   </Card>
  );
 }

 const sectionTabs = [...sectionShortcutTabs].filter((item) => {
  return hasSectionInItem(word, item.key);
 });
 const effectiveSectionView = sectionTabs.some((item) => item.key === sectionView)
  ? sectionView
  : "all";
 const writableCharacters = Array.from(word.hanzi).filter((character) =>
  /\p{Script=Han}/u.test(character),
 );
 const activeWritableCharacterIndex =
  selectedWritableCharacterIndex < writableCharacters.length ? selectedWritableCharacterIndex : 0;
 const activeWritableCharacter = writableCharacters[activeWritableCharacterIndex];

 return (
  <article
   className={cn("grid gap-4", !compact && "xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start")}
  >
   <div className="grid min-w-0 gap-4">
    <Card variant="section" padding={compact ? "md" : "lg"}>
     <div className="grid gap-4">
      <VocabDetailHeader
       word={word}
       bookmarked={bookmarked}
       lessonId={lessonId}
       compact={compact}
       onBookmark={onBookmark}
      />

      <nav
       className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
       aria-label="Điều hướng phần từ vựng"
      >
       {sectionTabs.map((item) => (
        <Button
         key={item.key}
         type="button"
         onClick={() => setSectionView(item.key)}
         variant={item.key === effectiveSectionView ? "active" : "outline"}
         size="toolbar"
         aria-pressed={item.key === effectiveSectionView}
        >
         <span>{item.label}</span>
         <kbd className="rounded-full bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
          {item.shortcut}
         </kbd>
        </Button>
       ))}
      </nav>
     </div>
    </Card>

    <div className="grid gap-4">
     {editMode && lessonId && word.editMeta ? (
      <div className="flex justify-end">
       <CreateNormalizedChildDialog family="vocab" lessonId={lessonId} parent={word.editMeta} />
      </div>
     ) : null}
     <StructuredVocabSections
      item={word}
      itemPath={wordPath ?? undefined}
      lessonId={lessonId}
      sectionView={effectiveSectionView}
      keyword={word.hanzi}
     />
    </div>
   </div>

   <aside
    className={cn(
     "grid gap-4",
     !compact && "xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto xl:pr-1",
    )}
   >
    {writableCharacters.length > 0 && (
     <Card variant="default" padding="md">
      <div className="grid gap-4">
       <div>
        <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
         Nét viết
        </Typography>
        <StudyInstructionText variant="bodySmall" tone="muted">
         Xem thứ tự nét hoặc luyện viết từng chữ.
        </StudyInstructionText>
       </div>

       {writableCharacters.length > 1 && (
        <div className="flex flex-wrap gap-2" aria-label="Chọn chữ để xem nét viết">
         {writableCharacters.map((character, index) => (
          <Button
           key={`${character}-${index}`}
           type="button"
           variant={index === activeWritableCharacterIndex ? "active" : "outline"}
           size="compact"
           onClick={() => setSelectedWritableCharacterIndex(index)}
           aria-pressed={index === activeWritableCharacterIndex}
           aria-label={`Xem nét viết chữ ${character}, vị trí ${index + 1}`}
          >
           <HanziText as="span" size="medium" leading="none">
            {character}
           </HanziText>
          </Button>
         ))}
        </div>
       )}

       {activeWritableCharacter && (
        <div className="grid justify-items-center">
         <HanziStrokeWriter
          key={activeWritableCharacter}
          character={activeWritableCharacter}
          size={compact ? 140 : 168}
         />
        </div>
       )}
      </div>
     </Card>
    )}

    <WordFormationPreview formation={word.word_formation} />

    {hasCultureContent(word.culture_note) && <CultureSection culture={word.culture_note} />}
    {hasWarningContent(word.warnings) && <WarningSection warnings={word.warnings} />}
   </aside>
  </article>
 );
}
