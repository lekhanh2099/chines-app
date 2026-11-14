"use client";

import { PictureInPicture2, Search, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { UniversalPipMode } from "@/features/hanzihome/components/review/UniversalAmbientPip";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { formatContextualReadingPinyin } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import {
 analyzeDailyReadingText,
 type DailyReadingVocabularyItem,
} from "@/features/daily-reading/components/daily-reading-library-utils";

type DailyReadingVocabularyTabProps = {
 vocabItems: readonly DailyReadingVocabularyItem[];
 filteredVocabItems: readonly DailyReadingVocabularyItem[];
 vocabSearchQuery: string;
 onVocabSearchQueryChange(value: string): void;
 displayMode: LessonDisplayMode;
 isPipActive: boolean;
 pipMode: UniversalPipMode;
 onTogglePip(mode: UniversalPipMode): void;
};

export function DailyReadingVocabularyTab({
 vocabItems,
 filteredVocabItems,
 vocabSearchQuery,
 onVocabSearchQueryChange,
 displayMode,
 isPipActive,
 pipMode,
 onTogglePip,
}: DailyReadingVocabularyTabProps) {
 const t = useTranslations("DailyReading");
 return (
  <div className="grid gap-3">
   <Card
    variant="subtle"
    padding="sm"
    className="flex min-w-0 flex-wrap items-center justify-between gap-2.5"
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
      {t("tabs.vocabulary")}
     </Typography>
     <Badge variant="default" casing="natural">
      {vocabItems.length} từ
     </Badge>
     <div className="relative min-w-[140px] sm:min-w-[200px]">
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
       ({filteredVocabItems.length} kết quả)
      </Typography>
     ) : null}
    </div>

    <div className="flex flex-wrap items-center gap-1.5">
     <Button
      type="button"
      size="compact"
      variant={isPipActive && pipMode === "dictation" ? "active" : "outline"}
      onClick={() => onTogglePip("dictation")}
      title="Mở cửa sổ nổi nghe chép từ vựng (hỗ trợ nghe tiếng Trung hoặc nghe tiếng Việt)"
     >
      <Volume2 className="size-3.5" />
      <span>Chép từ vựng</span>
     </Button>
     <Button
      type="button"
      size="compact"
      variant={isPipActive && pipMode === "vocab" ? "active" : "outline"}
      onClick={() => onTogglePip("vocab")}
      title="Mở cửa sổ nổi ôn tập từ vựng & bài tập"
     >
      <PictureInPicture2 className="size-3.5" />
      <span>Mở PiP</span>
     </Button>
    </div>
   </Card>

   {filteredVocabItems.length === 0 && vocabSearchQuery ? (
    <Card variant="subtle" padding="lg" className="text-center">
     <Typography variant="bodySmall" tone="muted">
      Không tìm thấy từ vựng nào khớp với &ldquo;{vocabSearchQuery}&rdquo;
     </Typography>
    </Card>
   ) : null}

   <div className="grid gap-2 sm:grid-cols-2">
    {filteredVocabItems.map((item) => {
     const itemPronunciation = analyzeDailyReadingText(item.hanzi);
     const resolvedPinyin =
      itemPronunciation !== null ? formatContextualReadingPinyin(itemPronunciation) : "";
     return (
      <VocabPreviewRow
       key={item.id}
       hanzi={item.hanzi}
       pinyin={resolvedPinyin}
       hanviet=""
       category={item.categoryVi}
       meaning={displayMode.showMeaning ? item.meaningVi : ""}
       rawMeaning={item.meaningVi}
       header={
        <div className="flex min-w-0 flex-wrap items-center gap-2">
         <HanziText as="span" size="card" weight="black" leading="none">
          {item.hanzi}
         </HanziText>
         {displayMode.showPinyin && resolvedPinyin ? (
          <PinyinText as="span" tone="accent" weight="bold">
           {resolvedPinyin}
          </PinyinText>
         ) : null}
         <MandarinSpeakButton text={item.hanzi} />
        </div>
       }
      >
       {displayMode.showMeaning && item.meaningInContextVi ? (
        <Typography variant="caption" tone="muted">
         {t("generated.vocabulary.inContext", { meaning: item.meaningInContextVi })}
        </Typography>
       ) : null}
      </VocabPreviewRow>
     );
    })}
   </div>
  </div>
 );
}
