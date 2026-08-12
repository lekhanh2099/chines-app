"use client";

import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useState } from "react";

import { HanziStrokeWriter } from "@/features/hanzihome/components/HanziStrokeWriter";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { Button } from "@/components/ui/button";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

type VocabWritingCueProps = {
 word: HanziHomeVocabItem;
 size?: number;
 autoPlay?: boolean;
 className?: string;
 compact?: boolean;
 selectedIndex?: number;
 onSelectedIndexChange?: (index: number) => void;
 isShowAll?: boolean;
};

function getWritingLines(word: HanziHomeVocabItem) {
 return word.word_formation.characters
  .flatMap((character) => [
   character.modern_meaning_vi ? `${character.hanzi}: ${character.modern_meaning_vi}` : "",
   character.modern_logic_vi,
   character.structure_note_vi,
  ])
  .filter(Boolean)
  .slice(0, 4);
}

function getCharacterInfo(word: HanziHomeVocabItem) {
 return {
  pinyin: word.pinyin,
  meaning: getVocabDisplayMeaning(word),
  hanViet: word.meaning.hanviet,
  lines: getWritingLines(word),
 };
}

export function VocabWritingCue({
 word,
 size = 180,
 autoPlay = false,
 className = "",
 compact = false,
 selectedIndex,
 onSelectedIndexChange,
 isShowAll,
}: VocabWritingCueProps) {
 const chars = Array.from(word.hanzi).filter((char) => /\p{Script=Han}/u.test(char));

 const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
 const [writerKey, setWriterKey] = useState(0);

 if (chars.length === 0) return null;

 const safeSelectedIndex =
  typeof selectedIndex === "number"
   ? Math.min(Math.max(selectedIndex, 0), chars.length - 1)
   : Math.min(Math.max(internalSelectedIndex, 0), chars.length - 1);

 const activeCharacter = chars[safeSelectedIndex] || chars[0];
 const writingCharacters = isShowAll ? chars : [activeCharacter];
 const info = getCharacterInfo(word);

 const selectCharacter = (index: number) => {
  const nextIndex = Math.min(Math.max(index, 0), chars.length - 1);

  setInternalSelectedIndex(nextIndex);
  onSelectedIndexChange?.(nextIndex);
  setWriterKey((value) => value + 1);
 };

 const replay = () => {
  setWriterKey((value) => value + 1);
 };

 return (
  <section
   className={[
    "grid gap-2",
    !isShowAll
     ? compact
       ? "rounded-xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
       : "rounded-xl bg-bg-primary p-3 shadow-theme-sm sm:p-4"
     : "",
    className,
   ].join(" ")}
   onClick={(event) => event.stopPropagation()}
   onMouseDown={(event) => event.stopPropagation()}
   onTouchStart={(event) => event.stopPropagation()}
  >
   <div className="flex flex-wrap items-center justify-between gap-2">
    {isShowAll ? null : (
     <div className="flex flex-wrap gap-1.5">
      {chars.map((char, index) => {
       const active = index === safeSelectedIndex;
       return (
        <Button
         key={`${char}-${index}`}
         type="button"
         onClick={() => selectCharacter(index)}
         variant={active ? "active" : "outline"}
         size={compact ? "compact" : "touch"}
         aria-label={`Xem nét viết chữ ${char}`}
        >
         <HanziText as="span" size="medium" leading="none">
          {char}
         </HanziText>
        </Button>
       );
      })}
     </div>
    )}
   </div>

   <div
    className={[
     "relative grid gap-4 md:items-start",
     compact || isShowAll ? "justify-items-center" : "md:grid-cols-[auto_minmax(0,1fr)]",
    ].join(" ")}
   >
    <div
     className={[
      isShowAll
       ? "grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] justify-items-center gap-2"
       : "flex gap-2 justify-items-center",
     ].join(" ")}
    >
     {writingCharacters.map((character, index) => (
      <HanziStrokeWriter
       key={`${character}-${index}-${writerKey}`}
       character={character}
       size={isShowAll ? Math.min(size, 156) : size}
       autoPlay={autoPlay}
       showActions={false}
       className="rounded-lg"
       onRelay={replay}
      />
     ))}
    </div>

    {!compact && (
     <div className="grid content-start gap-2 leading-relaxed text-text-secondary">
      <StudyInstructionText>
       <StudyInstructionText as="span" tone="default" weight="bold">
        Bính âm:
       </StudyInstructionText>{" "}
       <PinyinText as="span" weight="black">
        {info.pinyin}
       </PinyinText>
      </StudyInstructionText>

      <StudyInstructionText>
       <StudyInstructionText as="span" tone="default" weight="bold">
        Hán Việt:
       </StudyInstructionText>{" "}
       {info.hanViet}
      </StudyInstructionText>

      <StudyInstructionText>
       <StudyInstructionText as="span" tone="default" weight="bold">
        Nghĩa:
       </StudyInstructionText>{" "}
       {info.meaning}
      </StudyInstructionText>

      {info.lines.length > 0 ? (
       <div className="grid gap-1 border-t border-border-default pt-2">
        {info.lines.map((line) => (
         <StudyInstructionText key={line}>{line}</StudyInstructionText>
        ))}
       </div>
      ) : (
       <StudyInstructionText tone="muted" className="border-t border-border-default pt-2">
        Chưa có ghi chú cấu tạo chữ cho mục này.
       </StudyInstructionText>
      )}
     </div>
    )}
   </div>
  </section>
 );
}
