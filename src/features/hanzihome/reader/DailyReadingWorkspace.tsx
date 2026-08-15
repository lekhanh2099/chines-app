"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 ReaderHanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import {
 createTranslationAttempt,
 scoreTranslationAttempt,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";

import { Badge } from "@/components/ui/badge";
import { ReaderDocumentStudy } from "./ReaderDocumentStudy";
import { ReaderExercisePanel } from "./ReaderExercisePanel";
import type { ReaderDocumentResource } from "./reader-content-api";
import type { ReaderSessionState } from "./reader-session";
import type { ReaderDocumentRow } from "./reader.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

const dailyTabSchema = z.enum([
 "reader",
 "questions",
 "vocabulary",
 "grammar",
 "translation",
 "source",
]);
type DailyTab = z.output<typeof dailyTabSchema>;

const dailyTabs: ReadonlyArray<{ id: DailyTab; label: string }> = [
 { id: "reader", label: "阅读" },
 { id: "questions", label: "问题" },
 { id: "vocabulary", label: "词汇" },
 { id: "grammar", label: "语法" },
 { id: "translation", label: "翻译" },
 { id: "source", label: "来源" },
];

function metadataString(resource: ReaderDocumentResource, key: string) {
 const value = resource.document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

function documentMetadataString(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

function metadataNumber(resource: ReaderDocumentResource, key: string) {
 const value = resource.document.source_metadata[key];
 return typeof value === "number" ? value : null;
}

function DailyTranslationPanel({ resource }: { resource: ReaderDocumentResource }) {
 const segments = useMemo(
  () =>
   resource.paragraphs
    .filter((paragraph) => paragraph.zh.trim() && paragraph.vi.trim())
    .map((paragraph, index) => ({
     id: paragraph.id,
     order: index + 1,
     zh: paragraph.zh,
     pinyin: paragraph.pinyin,
     vi: paragraph.vi,
    })),
  [resource.paragraphs],
 );
 const [activeIndex, setActiveIndex] = useState(0);
 const [direction, setDirection] = useState<TranslationDirection>("zh-vi");
 const [draft, setDraft] = useState("");
 const [checked, setChecked] = useState(false);
 const [error, setError] = useState("");
 const startedAtRef = useRef<number | null>(null);
 const segment = segments[activeIndex];

 if (segment === undefined) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     Bài Daily Reading này chưa có đủ đoạn song ngữ để luyện dịch.
    </Typography>
   </Card>
  );
 }

 const sourceText = direction === "zh-vi" ? segment.zh : segment.vi;
 const referenceText = direction === "zh-vi" ? segment.vi : segment.zh;
 const score = checked ? scoreTranslationAttempt(segment, direction, draft) : null;

 const check = () => {
  const attempt = createTranslationAttempt(
   segment,
   direction,
   draft,
   startedAtRef.current === null ? null : Math.max(0, Date.now() - startedAtRef.current),
  );
  startedAtRef.current = null;
  setError("");
  setChecked(true);
  void savePracticeAttempt({
   surface: "translation",
   contentId: `daily:${attempt.segmentId}`,
   direction,
   answer: { answer: attempt.answer, reference: referenceText },
   scorePercent: attempt.score,
   responseMs: attempt.responseMs,
  }).catch((saveError: Error) => setError(saveError.message));
 };

 const move = (nextIndex: number) => {
  setActiveIndex(Math.min(segments.length - 1, Math.max(0, nextIndex)));
  setDraft("");
  setChecked(false);
  startedAtRef.current = null;
 };

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <Typography as="h3" variant="sectionTitle" weight="black">
      Luyện dịch hai chiều
     </Typography>
     <Badge>
      {activeIndex + 1}/{segments.length} đoạn
     </Badge>
    </div>
    <div className="grid grid-cols-2 gap-2" aria-label="Hướng dịch Daily Reading">
     <Button
      type="button"
      variant={direction === "zh-vi" ? "active" : "outline"}
      onClick={() => {
       setDirection("zh-vi");
       setChecked(false);
      }}
     >
      中文 → Tiếng Việt
     </Button>
     <Button
      type="button"
      variant={direction === "vi-zh" ? "active" : "outline"}
      onClick={() => {
       setDirection("vi-zh");
       setChecked(false);
      }}
     >
      Tiếng Việt → 中文
     </Button>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Đoạn dịch Daily Reading">
     {segments.map((candidate, index) => (
      <Button
       key={candidate.id}
       type="button"
       size="sm"
       variant={index === activeIndex ? "active" : "outline"}
       onClick={() => move(index)}
      >
       {candidate.order}
      </Button>
     ))}
    </div>
   </Card>
   <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <Card variant="section" padding="md" className="grid min-w-0 gap-3">
     <Typography variant="caption" tone="muted" weight="black">
      Đoạn {segment.order}
     </Typography>
     {direction === "zh-vi" ? (
      <ReaderHanziText displayMode={DEFAULT_LESSON_DISPLAY_MODE} wrapping="preWrap">
       {sourceText}
      </ReaderHanziText>
     ) : (
      <Typography variant="body" wrapping="preWrap">
       {sourceText}
      </Typography>
     )}
     <PinyinText variant="bodySmall" tone="accent">
      {segment.pinyin}
     </PinyinText>
    </Card>
    <Card variant="subtle" padding="md" className="grid min-w-0 gap-3">
     <Typography as="h3" variant="cardTitle" weight="black">
      Bản dịch của bạn
     </Typography>
     <Textarea
      value={draft}
      onChange={(event) => {
       setDraft(event.target.value);
       setChecked(false);
       if (event.target.value.trim() && startedAtRef.current === null) {
        startedAtRef.current = Date.now();
       }
      }}
      placeholder={direction === "zh-vi" ? "Nhập bản dịch tiếng Việt…" : "Nhập câu tiếng Trung…"}
      aria-label="Câu trả lời dịch Daily Reading"
      className="min-h-36"
     />
     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!draft.trim()} onClick={check}>
       Kiểm tra
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex === 0}
       onClick={() => move(activeIndex - 1)}
      >
       Đoạn trước
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex >= segments.length - 1}
       onClick={() => move(activeIndex + 1)}
      >
       Đoạn sau
      </Button>
     </div>
     {checked ? (
      <div className="grid gap-2 rounded-control border border-border bg-surface p-3">
       <Typography variant="bodySmall" weight="black">
        Điểm: {score ?? 0}/100
       </Typography>
       <TranslationText variant="bodySmall" tone="muted">
        Đáp án tham chiếu: {referenceText}
       </TranslationText>
      </div>
     ) : null}
     {error ? (
      <Typography variant="caption" tone="danger">
       {error}
      </Typography>
     ) : null}
    </Card>
   </div>
  </div>
 );
}

export function DailyReadingWorkspace({
 initialDocuments,
 initialResource,
 initialLesson,
}: {
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
 initialLesson: HanziHomeLesson | null;
}) {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const requestedDocumentId = searchParams.get("document") ?? "";
 const parsedTab = dailyTabSchema.safeParse(searchParams.get("tab"));
 const activeTab: DailyTab = parsedTab.success ? parsedTab.data : "reader";
 const latest = initialDocuments[0];
 const resource = requestedDocumentId.length > 0 ? initialResource : null;
 const [questionAnswers, setQuestionAnswers] = useState<ReaderSessionState["answers"]>({});

 const setQuery = (values: { document?: string; tab?: DailyTab }) => {
  const next = new URLSearchParams(searchParams.toString());
  if (values.document === undefined) next.delete("document");
  else next.set("document", values.document);
  if (values.tab === undefined || values.tab === "reader") next.delete("tab");
  else next.set("tab", values.tab);
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };

 return (
  <div className="grid min-w-0 gap-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <Typography as="h1" variant="pageTitle" weight="black">
      Daily Reading
     </Typography>
     <Typography variant="body" tone="muted">
      Đọc bài mới, luyện câu hỏi, từ vựng, ngữ pháp và dịch theo flow Hanzi Studio.
     </Typography>
    </div>
    <Button type="button" variant="outline" asChild>
     <Link href="/settings?section=reading" prefetch={false}>
      Cài đặt đọc
     </Link>
    </Button>
   </div>

   {requestedDocumentId.length === 0 ? (
    <Card variant="section" padding="md" className="grid gap-4">
     <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-3">
      <div className="grid gap-1">
       <Typography variant="overline" tone="accent" weight="black">
        Bài mới nhất
       </Typography>
       <Typography as="h2" variant="sectionTitle" weight="black">
        Học theo ngày
       </Typography>
      </div>
      <Badge>{initialDocuments.length} bài</Badge>
     </div>
     {latest === undefined ? (
      <Typography variant="bodySmall" tone="muted">
       Chưa có bài Daily Reading trong static JSON.
      </Typography>
     ) : (
      <Button
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant="surfaceCard"
       onClick={() => setQuery({ document: latest.id })}
      >
       <div className="flex flex-wrap gap-2">
        {documentMetadataString(latest, "published_date") ? (
         <Badge>{documentMetadataString(latest, "published_date")}</Badge>
        ) : null}
        <Badge>{documentMetadataString(latest, "level") ?? "Daily"}</Badge>
       </div>
       <Typography as="span" variant="cardTitle" weight="black" lang="zh-CN" className="text-left">
        {latest.title_zh}
       </Typography>
       <Typography as="span" variant="bodySmall" tone="muted" className="text-left">
        {latest.title_vi}
       </Typography>
       <Typography as="span" variant="caption" tone="accent" weight="bold">
        Đọc ngay →
       </Typography>
      </Button>
     )}
    </Card>
   ) : null}

   {requestedDocumentId.length > 0 && resource === null ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="danger">
      Không tìm thấy bài Daily Reading trong static package.
     </Typography>
    </Card>
   ) : null}
   {resource ? (
    <div className="grid min-w-0 gap-3">
     <Card variant="section" padding="md" className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="grid min-w-0 gap-1">
        <Button
         type="button"
         variant="ghost"
         size="sm"
         className="w-fit"
         onClick={() => setQuery({})}
        >
         ← Daily Reading
        </Button>
        <Typography as="h2" variant="sectionTitle" weight="black" lang="zh-CN">
         {resource.document.title_zh}
        </Typography>
        <Typography variant="bodySmall" tone="muted">
         {resource.document.title_vi}
        </Typography>
       </div>
       <div className="flex flex-wrap gap-2">
        {metadataString(resource, "published_date") ? (
         <Badge>{metadataString(resource, "published_date")}</Badge>
        ) : null}
        {metadataString(resource, "topic") ? (
         <Badge>{metadataString(resource, "topic")}</Badge>
        ) : null}
        {metadataString(resource, "level") ? (
         <Badge>{metadataString(resource, "level")}</Badge>
        ) : null}
        {metadataNumber(resource, "estimated_minutes") ? (
         <Badge>{metadataNumber(resource, "estimated_minutes")} phút</Badge>
        ) : null}
       </div>
      </div>
      <div
       className="flex min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-soft"
       role="tablist"
       aria-label="Daily Reading sections"
      >
       {dailyTabs.map((tab) => (
        <Button
         key={tab.id}
         type="button"
         size="sm"
         role="tab"
         aria-selected={activeTab === tab.id}
         variant={activeTab === tab.id ? "active" : "outline"}
         onClick={() => setQuery({ document: resource.document.id, tab: tab.id })}
        >
         {tab.label}
        </Button>
       ))}
      </div>
     </Card>

     {activeTab === "reader" ? (
      <ReaderDocumentStudy key={resource.document.id} resource={resource} stateOwner="daily" />
     ) : null}
     {activeTab === "questions" ? (
      <ReaderExercisePanel
       resource={resource}
       answers={questionAnswers}
       onAnswer={(itemId, answer) => {
        setQuestionAnswers((current) => ({ ...current, [itemId]: answer }));
        void savePracticeAttempt({
         surface: "reader",
         contentId: `daily:${itemId}`,
         direction: null,
         answer: { answer: answer.answer, completed: answer.completed },
         scorePercent: answer.score === null ? null : Math.round(answer.score * 100),
         responseMs: answer.responseMs,
        });
       }}
      />
     ) : null}
     {activeTab === "vocabulary" ? (
      <Card variant="section" padding="md" className="grid gap-3">
       <Typography as="h3" variant="sectionTitle" weight="black">
        Từ vựng
       </Typography>
       <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {resource.vocabulary.map((vocabulary) => (
         <div key={vocabulary.id} className="grid gap-1 rounded-control border border-border p-3">
          <Typography variant="cardTitle" lang="zh-CN" weight="black">
           {vocabulary.word}
          </Typography>
          <PinyinText variant="bodySmall" tone="accent">
           {vocabulary.pinyin}
          </PinyinText>
          <Typography variant="caption" tone="muted">
           {vocabulary.meaning}
          </Typography>
         </div>
        ))}
       </div>
      </Card>
     ) : null}
     {activeTab === "grammar" ? (
      <Card variant="section" padding="md" className="grid gap-3">
       <Typography as="h3" variant="sectionTitle" weight="black">
        Ngữ pháp
       </Typography>
       {initialLesson?.grammar.map((grammar) => (
        <div key={grammar.id} className="grid gap-1 rounded-control border border-border p-3">
         <Typography variant="cardTitle" weight="black">
          {grammar.title}
         </Typography>
         <Typography variant="bodySmall" tone="muted">
          {grammar.core}
         </Typography>
         {grammar.examplesParsed.slice(0, 2).map((example) => (
          <Typography key={example.id} variant="caption" lang="zh-CN">
           {example.zh} · {example.vi}
          </Typography>
         ))}
        </div>
       ))}
       {initialLesson?.grammar.length === 0 ? (
        <Typography variant="bodySmall" tone="muted">
         Bài Daily này chưa có ngữ pháp trong static package.
        </Typography>
       ) : null}
      </Card>
     ) : null}
     {activeTab === "translation" ? <DailyTranslationPanel resource={resource} /> : null}
     {activeTab === "source" ? (
      <Card variant="subtle" padding="md" className="grid gap-2">
       <Typography as="h3" variant="sectionTitle" weight="black">
        Nguồn và ghi chú biên soạn
       </Typography>
       <Typography variant="bodySmall" tone="muted">
        {metadataString(resource, "adaptation_notice_vi") ??
         "Nội dung static đã được review trước khi đóng gói."}
       </Typography>
       <Typography variant="caption" tone="muted">
        {metadataString(resource, "source_file") ?? "Hanzi Studio static source"}
       </Typography>
      </Card>
     ) : null}
    </div>
   ) : null}
  </div>
 );
}
