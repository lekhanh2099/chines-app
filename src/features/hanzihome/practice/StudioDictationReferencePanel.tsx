"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Typography } from "@/components/ui/typography";
import {
 HanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";

type DictationReferenceMode = "hanzi" | "pinyin" | "meaning";

function entryHanzi(entry: ListeningTranscriptEntry) {
 const lines = entry.transcript.lines.map((line) => line.zh.trim()).filter(Boolean);
 return lines.length > 0 ? lines.join("\n") : entry.transcript.full.zh;
}

function entryPinyin(entry: ListeningTranscriptEntry) {
 const lines = entry.transcript.lines.map((line) => line.pinyin.trim()).filter(Boolean);
 return lines.length > 0 ? lines.join("\n") : entry.transcript.full.pinyin;
}

function entryMeaning(entry: ListeningTranscriptEntry) {
 const lines = entry.transcript.lines
  .map((line) => line.vi?.trim() ?? "")
  .filter(Boolean);
 return lines.length > 0 ? lines.join("\n") : (entry.transcript.full.vi ?? "");
}

export function StudioDictationReferencePanel({
 activeIndex,
 entries,
 isPlaybackActive,
 sourceLabel,
 titleVi,
 titleZh,
}: {
 activeIndex: number;
 entries: ListeningTranscriptEntry[];
 isPlaybackActive: boolean;
 sourceLabel: string;
 titleVi: string;
 titleZh: string;
}) {
 const [mode, setMode] = useState<DictationReferenceMode>("meaning");
 const visibleMode: DictationReferenceMode = isPlaybackActive ? "hanzi" : mode;

 return (
  <Card variant="section" padding="md" className="grid min-w-0 content-start gap-4">
   <div className="grid min-w-0 gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="warning" casing="natural">
      Bài đang học
     </Badge>
     <Typography variant="caption" tone="muted" weight="black" clamp="one">
      {sourceLabel}
     </Typography>
    </div>
    <div className="grid min-w-0 gap-1">
     <HanziText as="h2" size="large" weight="black" clamp="two">
      {titleZh}
     </HanziText>
     <Typography variant="bodySmall" tone="secondary" weight="semibold" clamp="two">
      {titleVi}
     </Typography>
    </div>
    <Typography variant="bodySmall" tone="muted" leading="relaxed">
     Mở chữ Hán, pinyin hoặc nghĩa tiếng Việt của toàn bài đang học.
    </Typography>
   </div>

   <SegmentedControl<DictationReferenceMode>
    value={visibleMode}
    items={[
     { key: "hanzi", label: "Bài khóa" },
     { key: "pinyin", label: "Pinyin" },
     { key: "meaning", label: "Nghĩa" },
    ]}
    onChange={setMode}
    aria-label="Nội dung tham chiếu chép chính tả"
   />

   <div className="grid min-w-0 gap-4 overflow-y-auto overscroll-contain xl:max-h-[60dvh]">
    {entries.map((entry, index) => {
     const active = index === activeIndex;
     const hanzi = entryHanzi(entry);
     const pinyin = entryPinyin(entry);
     const meaning = entryMeaning(entry);

     return (
      <div key={entry.id} className="grid min-w-0 gap-1.5">
       {entries.length > 1 ? (
        <Typography variant="caption" tone={active ? "accent" : "muted"} weight="black">
         Phần {index + 1}
        </Typography>
       ) : null}
       {visibleMode === "hanzi" ? (
        <HanziText
         as="p"
         size="medium"
         tone={active ? "accent" : "default"}
         leading="relaxed"
         wrapping="preWrap"
        >
         {hanzi}
        </HanziText>
       ) : null}
       {visibleMode === "pinyin" ? (
        <PinyinText
         variant="bodySmall"
         tone={active ? "accent" : "muted"}
         leading="relaxed"
         wrapping="preWrap"
        >
         {pinyin || "Phần này chưa có pinyin."}
        </PinyinText>
       ) : null}
       {visibleMode === "meaning" ? (
        <TranslationText
         variant="bodySmall"
         tone={active ? "secondary" : "muted"}
         leading="relaxed"
         wrapping="preWrap"
        >
         {meaning || "Phần này chưa có nghĩa tiếng Việt."}
        </TranslationText>
       ) : null}
      </div>
     );
    })}
   </div>
  </Card>
 );
}
