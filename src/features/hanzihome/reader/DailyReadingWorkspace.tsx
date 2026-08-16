"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileText, Settings } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 HanziText,
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
 { id: "reader", label: "Đọc bài" },
 { id: "questions", label: "Câu hỏi" },
 { id: "vocabulary", label: "Từ vựng" },
 { id: "grammar", label: "Ngữ pháp" },
 { id: "translation", label: "Bản dịch" },
 { id: "source", label: "Nguồn" },
];

function metadataString(resource: ReaderDocumentResource, key: string) {
 const value = resource.document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

function documentMetadataString(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

function documentMetadataNumber(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 return typeof value === "number" ? value : null;
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
     Bài này chưa có đủ đoạn song ngữ để luyện dịch.
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
    <SegmentedControl<TranslationDirection>
     value={direction}
     items={[
      { key: "zh-vi", label: "Tiếng Trung → Tiếng Việt" },
      { key: "vi-zh", label: "Tiếng Việt → Tiếng Trung" },
     ]}
     onChange={(value) => {
      setDirection(value);
      setDraft("");
      setChecked(false);
      setError("");
      startedAtRef.current = null;
     }}
     aria-label="Hướng dịch Daily Reading"
    />
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
      <ReaderHanziText
       displayMode={DEFAULT_LESSON_DISPLAY_MODE}
       size="lg"
       leading="relaxed"
       wrapping="preWrap"
      >
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
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography variant="bodySmall" weight="black">
        Điểm: {score ?? 0}/100
       </Typography>
       <TranslationText variant="bodySmall" tone="muted">
        Đáp án tham chiếu: {referenceText}
       </TranslationText>
      </Card>
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
 const grammarItems = initialLesson?.grammar ?? [];
 const [questionAnswers, setQuestionAnswers] = useState<ReaderSessionState["answers"]>({});

 const setQuery = (values: { document?: string; tab?: DailyTab }) => {
  const next = new URLSearchParams(searchParams.toString());
  if (values.document === undefined) next.delete("document");
  else next.set("document", values.document);
  if (values.tab === undefined || values.tab === "reader") next.delete("tab");
  else next.set("tab", values.tab);
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };

 const openSample = () => {
  if (latest !== undefined) setQuery({ document: latest.id });
 };

 const sampleTopic =
  latest === undefined
   ? ""
   : documentMetadataString(latest, "topic") === "culture"
     ? "Văn hóa"
     : (documentMetadataString(latest, "topic") ?? "Bài mẫu");

 return (
  <div className="grid min-w-0 gap-6">
   {requestedDocumentId.length === 0 ? (
    <div className="flex min-w-0 items-start gap-3">
     <IconTile tone="info" size="md">
      <FileText />
     </IconTile>
     <PageHeader
      className="flex-1"
      eyebrow="Bài đọc hôm nay"
      title="Bài đọc tiếng Trung mỗi ngày"
      description="Thư viện các bài đọc hằng ngày đã được kiểm tra và lưu trong HanziHome."
      actions={
       <>
        <Button type="button" variant="outline" size="toolbar" asChild>
         <Link href="/settings?section=reading" prefetch={false}>
          <Settings data-icon="inline-start" />
          Cài đặt đọc
         </Link>
        </Button>
        <Button type="button" size="toolbar" disabled={latest === undefined} onClick={openSample}>
         <FileText data-icon="inline-start" />
         Mở bài mẫu
        </Button>
       </>
      }
     />
    </div>
   ) : null}

   {requestedDocumentId.length === 0 ? (
    <>
     <EmptyState
      surface="accent"
      size="spacious"
      className="min-h-56"
      icon={<FileText />}
      title="Chưa có bài đọc đã thu thập"
      description="HanziHome hiện chỉ hiển thị thư viện bài đọc đã được đóng gói và kiểm tra."
      actions={
       <Button type="button" size="toolbar" disabled={latest === undefined} onClick={openSample}>
        <FileText data-icon="inline-start" />
        Mở bài mẫu
       </Button>
      }
     />

     {latest !== undefined ? (
      <section className="grid gap-3" aria-labelledby="daily-sample-heading">
       <div className="grid gap-1">
        <Typography variant="overline" tone="accent" weight="black">
         Bài mẫu offline
        </Typography>
        <Typography as="h2" variant="sectionTitle" id="daily-sample-heading" weight="black">
         Dùng thử Reader, không phải bài đã thu thập
        </Typography>
       </div>
       <Card variant="interactive" padding="md" className="min-h-56 overflow-hidden">
        <Link
         href={`${pathname}?document=${encodeURIComponent(latest.id)}`}
         prefetch={false}
         className="group relative grid min-h-48 content-between gap-3"
        >
         <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -bottom-7 font-hanzi text-[7rem] font-normal leading-none text-text-muted/10"
         >
          {latest.title_zh.match(/\p{Script=Han}/u)?.[0] ?? "读"}
         </span>
         <div className="relative flex flex-wrap gap-1.5">
          <Badge variant="success" size="sm" casing="natural">
           Bài mẫu
          </Badge>
          <Badge variant="info" size="sm" casing="natural">
           {documentMetadataString(latest, "level") ?? "Daily"}
          </Badge>
          <Badge variant="info" size="sm" casing="natural">
           {sampleTopic}
          </Badge>
         </div>
         <div className="relative grid min-w-0 gap-1">
          <Typography variant="caption" tone="muted" weight="bold">
           {documentMetadataString(latest, "published_date") ?? "Bài mẫu"}
           {documentMetadataNumber(latest, "estimated_minutes") !== null
            ? ` · ${documentMetadataNumber(latest, "estimated_minutes")} phút`
            : ""}
          </Typography>
          <HanziText as="h3" size="card" className="min-w-0" clamp="two">
           {latest.title_zh}
          </HanziText>
          <Typography as="p" variant="bodySmall" tone="secondary" clamp="two">
           {latest.title_vi}
          </Typography>
         </div>
         <div className="relative flex items-center gap-1">
          <Typography as="span" variant="bodySmall" tone="accent" weight="bold">
           Đọc bài
          </Typography>
          <ChevronRight
           className="text-primary transition-transform group-hover:translate-x-0.5"
           aria-hidden="true"
          />
         </div>
        </Link>
       </Card>
      </section>
     ) : null}
    </>
   ) : null}

   {requestedDocumentId.length > 0 && resource === null ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="danger">
      Không tìm thấy bài đọc hằng ngày trong dữ liệu hiện có.
     </Typography>
    </Card>
   ) : null}
   {resource ? (
    <div className="grid min-w-0 gap-3">
     <div className="grid gap-3 border-b border-border-default pb-4 sm:pb-5">
      <Button
       type="button"
       variant="ghost"
       size="sm"
       className="w-fit"
       onClick={() => setQuery({})}
      >
       ← Danh sách bài hằng ngày
      </Button>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
       <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap gap-2">
         {metadataString(resource, "level") ? (
          <Badge variant="warning" casing="natural">
           {metadataString(resource, "level")}
          </Badge>
         ) : null}
         {metadataString(resource, "topic") ? (
          <Badge variant="info" casing="natural">
           {metadataString(resource, "topic")}
          </Badge>
         ) : null}
        </div>
        <HanziText as="h2" size="card" className="text-2xl sm:text-3xl" weight="black">
         {resource.document.title_zh}
        </HanziText>
        <Typography variant="bodySmall" tone="muted">
         {resource.document.title_pinyin ? (
          <PinyinText as="span" variant="caption" tone="accent">
           {resource.document.title_pinyin}
          </PinyinText>
         ) : null}
         {resource.document.title_pinyin ? " · " : ""}
         {resource.document.title_vi}
        </Typography>
       </div>
       <div className="flex flex-wrap justify-end gap-2">
        {metadataString(resource, "published_date") ? (
         <Badge>{metadataString(resource, "published_date")}</Badge>
        ) : null}
        {metadataNumber(resource, "estimated_minutes") ? (
         <Badge>{metadataNumber(resource, "estimated_minutes")} phút</Badge>
        ) : null}
       </div>
      </div>
     </div>

     <Tabs
      value={activeTab}
      items={[...dailyTabs].map((tab) => ({ key: tab.id, label: tab.label }))}
      onValueChange={(tab) => setQuery({ document: resource.document.id, tab })}
      aria-label="Các phần của bài đọc hằng ngày"
     >
      <TabsContent value={activeTab} className="pt-4 sm:pt-5">
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
         {resource.vocabulary.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
           {resource.vocabulary.map((vocabulary) => (
            <Card key={vocabulary.id} variant="default" padding="sm" className="grid gap-1">
             <Typography variant="cardTitle" lang="zh-CN" weight="black">
              {vocabulary.word}
             </Typography>
             <PinyinText variant="bodySmall" tone="accent">
              {vocabulary.pinyin}
             </PinyinText>
             <Typography variant="caption" tone="muted">
              {vocabulary.meaning}
             </Typography>
            </Card>
           ))}
          </div>
         ) : (
          <Typography variant="bodySmall" tone="muted">
           Bài này chưa có từ vựng trong dữ liệu hiện có.
          </Typography>
         )}
        </Card>
       ) : null}
       {activeTab === "grammar" ? (
        <Card variant="section" padding="md" className="grid gap-3">
         <Typography as="h3" variant="sectionTitle" weight="black">
          Ngữ pháp
         </Typography>
         {grammarItems.map((grammar) => (
          <Card key={grammar.id} variant="default" padding="sm" className="grid gap-1">
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
          </Card>
         ))}
         {grammarItems.length === 0 ? (
          <Typography variant="bodySmall" tone="muted">
           Bài này chưa có mục ngữ pháp riêng.
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
           "Nội dung đã được rà soát trước khi đưa vào thư viện."}
         </Typography>
         <Typography variant="caption" tone="muted">
          {metadataString(resource, "source_file") ?? "Nguồn Hanzi Studio"}
         </Typography>
        </Card>
       ) : null}
      </TabsContent>
     </Tabs>
    </div>
   ) : null}
  </div>
 );
}
