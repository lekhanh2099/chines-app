"use client";

import { useState } from "react";

import { HanziStrokeWriter } from "@/features/hanzihome/components/HanziStrokeWriter";
import type { VocabViewModel } from "@/features/hanzihome/types";

type VocabWritingCueProps = {
 word: VocabViewModel;
 size?: number;
 autoPlay?: boolean;
 className?: string;
 selectedIndex?: number;
 onSelectedIndexChange?: (index: number) => void;
};

function getWritingLines(word: VocabViewModel) {
 const writingSection =
  word.detailSections.find((section) =>
   ["writing", "strokes", "stroke", "etymology", "logic"].includes(section.key),
  ) ||
  word.detailSections.find((section) =>
   /nét|viết|chiết tự|cấu tạo|logic/i.test(section.title),
  );

 return writingSection?.lines.slice(0, 4) ?? [];
}

function getCharacterInfo(word: VocabViewModel) {
 return {
  pinyin: word.pinyin,
  meaning: word.meaning,
  hanViet: word.hanViet,
  lines: getWritingLines(word),
 };
}

export function VocabWritingCue({
 word,
 size = 180,
 autoPlay = false,
 className = "",
 selectedIndex,
 onSelectedIndexChange,
}: VocabWritingCueProps) {
 const chars = Array.from(word.word).filter((char) =>
  /\p{Script=Han}/u.test(char),
 );

 const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
 const [writerKey, setWriterKey] = useState(0);

 if (chars.length === 0) return null;

 const safeSelectedIndex =
  typeof selectedIndex === "number"
   ? Math.min(Math.max(selectedIndex, 0), chars.length - 1)
   : Math.min(Math.max(internalSelectedIndex, 0), chars.length - 1);

 const activeCharacter = chars[safeSelectedIndex] || chars[0];
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
    "rounded-xl bg-bg-primary p-3 shadow-theme-sm sm:p-4",
    className,
   ].join(" ")}
   onClick={(event) => event.stopPropagation()}
   onMouseDown={(event) => event.stopPropagation()}
   onTouchStart={(event) => event.stopPropagation()}
  >
   <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap gap-1.5 ">
     {chars.map((char, index) => {
      const active = index === safeSelectedIndex;

      return (
       <button
        key={`${char}-${index}`}
        type="button"
        onClick={() => selectCharacter(index)}
        className={[
         "font-hanzi-display grid h-8 min-w-9 place-items-center rounded-lg px-3 text-lg font-black transition-colors",
         active
          ? "bg-bg-inverse text-text-inverse"
          : "bg-bg-subtle text-text-primary hover:bg-accent-subtle",
        ].join(" ")}
        lang="zh-CN"
       >
        {char}
       </button>
      );
     })}
    </div>
   </div>

   <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start relative">
    <div className="mx-auto md:mx-0">
     <HanziStrokeWriter
      key={`${activeCharacter}-${writerKey}`}
      character={activeCharacter}
      size={size}
      autoPlay={autoPlay}
      showActions={false}
      className="rounded-lg"
      onRelay={replay}
     />
    </div>

    <div className="grid content-start gap-2 text-sm leading-relaxed text-text-secondary">
     <p>
      <span className="font-bold text-text-primary">Bính âm:</span>{" "}
      <span className="font-pinyin font-black">{info.pinyin}</span>
     </p>

     <p>
      <span className="font-bold text-text-primary">Hán Việt:</span>{" "}
      {info.hanViet}
     </p>

     <p>
      <span className="font-bold text-text-primary">Nghĩa:</span> {info.meaning}
     </p>

     {info.lines.length > 0 ? (
      <div className="mt-1 grid gap-1 border-t border-border-default pt-2">
       {info.lines.map((line) => (
        <p key={line}>{line}</p>
       ))}
      </div>
     ) : (
      <p className="mt-1 border-t border-border-default pt-2 text-text-muted">
       Chưa có ghi chú cấu tạo chữ cho mục này.
      </p>
     )}
    </div>
   </div>
  </section>
 );
}
