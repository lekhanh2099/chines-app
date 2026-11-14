"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PictureInPicture2, Search, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import { Card } from "@/components/ui/layout/card";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { BusinessChineseSection } from "./BusinessChineseSection";
import { SpeakableBusinessChineseText } from "./BusinessChineseText";
import { TextbookVocabularyPreview } from "./TextbookVocabularyPreview";
import type { BusinessChinesePipControls } from "./useBusinessChinesePip";

/** Owns the vocab tab search query; it persists across tab switches within the lesson. */
export function useBusinessChineseVocabSearch(vocab: TextbookLesson["vocab"]) {
 const [vocabSearchQuery, setVocabSearchQuery] = useState("");
 const filteredVocab = useMemo(() => {
  if (!vocabSearchQuery.trim()) return vocab;
  const q = vocabSearchQuery.trim().toLowerCase();
  return vocab.filter(
   (w) =>
    w.hanzi.toLowerCase().includes(q) ||
    w.pinyin.toLowerCase().includes(q) ||
    w.meaning.toLowerCase().includes(q) ||
    w.hanviet.toLowerCase().includes(q),
  );
 }, [vocab, vocabSearchQuery]);
 return { vocabSearchQuery, setVocabSearchQuery, filteredVocab };
}

/** The lesson "vocab" tab: search, review/PiP launchers and the vocabulary sections. */
export function BusinessChineseVocabView({
 lesson,
 vocabSearchQuery,
 onVocabSearchQueryChange,
 filteredVocab,
 displayMode,
 visibleSections,
 translations,
 canonicalVocabularyTableIds,
 pip,
 onActiveViewChange,
}: {
 lesson: TextbookLesson;
 vocabSearchQuery: string;
 onVocabSearchQueryChange: (query: string) => void;
 filteredVocab: TextbookLesson["vocab"];
 displayMode: LessonDisplayMode;
 visibleSections: TextbookLesson["sections"];
 translations: ReadonlyMap<string, string>;
 canonicalVocabularyTableIds: readonly string[];
 pip: BusinessChinesePipControls;
 onActiveViewChange: (value: string) => void;
}) {
 const t = useTranslations("BusinessChinese");
 const { isPipOpen, isInAppFloatingOpen, pipMode, handleTogglePip } = pip;

 return (
  <div data-textbook-document className="grid min-w-0 gap-3">
   {lesson.vocab.length > 0 ? (
    <Card
     variant="subtle"
     padding="sm"
     className="flex min-w-0 flex-wrap items-center justify-between gap-2"
    >
     <div className="flex min-w-0 items-center gap-2">
      <Typography
       variant="caption"
       tone="muted"
       weight="bold"
       tracking="wide"
       transform="uppercase"
       className="hidden sm:inline"
      >
       {t("vocabularyPreview.eyebrow")}
      </Typography>
      <Badge variant="default" casing="natural">
       {lesson.vocab.length} từ
      </Badge>
      <div className="relative min-w-[140px] sm:min-w-[180px]">
       <Input
        type="search"
        density="compact"
        adornment="start"
        value={vocabSearchQuery}
        onChange={(e) => onVocabSearchQueryChange(e.target.value)}
        placeholder="Tìm từ vựng..."
       />
       <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {vocabSearchQuery ? (
       <Typography variant="caption" tone="secondary">
        ({filteredVocab.length} kết quả)
       </Typography>
      ) : null}
     </div>

     <div className="flex flex-wrap items-center gap-1.5">
      <Button
       type="button"
       size="compact"
       variant="default"
       onClick={() => onActiveViewChange("review")}
      >
       {t("vocabReview.startReview")}
      </Button>
      <Button
       type="button"
       size="compact"
       variant={
        (isPipOpen || isInAppFloatingOpen) && pipMode === "dictation" ? "active" : "outline"
       }
       onClick={() => handleTogglePip("dictation")}
       title="Mở cửa sổ nổi nghe chép từ vựng (hỗ trợ nghe tiếng Trung hoặc nghe tiếng Việt)"
      >
       <Volume2 className="size-3.5" />
       <span>Chép từ vựng</span>
      </Button>
      <Button
       type="button"
       size="compact"
       variant={(isPipOpen || isInAppFloatingOpen) && pipMode === "vocab" ? "active" : "outline"}
       onClick={() => handleTogglePip("vocab")}
       title={t("vocabReview.pipTooltip")}
      >
       <PictureInPicture2 className="size-3.5" />
       <span>{t("vocabReview.pipButton")}</span>
      </Button>
     </div>
    </Card>
   ) : null}

   {filteredVocab.length === 0 && vocabSearchQuery ? (
    <Card variant="subtle" padding="lg" className="text-center">
     <Typography variant="bodySmall" tone="muted">
      Không tìm thấy từ vựng nào khớp với &ldquo;{vocabSearchQuery}&rdquo;
     </Typography>
    </Card>
   ) : null}

   {filteredVocab.length > 0 && canonicalVocabularyTableIds.length === 0 ? (
    <div className="grid gap-2 sm:grid-cols-2">
     {filteredVocab.map((word) => (
      <VocabPreviewRow
       key={word.id}
       hanzi={word.hanzi}
       pinyin={word.pinyin}
       hanviet={displayMode.showMeaning ? word.hanviet : ""}
       category={word.pos}
       meaning={displayMode.showMeaning ? word.meaning : ""}
       rawMeaning={word.meaning}
       rawHanviet={word.hanviet}
       header={
        <SpeakableBusinessChineseText
         pronunciationId={word.id}
         text={word.hanzi}
         sourcePinyin={word.pinyin}
         displayMode={displayMode}
         variant="body"
        />
       }
      />
     ))}
    </div>
   ) : null}

   {visibleSections.map((section) => (
    <BusinessChineseSection
     key={section.id}
     section={section}
     displayMode={displayMode}
     translations={translations}
     canonicalVocabularyTableIds={canonicalVocabularyTableIds}
     vocabularyPreview={
      section.blocks.some((block) => block.id === canonicalVocabularyTableIds[0]) ? (
       <TextbookVocabularyPreview vocabulary={filteredVocab} displayMode={displayMode} />
      ) : undefined
     }
    />
   ))}
  </div>
 );
}
