import { Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveMemoryTipButton } from "@/features/hanzihome/memory-tips/SaveMemoryTipButton";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { PopularFontPreview } from "./PopularFontPreview";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";
import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

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
      <HanziText
       as="h2"
       size={compact ? "review" : "detail"}
       leading="none"
       tracking="normal"
       className="min-w-0"
      >
       {compact ? word.hanzi : <PopularFontPreview word={word.hanzi} />}
      </HanziText>
      <NativeMandarinSpeakButton text={word.hanzi} />
     </div>
     <PinyinText
      as="p"
      variant={compact ? "sectionTitle" : "pageTitle"}
      tone="accent"
      weight="black"
     >
      {word.pinyin}
      {word.meaning.hanviet ? ` · ${word.meaning.hanviet}` : ""}
     </PinyinText>
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
    <StudyInstructionText variant="caption" tone="muted" weight="bold">
     NGHĨA VÀ CÁCH DÙNG
    </StudyInstructionText>
    {word.meaning.short_definition_vi && (
     <StudyInstructionText variant="sectionTitle" tone="default" weight="black" leading="snug">
      {word.meaning.short_definition_vi}
     </StudyInstructionText>
    )}
    {word.meaning.meaning_vi && word.meaning.meaning_vi !== word.meaning.short_definition_vi && (
     <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
      {word.meaning.meaning_vi}
     </StudyInstructionText>
    )}
    {word.meaning.textbook_focus_vi && (
     <StudyInstructionText tone="secondary" leading="relaxed" className="max-w-[72ch]">
      {word.meaning.textbook_focus_vi}
     </StudyInstructionText>
    )}
    {word.meaning.natural_translations_vi.length > 0 && (
     <StudyInstructionText tone="secondary" leading="relaxed">
      <StudyInstructionText as="span" tone="default" weight="bold">
       Cách nói tự nhiên:
      </StudyInstructionText>{" "}
      {word.meaning.natural_translations_vi.join(", ")}
     </StudyInstructionText>
    )}
    {word.meaning.register_vi && (
     <StudyInstructionText variant="bodySmall" tone="secondary">
      Sắc thái: {word.meaning.register_vi}
     </StudyInstructionText>
    )}
    {word.meaning.usage_domain_vi && (
     <StudyInstructionText variant="bodySmall" tone="secondary">
      Phạm vi dùng: {word.meaning.usage_domain_vi}
     </StudyInstructionText>
    )}
    {word.meaning.notes.map((note) => (
     <StudyInstructionText key={note.text_vi} variant="bodySmall" tone="muted" leading="relaxed">
      {note.text_vi}
     </StudyInstructionText>
    ))}
   </div>
  </div>
 );
}
