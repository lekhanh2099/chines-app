import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 PinyinText,
 ReaderHanziText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import {
 translationReferenceText,
 translationSourceText,
 type TranslationDirection,
 type TranslationSegment,
} from "@/features/hanzihome/practice/translation-practice";

export function ReaderTranslationPracticePanel({
 activeIndex,
 checked,
 completedCount,
 direction,
 displayMode,
 draft,
 score,
 segment,
 segments,
 onCheck,
 onDirectionChange,
 onDraftChange,
 onNext,
 onPrevious,
 onSelect,
}: {
 activeIndex: number;
 checked: boolean;
 completedCount: number;
 direction: TranslationDirection;
 displayMode: LessonDisplayMode;
 draft: string;
 score: number | null;
 segment: TranslationSegment | undefined;
 segments: ReadonlyArray<TranslationSegment>;
 onCheck: () => void;
 onDirectionChange: (direction: TranslationDirection) => void;
 onDraftChange: (value: string) => void;
 onNext: () => void;
 onPrevious: () => void;
 onSelect: (segmentId: string) => void;
}) {
 if (segment === undefined) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     Bài này chưa có đủ bản dịch để luyện.
    </Typography>
   </Card>
  );
 }

 const sourceText = translationSourceText(segment, direction);
 const referenceText = translationReferenceText(segment, direction);

 return (
  <Card variant="section" padding="md" className="grid min-w-0 gap-4">
   <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
    <div className="grid min-w-0 gap-2">
     <Badge variant="warning" className="w-fit" casing="natural">
      Luyện dịch hai chiều
     </Badge>
     <Typography as="h2" variant="cardTitle" weight="black">
      Dịch theo từng đoạn, rồi đối chiếu
     </Typography>
     <Typography variant="bodySmall" tone="muted" leading="relaxed">
      Trung → Việt ưu tiên bám nghĩa và quan hệ logic. Việt → Trung ưu tiên cấu trúc câu, trật tự
      thành phần và chữ Hán chính xác.
     </Typography>
    </div>
    <Badge casing="natural">
     {completedCount}/{segments.length} đoạn đã đối chiếu
    </Badge>
   </div>

   <SegmentedControl<TranslationDirection>
    value={direction}
    items={[
     { key: "zh-vi", label: "中文 → Tiếng Việt" },
     { key: "vi-zh", label: "Tiếng Việt → 中文" },
    ]}
    onChange={onDirectionChange}
    aria-label="Hướng dịch Reader"
   />

   <div
    className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10"
    aria-label="Đoạn dịch Reader"
   >
    {segments.map((candidate, index) => (
     <Button
      key={candidate.id}
      type="button"
      size="sm"
      variant={candidate.id === segment.id ? "active" : "outline"}
      aria-current={candidate.id === segment.id ? "step" : undefined}
      onClick={() => onSelect(candidate.id)}
     >
      {index + 1}
     </Button>
    ))}
   </div>

   <Card variant="default" padding="md" className="grid min-w-0 gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <Typography variant="caption" weight="black">
      Đoạn {segment.order}
     </Typography>
     <Typography variant="caption" tone="muted">
      {Array.from(sourceText).length} ký tự
     </Typography>
    </div>

    {direction === "zh-vi" ? (
     <ReaderHanziText displayMode={displayMode} size="lg" leading="relaxed" wrapping="preWrap">
      {sourceText}
     </ReaderHanziText>
    ) : (
     <TranslationText variant="body" leading="relaxed" wrapping="preWrap">
      {sourceText}
     </TranslationText>
    )}

    {direction === "zh-vi" && segment.pinyin ? (
     <Card asChild variant="subtle" padding="none">
      <details className="grid gap-2">
       <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <Typography as="span" variant="bodySmall" tone="muted" weight="black">
         Xem pinyin khi bí
        </Typography>
       </summary>
       <PinyinText
        variant="bodySmall"
        tone="accent"
        weight="semibold"
        wrapping="preWrap"
        className="border-t border-border-default px-3 pb-3"
       >
        {segment.pinyin}
       </PinyinText>
      </details>
     </Card>
    ) : null}
   </Card>

   <div className="grid min-w-0 gap-2">
    <Typography
     as="label"
     htmlFor={`reader-translation-${segment.id}`}
     variant="label"
     weight="black"
    >
     Bản dịch của tôi
    </Typography>
    <Textarea
     id={`reader-translation-${segment.id}`}
     value={draft}
     onChange={(event) => onDraftChange(event.target.value)}
     placeholder={
      direction === "zh-vi"
       ? "Dịch sát nghĩa, giữ rõ chủ ngữ, quan hệ logic và sắc thái…"
       : "Viết lại bằng tiếng Trung tự nhiên…"
     }
     aria-label="Câu trả lời dịch Reader"
     rows={7}
     autoCapitalize="off"
     autoCorrect="off"
    />
   </div>

   <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
    <Button type="button" disabled={!draft.trim()} onClick={onCheck}>
     Đối chiếu bản dịch
    </Button>
    <Button type="button" variant="ghost" disabled={activeIndex === 0} onClick={onPrevious}>
     ← Đoạn trước
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={activeIndex >= segments.length - 1}
     onClick={onNext}
    >
     Đoạn sau →
    </Button>
   </div>

   {checked ? (
    <Card variant="subtle" padding="md" className="grid gap-3">
     <div className="flex flex-wrap items-baseline justify-between gap-2">
      <Typography variant="cardTitle" tone="accent" weight="black">
       Mức khớp: {score ?? 0}/100
      </Typography>
      <Typography variant="caption" tone="muted">
       Dùng đáp án tham chiếu để tự rà cách diễn đạt, không coi điểm là đáp án duy nhất.
      </Typography>
     </div>
     <div className="grid gap-1">
      <Typography variant="caption" tone="muted" weight="black" transform="uppercase">
       Đáp án tham chiếu
      </Typography>
      {direction === "vi-zh" ? (
       <ReaderHanziText displayMode={displayMode} size="md" leading="relaxed" wrapping="preWrap">
        {referenceText}
       </ReaderHanziText>
      ) : (
       <TranslationText variant="bodySmall" leading="relaxed" wrapping="preWrap">
        {referenceText}
       </TranslationText>
      )}
      {direction === "vi-zh" && segment.pinyin ? (
       <PinyinText variant="caption" tone="muted" wrapping="preWrap">
        {segment.pinyin}
       </PinyinText>
      ) : null}
     </div>
    </Card>
   ) : null}
  </Card>
 );
}
