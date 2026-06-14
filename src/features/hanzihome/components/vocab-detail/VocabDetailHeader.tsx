import { Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveMemoryTipButton } from "@/features/hanzihome/memory-tips/SaveMemoryTipButton";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { PopularFontPreview } from "./PopularFontPreview";

export function VocabDetailHeader({
 word,
 bookmarked,
 lessonId,
 compact = false,
 onBookmark,
}: {
 word: HanziHomeVocabItem;
 bookmarked: boolean;
 lessonId?: string;
 compact?: boolean;
 onBookmark: () => void;
}) {
 return (
  <div
   className={[
    "grid grid-cols-1 items-start gap-4",
    compact ? "" : "xl:grid-cols-[minmax(0,1fr)_minmax(0,46rem)]",
   ].join(" ")}
  >
   <div className="min-w-0">
    <div
     className={[
      "grid gap-3",
      compact ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)] lg:items-end",
     ].join(" ")}
    >
     <div className="min-w-0">
      <h2
       className={[
        "leading-none tracking-normal text-text-primary",
        compact ? "text-5xl" : "text-6xl",
       ].join(" ")}
       lang="zh-CN"
      >
       {compact ? word.hanzi : <PopularFontPreview word={word.hanzi} />}
      </h2>
      <p className={["font-black text-accent-text", compact ? "text-lg" : "text-xl"].join(" ")}>
       {word.pinyin}
       {word.meaning.hanviet ? ` · ${word.meaning.hanviet}` : ""}
      </p>
      {word.meaning.meaning_vi && (
       <p className="mt-1 text-base font-semibold leading-relaxed text-text-primary">
        {word.meaning.meaning_vi}
       </p>
      )}
     </div>
    </div>

    <div className="mt-2 flex flex-wrap items-center gap-1.5">
     {word.pos.raw_vi && <Badge variant="info">{word.pos.raw_vi}</Badge>}

     {word.level_tag !== "unknown" && <Badge variant="danger">{word.level_tag}</Badge>}
     <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
      <Bookmark className="h-4 w-4" />
      {bookmarked ? "Đã lưu" : "Lưu"}
     </Button>

     <SaveMemoryTipButton
      payload={{
       tipType: "vocab",
       title: `${word.hanzi} · ${word.pinyin}`,
       body: `${word.meaning.hanviet} · ${getVocabDisplayMeaning(word)}`,
       exampleZh: word.examples[0]?.zh,
       examplePinyin: word.examples[0]?.pinyin,
       exampleVi: word.examples[0]?.vi,
       sourceType: "vocab",
       sourceLessonId: lessonId,
       sourceItemId: word.runtimeId,
       sourceLabel: word.hanzi,
       tags: ["vocab", word.category, ...word.tags].filter(Boolean),
       weight: 2,
      }}
     />
    </div>
   </div>

   <div className="min-w-0 overflow-x-auto">
    <div className={compact ? "min-w-0" : "w-max min-w-full"}>
     <div className="grid gap-2">
      {word.meaning.short_definition_vi && (
       <p className="text-lg font-black text-text-primary">{word.meaning.short_definition_vi}</p>
      )}
      {word.meaning.textbook_focus_vi && <p>{word.meaning.textbook_focus_vi}</p>}
      {word.meaning.natural_translations_vi.length > 0 && (
       <p>Tự nhiên: {word.meaning.natural_translations_vi.join(", ")}</p>
      )}

      {word.meaning.register_vi && <p>Sắc thái: {word.meaning.register_vi}</p>}
      {word.meaning.usage_domain_vi && <p>Phạm vi dùng: {word.meaning.usage_domain_vi}</p>}
      {word.meaning.notes.map((note) => (
       <p key={note.text_vi}>{note.text_vi}</p>
      ))}
     </div>
    </div>
   </div>
  </div>
 );
}
