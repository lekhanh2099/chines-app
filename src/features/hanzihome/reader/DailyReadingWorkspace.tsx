"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronRight, FileText, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import {
 createTranslationAttempt,
 scoreTranslationAttempt,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { DailyReadingGrammarPanel } from "./DailyReadingGrammarPanel";
import { ReaderDocumentStudy } from "./ReaderDocumentStudy";
import { ReaderExercisePanel } from "./ReaderExercisePanel";
import { ReaderTranslationPracticePanel } from "./ReaderTranslationPracticePanel";
import { ReaderVocabularyPanel } from "./ReaderVocabularyPanel";
import type { ReaderDocumentResource } from "./reader-content-api";
import type { ReaderSessionState } from "./reader-session";
import type { ReaderDocumentRow } from "./reader.schemas";

const dailyTabSchema = z.enum([
 "reader",
 "questions",
 "vocabulary",
 "grammar",
 "translation",
 "source",
]);
type DailyTab = z.output<typeof dailyTabSchema>;

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
 const [completedKeys, setCompletedKeys] = useState<Set<string>>(() => new Set());
 const [error, setError] = useState("");
 const startedAtRef = useRef<number | null>(null);
 const segment = segments[activeIndex];
 const score =
  segment !== undefined && checked ? scoreTranslationAttempt(segment, direction, draft) : null;
 const completedCount = segments.filter((candidate) =>
  completedKeys.has(`${candidate.id}:${direction}`),
 ).length;

 const check = () => {
  if (segment === undefined) return;
  const attempt = createTranslationAttempt(
   segment,
   direction,
   draft,
   startedAtRef.current === null ? null : Math.max(0, Date.now() - startedAtRef.current),
  );
  startedAtRef.current = null;
  setError("");
  setChecked(true);
  setCompletedKeys((current) => {
   const next = new Set(current);
   next.add(`${segment.id}:${direction}`);
   return next;
  });
  const referenceText = direction === "zh-vi" ? segment.vi : segment.zh;
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
  setError("");
  startedAtRef.current = null;
 };

 return (
  <div className="grid min-w-0 gap-3">
   <ReaderTranslationPracticePanel
    activeIndex={activeIndex}
    checked={checked}
    completedCount={completedCount}
    direction={direction}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    draft={draft}
    score={score}
    segment={segment}
    segments={segments}
    onCheck={check}
    onDirectionChange={(value) => {
     setDirection(value);
     setDraft("");
     setChecked(false);
     setError("");
     startedAtRef.current = null;
    }}
    onDraftChange={(value) => {
     setDraft(value);
     setChecked(false);
     if (value.trim() && startedAtRef.current === null) startedAtRef.current = Date.now();
    }}
    onNext={() => move(activeIndex + 1)}
    onPrevious={() => move(activeIndex - 1)}
    onSelect={(segmentId) => {
     const index = segments.findIndex((candidate) => candidate.id === segmentId);
     if (index >= 0) move(index);
    }}
   />
   {error ? (
    <Typography variant="caption" tone="danger">
     {error}
    </Typography>
   ) : null}
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
 const t = useTranslations("DailyReading");
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
 const dailyTabs: ReadonlyArray<{ id: DailyTab; label: string }> = [
  { id: "reader", label: t("tabs.reader") },
  { id: "questions", label: t("tabs.questions") },
  { id: "vocabulary", label: t("tabs.vocabulary") },
  { id: "grammar", label: t("tabs.grammar") },
  { id: "translation", label: t("tabs.translation") },
  { id: "source", label: t("tabs.source") },
 ];

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
     ? t("sample.topicCulture")
     : (documentMetadataString(latest, "topic") ?? t("sample.topicFallback"));

 return (
  <div className="grid min-w-0 gap-6">
   {requestedDocumentId.length === 0 ? (
    <div className="flex min-w-0 items-start gap-3">
     <IconTile tone="info" size="md">
      <FileText />
     </IconTile>
     <PageHeader
      className="flex-1"
      eyebrow={t("header.eyebrow")}
      title={t("header.title")}
      description={t("header.description")}
      actions={
       <>
        <Button type="button" variant="outline" size="toolbar" asChild>
         <Link href="/settings?section=reading" prefetch={false}>
          <Settings data-icon="inline-start" />
          {t("header.settings")}
         </Link>
        </Button>
        <Button type="button" size="toolbar" disabled={latest === undefined} onClick={openSample}>
         <FileText data-icon="inline-start" />
         {t("header.openSample")}
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
      title={t("empty.title")}
      description={t("empty.description")}
      actions={
       <Button type="button" size="toolbar" disabled={latest === undefined} onClick={openSample}>
        <FileText data-icon="inline-start" />
        {t("header.openSample")}
       </Button>
      }
     />

     {latest !== undefined ? (
      <section className="grid gap-3" aria-labelledby="daily-sample-heading">
       <div className="grid gap-1">
        <Typography variant="overline" tone="accent" weight="black">
         {t("sample.eyebrow")}
        </Typography>
        <Typography as="h2" variant="sectionTitle" id="daily-sample-heading" weight="black">
         {t("sample.title")}
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
           {t("sample.badge")}
          </Badge>
          <Badge variant="info" size="sm" casing="natural">
           {documentMetadataString(latest, "level") ?? t("sample.levelFallback")}
          </Badge>
          <Badge variant="info" size="sm" casing="natural">
           {sampleTopic}
          </Badge>
         </div>
         <div className="relative grid min-w-0 gap-1">
          <Typography variant="caption" tone="muted" weight="bold">
           {documentMetadataString(latest, "published_date") ?? t("sample.dateFallback")}
           {documentMetadataNumber(latest, "estimated_minutes") !== null
            ? ` · ${t("sample.minutes", { count: documentMetadataNumber(latest, "estimated_minutes") ?? 0 })}`
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
           {t("sample.read")}
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
      {t("document.notFound")}
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
       className="justify-self-start"
       onClick={() => setQuery({})}
      >
       {t("document.back")}
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
         <Badge>{t("document.minutes", { count: metadataNumber(resource, "estimated_minutes") ?? 0 })}</Badge>
        ) : null}
       </div>
      </div>
     </div>

     <Tabs
      value={activeTab}
      items={dailyTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
      onValueChange={(tab) => setQuery({ document: resource.document.id, tab })}
      aria-label={t("tabs.aria")}
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
       {activeTab === "vocabulary" ? <ReaderVocabularyPanel vocabulary={resource.vocabulary} /> : null}
       {activeTab === "grammar" ? <DailyReadingGrammarPanel grammarItems={grammarItems} /> : null}
       {activeTab === "translation" ? <DailyTranslationPanel resource={resource} /> : null}
       {activeTab === "source" ? (
        <Card variant="subtle" padding="md" className="grid gap-2">
         <Typography as="h3" variant="sectionTitle" weight="black">
          {t("source.title")}
         </Typography>
         <Typography variant="bodySmall" tone="muted">
          {metadataString(resource, "adaptation_notice_vi") ?? t("source.fallbackNotice")}
         </Typography>
         <Typography variant="caption" tone="muted">
          {metadataString(resource, "source_file") ?? t("source.fallbackSource")}
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
