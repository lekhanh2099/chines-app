import { Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveMemoryTipButton } from "@/features/hanzihome/memory-tips/SaveMemoryTipButton";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { PopularFontPreview } from "./PopularFontPreview";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";

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
  <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:items-start">
   <div className="grid min-w-0 gap-3">
    <div className="grid min-w-0 gap-1.5">
     <div className="flex items-start gap-2">
      <h2
       className={[
        "min-w-0 leading-none tracking-normal text-text-primary",
        compact ? "text-5xl" : "text-6xl sm:text-7xl",
       ].join(" ")}
       lang="zh-CN"
      >
       {compact ? word.hanzi : <PopularFontPreview word={word.hanzi} />}
      </h2>
      <NativeMandarinSpeakButton text={word.hanzi} />
     </div>
     <p className={["font-black text-accent-text", compact ? "text-lg" : "text-xl"].join(" ")}>
      {word.pinyin}
      {word.meaning.hanviet ? ` · ${word.meaning.hanviet}` : ""}
     </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     {word.pos.raw_vi && <Badge variant="info">{word.pos.raw_vi}</Badge>}

     {word.level_tag !== "unknown" && <Badge variant="danger">{word.level_tag}</Badge>}
     <Button
      variant={bookmarked ? "default" : "outline"}
      size="toolbar"
      aria-pressed={bookmarked}
      onClick={onBookmark}
     >
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

   <div className="grid min-w-0 gap-2 border-t border-border-default pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
    <p className="text-xs font-bold text-text-muted">NGHĨA VÀ CÁCH DÙNG</p>
    {word.meaning.short_definition_vi && (
     <p className="text-xl font-black leading-snug text-text-primary">
      {word.meaning.short_definition_vi}
     </p>
    )}
    {word.meaning.meaning_vi && word.meaning.meaning_vi !== word.meaning.short_definition_vi && (
     <p className="text-base font-semibold leading-relaxed text-text-secondary">
      {word.meaning.meaning_vi}
     </p>
    )}
    {word.meaning.textbook_focus_vi && (
     <p className="max-w-[72ch] leading-relaxed text-text-secondary">
      {word.meaning.textbook_focus_vi}
     </p>
    )}
    {word.meaning.natural_translations_vi.length > 0 && (
     <p className="leading-relaxed text-text-secondary">
      <span className="font-bold text-text-primary">Cách nói tự nhiên:</span>{" "}
      {word.meaning.natural_translations_vi.join(", ")}
     </p>
    )}
    {word.meaning.register_vi && (
     <p className="text-sm text-text-secondary">Sắc thái: {word.meaning.register_vi}</p>
    )}
    {word.meaning.usage_domain_vi && (
     <p className="text-sm text-text-secondary">Phạm vi dùng: {word.meaning.usage_domain_vi}</p>
    )}
    {word.meaning.notes.map((note) => (
     <p key={note.text_vi} className="text-sm leading-relaxed text-text-muted">
      {note.text_vi}
     </p>
    ))}
   </div>
  </div>
 );
}
