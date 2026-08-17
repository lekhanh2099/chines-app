"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import {
 ReaderHanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import type { ReaderDocumentResource } from "@/features/hanzihome/reader/reader-content-api";
import type { ReaderDocumentRow } from "@/features/hanzihome/reader/reader.schemas";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

type HumanitiesTrackKind = "poetry" | "history";
type TrackTab = "text" | "language" | "poetics" | "interpretation" | "practice";

function moduleNumber(kind: HumanitiesTrackKind, index: number) {
 if (kind === "poetry") return index < 2 ? 2 : index < 5 ? 3 : 4;
 return index < 2 ? 2 : 5;
}

function selectedPayload(resource: ReaderDocumentResource) {
 return resource.exerciseItems[0]?.payload;
}

function SourceReference({ resource }: { resource: ReaderDocumentResource }) {
 const t = useTranslations("Humanities.track");
 const source = selectedPayload(resource)?.source;
 if (source === undefined) return null;
 return (
  <Card variant="subtle" padding="md" className="grid gap-2">
   <Typography as="h3" variant="cardTitle" weight="black">
    {t("sourceTitle")}
   </Typography>
   <Typography as="p" variant="bodySmall" weight="black">
    {source.title}
   </Typography>
   {source.authorOrEditor ? (
    <Typography as="p" variant="caption" tone="muted">
     {source.authorOrEditor}
    </Typography>
   ) : null}
   <Typography as="p" variant="caption" tone="muted">
    {source.publisherOrInstitution ?? source.sourceType}
    {source.pageOrSection ? ` · ${source.pageOrSection}` : ""}
   </Typography>
   {source.stableLocator ? (
    <Typography as="p" variant="caption" tone="muted" className="break-all">
     {source.stableLocator}
    </Typography>
   ) : null}
   <Typography as="p" variant="caption" tone="muted">
    {source.notes}
   </Typography>
  </Card>
 );
}

function GlossaryCards({ resource }: { resource: ReaderDocumentResource }) {
 const t = useTranslations("Humanities.track");
 const glossary = selectedPayload(resource)?.glossary ?? [];
 if (glossary.length === 0) {
  return (
   <Typography as="p" variant="bodySmall" tone="muted">
    {t("glossaryEmpty")}
   </Typography>
  );
 }
 return (
  <div className="grid gap-3 md:grid-cols-2">
   {glossary.map((entry) => (
    <Card key={entry.id} variant="subtle" padding="md" className="grid gap-2">
     <div className="flex flex-wrap items-baseline gap-2">
      <Typography as="strong" variant="cardTitle" lang="zh-CN">
       {entry.headword}
      </Typography>
      {entry.pinyin !== null ? <PinyinText variant="caption">{entry.pinyin}</PinyinText> : null}
     </div>
     <Typography as="p" variant="bodySmall" weight="black">
      {entry.meaningVi}
     </Typography>
     <Typography as="p" variant="caption" tone="muted">
      {entry.noteVi}
     </Typography>
    </Card>
   ))}
  </div>
 );
}

function TextLayer({
 resource,
 kind,
}: {
 resource: ReaderDocumentResource;
 kind: HumanitiesTrackKind;
}) {
 const t = useTranslations("Humanities.track");
 const paragraphs = resource.paragraphs;
 return (
  <div className="grid min-w-0 gap-4">
   <Card variant="section" padding="md" className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <Typography as="h2" variant="sectionTitle" weight="black">
      {kind === "poetry" ? t("textTitlePoetry") : t("textTitleHistory")}
     </Typography>
     <Badge casing="natural">{t("paragraphCount", { count: paragraphs.length })}</Badge>
    </div>
    {paragraphs.map((paragraph) => (
     <article
      key={paragraph.id}
      className="grid gap-2 border-b border-border-default pb-4 last:border-0 last:pb-0"
     >
      <Typography as="span" variant="overline" tone="accent" weight="black">
       {t("paragraph", { order: paragraph.paragraph_order })}
      </Typography>
      <ReaderHanziText
       displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin: false, showMeaning: false }}
       leading="learner"
       wrapping="preWrap"
      >
       {paragraph.zh}
      </ReaderHanziText>
      {paragraph.pinyin ? <PinyinText variant="bodySmall">{paragraph.pinyin}</PinyinText> : null}
      {paragraph.vi ? (
       <TranslationText variant="bodySmall" tone="muted">
        {paragraph.vi}
       </TranslationText>
      ) : null}
     </article>
    ))}
   </Card>
   <GlossaryCards resource={resource} />
   <SourceReference resource={resource} />
  </div>
 );
}

function AnnotationCards({
 resource,
 filter,
}: {
 resource: ReaderDocumentResource;
 filter?: string[];
}) {
 const t = useTranslations("Humanities.track");
 const annotations = (selectedPayload(resource)?.annotations ?? []).filter(
  (annotation) => filter === undefined || filter.includes(annotation.type),
 );
 if (annotations.length === 0) {
  return (
   <Typography as="p" variant="bodySmall" tone="muted">
    {t("annotationEmpty")}
   </Typography>
  );
 }
 return (
  <div className="grid gap-3 md:grid-cols-2">
   {annotations.map((annotation) => (
    <Card key={annotation.id} variant="subtle" padding="md" className="grid gap-2">
     <Badge variant="accent" casing="natural" className="justify-self-start">
      {annotation.type}
     </Badge>
     <Typography as="h3" variant="cardTitle" weight="black">
      {annotation.titleVi}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {annotation.bodyVi}
     </Typography>
    </Card>
   ))}
  </div>
 );
}

function PoetryPoeticsLayer({ resource }: { resource: ReaderDocumentResource }) {
 const t = useTranslations("Humanities.track.poetics");
 const poetry = selectedPayload(resource)?.poetry;
 if (poetry === undefined) return null;
 const segmentText = new Map(
  resource.paragraphs.map((paragraph) => [String(paragraph.paragraph_order), paragraph.zh]),
 );
 return (
  <div className="grid gap-4 lg:grid-cols-2">
   <Card variant="section" padding="md" className="grid content-start gap-3">
    <Typography as="span" variant="overline" tone="accent" weight="black">
     {t("form")}
    </Typography>
    <Typography as="strong" variant="body" weight="black">
     {poetry.form}
    </Typography>
    {poetry.author ? (
     <Typography as="p" variant="bodySmall" tone="muted">
      {poetry.author.nameVi} · {poetry.author.roleVi}
     </Typography>
    ) : null}
    {poetry.dynastyOrPeriod ? (
     <Typography as="p" variant="caption" tone="muted">
      {poetry.dynastyOrPeriod}
     </Typography>
    ) : null}
    {poetry.rhyme ? (
     <Typography as="p" variant="bodySmall" tone="muted">
      {poetry.rhyme.summaryVi}
     </Typography>
    ) : null}
    {poetry.lines.map((line) => (
     <div
      key={line.segmentId}
      className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-bg-subtle px-3 py-2"
     >
      <Typography as="span" variant="bodySmall" lang="zh-CN">
       {segmentText.get(line.segmentId) ?? line.segmentId}
      </Typography>
      <Badge casing="natural">{line.caesura.join(" / ")}</Badge>
     </div>
    ))}
   </Card>
   <Card variant="section" padding="md" className="grid content-start gap-3">
    <Typography as="span" variant="overline" tone="accent" weight="black">
     {t("imagery")}
    </Typography>
    {poetry.imagery.map((image) => (
     <div
      key={image.id}
      className="grid gap-1 border-b border-border-default pb-3 last:border-0 last:pb-0"
     >
      <Typography as="strong" variant="bodySmall" weight="black">
       {image.imageVi}
      </Typography>
      <Typography as="p" variant="caption" tone="muted">
       {image.functionVi}
      </Typography>
     </div>
    ))}
   </Card>
   {poetry.parallelism.length > 0 ? (
    <Card variant="section" padding="md" className="grid gap-2 lg:col-span-2">
     <Typography as="span" variant="overline" tone="accent" weight="black">
      {t("parallelism")}
     </Typography>
     {poetry.parallelism.map((item) => (
      <Typography
       key={`${item.leftSegmentId}:${item.rightSegmentId}`}
       as="p"
       variant="bodySmall"
       tone="muted"
      >
       {item.noteVi}
      </Typography>
     ))}
    </Card>
   ) : null}
  </div>
 );
}

function ClaimsLayer({ resource }: { resource: ReaderDocumentResource }) {
 const claims = selectedPayload(resource)?.claims ?? [];
 return (
  <div className="grid gap-3">
   {claims.map((claim) => (
    <Card key={claim.id} variant="subtle" padding="md" className="grid gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Badge casing="natural" variant={claim.type === "fact" ? "success" : "warning"}>
       {claim.type}
      </Badge>
      <Badge casing="natural">{claim.confidence}</Badge>
     </div>
     <Typography as="p" variant="bodySmall">
      {claim.statementVi}
     </Typography>
     <Card variant="subtle" padding="sm" className="grid gap-2">
      {claim.evidence.map((evidence) => (
       <Typography
        key={`${evidence.sourceId}:${evidence.locator}`}
        as="p"
        variant="caption"
        tone="muted"
       >
        <strong>{evidence.relation}:</strong> {evidence.locator} · {evidence.note}
       </Typography>
      ))}
     </Card>
     {claim.alternatives.length > 0 ? (
      <div className="grid gap-1">
       {claim.alternatives.map((alternative) => (
        <Typography key={alternative} as="p" variant="caption" tone="muted">
         {alternative}
        </Typography>
       ))}
      </div>
     ) : null}
    </Card>
   ))}
  </div>
 );
}

function HistoryTimelineLayer({ resource }: { resource: ReaderDocumentResource }) {
 const history = selectedPayload(resource)?.history;
 if (history === undefined) return null;
 return (
  <div className="grid gap-3">
   {history.timeline.map((event, index) => (
    <div key={event.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
     <div className="grid grid-rows-[auto_1fr] justify-items-center">
      <Badge variant="purple">{index + 1}</Badge>
      {index === history.timeline.length - 1 ? null : <span className="w-px bg-border" />}
     </div>
     <Card variant="subtle" padding="md" className="grid content-start gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <Typography as="strong" variant="bodySmall" weight="black">
        {event.titleVi}
       </Typography>
       <Badge casing="natural" variant="info">
        {event.dateLabel}
       </Badge>
      </div>
      <Typography as="p" variant="bodySmall" tone="muted">
       {event.descriptionVi}
      </Typography>
      <div className="flex flex-wrap gap-2">
       {event.actors.map((actor) => (
        <Badge key={actor} casing="natural">
         {actor}
        </Badge>
       ))}
       {event.places.map((place) => (
        <Badge key={place} casing="natural" variant="accent">
         {place}
        </Badge>
       ))}
      </div>
     </Card>
    </div>
   ))}
  </div>
 );
}

function HistoryPerspectivesLayer({ resource }: { resource: ReaderDocumentResource }) {
 const t = useTranslations("Humanities.track.history");
 const history = selectedPayload(resource)?.history;
 if (history === undefined) return null;
 return (
  <div className="grid gap-4 lg:grid-cols-2">
   <Card variant="section" padding="md" className="grid content-start gap-3">
    <Typography as="span" variant="overline" tone="accent" weight="black">
     {t("actors")}
    </Typography>
    {history.actors.map((actor) => (
     <div
      key={actor.id}
      className="grid gap-1 border-b border-border-default pb-3 last:border-0 last:pb-0"
     >
      <div className="flex flex-wrap justify-between gap-2">
       <Typography as="strong" variant="bodySmall" weight="black">
        {actor.nameVi}
       </Typography>
       <Badge casing="natural">{actor.roleVi}</Badge>
      </div>
      <Typography as="p" variant="caption" tone="muted">
       {actor.perspectiveVi}
      </Typography>
     </div>
    ))}
   </Card>
   <Card variant="section" padding="md" className="grid content-start gap-3">
    <Typography as="span" variant="overline" tone="accent" weight="black">
     {t("perspectives")}
    </Typography>
    {history.perspectives.map((perspective) => (
     <div
      key={perspective.id}
      className="grid gap-1 border-b border-border-default pb-3 last:border-0 last:pb-0"
     >
      <Typography as="strong" variant="bodySmall" weight="black">
       {perspective.labelVi}
      </Typography>
      <Typography as="p" variant="caption" tone="muted">
       {perspective.summaryVi}
      </Typography>
     </div>
    ))}
   </Card>
  </div>
 );
}

function PracticeLayer({ resource }: { resource: ReaderDocumentResource }) {
 const t = useTranslations("Humanities.track.practice");
 const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());
 const exercises = resource.exerciseItems;
 return (
  <div className="grid gap-3">
   {exercises.map((exercise, index) => {
    const isRevealed = revealed.has(exercise.id);
    return (
     <Card key={exercise.id} variant="subtle" padding="md" className="grid gap-3">
      <div className="flex items-start gap-3">
       <Badge variant="purple">{index + 1}</Badge>
       <Typography as="strong" variant="bodySmall" weight="black">
        {exercise.payload.promptVi}
       </Typography>
      </div>
      <Button
       type="button"
       size="sm"
       variant="outline"
       onClick={() => setRevealed((current) => new Set(current).add(exercise.id))}
      >
       {isRevealed ? t("revealed") : t("reveal")}
      </Button>
      {isRevealed ? (
       <Typography as="p" variant="bodySmall" tone="muted">
        {exercise.payload.answerVi || exercise.payload.answer || t("answerFallback")}
       </Typography>
      ) : null}
     </Card>
    );
   })}
  </div>
 );
}

function TrackDetail({
 resource,
 kind,
 onBack,
 lessonIndex,
 total,
}: {
 resource: ReaderDocumentResource;
 kind: HumanitiesTrackKind;
 onBack: () => void;
 lessonIndex: number;
 total: number;
}) {
 const t = useTranslations("Humanities.track");
 const trackTitle = kind === "poetry" ? t("titles.poetry") : t("titles.history");
 const tabs: ReadonlyArray<{ id: TrackTab; label: string }> =
  kind === "poetry"
   ? [
      { id: "text", label: t("tabs.poetry.text") },
      { id: "language", label: t("tabs.poetry.language") },
      { id: "poetics", label: t("tabs.poetry.poetics") },
      { id: "interpretation", label: t("tabs.poetry.interpretation") },
      { id: "practice", label: t("tabs.poetry.practice") },
     ]
   : [
      { id: "text", label: t("tabs.history.text") },
      { id: "language", label: t("tabs.history.language") },
      { id: "poetics", label: t("tabs.history.poetics") },
      { id: "interpretation", label: t("tabs.history.interpretation") },
      { id: "practice", label: t("tabs.history.practice") },
     ];
 const [tab, setTab] = useState<TrackTab>("text");
 const tts = useSharedMandarinTts();
 const paragraphs = resource.paragraphs;
 const ttsText = paragraphs.map((paragraph) => paragraph.zh).join(" ");
 return (
  <div className="grid min-w-0 gap-4">
   <Card variant="section" padding="md" className="grid gap-3">
    <Button
     type="button"
     variant="ghost"
     align="start"
     className="justify-self-start"
     onClick={onBack}
    >
     {t("detail.back", { track: trackTitle })}
    </Button>
    <div className="grid gap-1">
     <Badge variant="purple" className="justify-self-start">
      {t("detail.moduleLesson", {
       module: moduleNumber(kind, lessonIndex - 1),
       lesson: lessonIndex,
       total,
      })}
     </Badge>
     <Typography as="h1" variant="sectionTitle" weight="black">
      {resource.document.title_zh}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {resource.document.title_vi} · {resource.document.genre_vi}
     </Typography>
    </div>
   </Card>
   <Tabs
    value={tab}
    items={tabs.map((item) => ({ key: item.id, label: item.label }))}
    onValueChange={setTab}
    aria-label={t("detail.tabsAria", { track: trackTitle })}
   >
    <TabsContent value={tab} className="pt-3">
     {tab === "text" ? <TextLayer resource={resource} kind={kind} /> : null}
     {tab === "language" && kind === "poetry" ? (
      <div className="grid gap-3">
       <GlossaryCards resource={resource} />
       <AnnotationCards resource={resource} filter={["grammar", "allusion"]} />
      </div>
     ) : null}
     {tab === "language" && kind === "history" ? (
      <HistoryTimelineLayer resource={resource} />
     ) : null}
     {tab === "poetics" && kind === "poetry" ? <PoetryPoeticsLayer resource={resource} /> : null}
     {tab === "poetics" && kind === "history" ? <ClaimsLayer resource={resource} /> : null}
     {tab === "interpretation" && kind === "poetry" ? <ClaimsLayer resource={resource} /> : null}
     {tab === "interpretation" && kind === "history" ? (
      <HistoryPerspectivesLayer resource={resource} />
     ) : null}
     {tab === "practice" ? <PracticeLayer resource={resource} /> : null}
    </TabsContent>
   </Tabs>
   <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
    <Typography as="span" variant="caption" tone="muted">
     {t("detail.listenLabel")}
    </Typography>
    <Button type="button" size="sm" onClick={() => tts.speakSequence([ttsText])}>
     {t("detail.listen")}
    </Button>
   </Card>
  </div>
 );
}

export function HumanitiesTrackWorkspace({
 kind,
 initialDocuments,
 initialResource,
}: {
 kind: HumanitiesTrackKind;
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
}) {
 const t = useTranslations("Humanities.track");
 const shellT = useTranslations("Humanities.shell");
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const documents = useMemo(
  () =>
   initialDocuments.filter(
    (document) =>
     typeof document.source_metadata.source_kind === "string" &&
     document.source_metadata.source_kind === kind,
   ),
  [initialDocuments, kind],
 );
 const requestedDocumentId = searchParams.get("document") ?? "";
 const selectedId = documents.some((document) => document.id === requestedDocumentId)
  ? requestedDocumentId
  : "";
 const resource = selectedId.length > 0 ? initialResource : null;
 const trackTitle = kind === "poetry" ? t("titles.poetry") : t("titles.history");
 const trackDescription =
  kind === "poetry" ? t("descriptions.poetry") : t("descriptions.history");

 if (selectedId.length > 0 && resource !== null) {
  const lessonIndex = Math.max(
   1,
   documents.findIndex((document) => document.id === selectedId) + 1,
  );
  return (
   <TrackDetail
    resource={resource}
    kind={kind}
    lessonIndex={lessonIndex}
    total={documents.length}
    onBack={() => router.push(pathname, { scroll: false })}
   />
  );
 }

 return (
  <div className="grid min-w-0 gap-5">
   <header className="grid gap-2">
    <Typography as="span" variant="overline" tone="accent" weight="black">
     {t("eyebrow")}
    </Typography>
    <Typography as="h1" variant="pageTitle" weight="black">
     {trackTitle}
    </Typography>
    <Typography as="p" variant="body" tone="muted" className="max-w-3xl">
     {trackDescription}
    </Typography>
   </header>
   <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={shellT("navAria")}>
    <Button asChild variant="navigation" wrap="normal">
     <Link href="/humanities">{shellT("nav.program")}</Link>
    </Button>
    <Button asChild variant={kind === "poetry" ? "active" : "navigation"} wrap="normal">
     <Link href="/humanities/poetry">{shellT("nav.poetry")}</Link>
    </Button>
    <Button asChild variant={kind === "history" ? "active" : "navigation"} wrap="normal">
     <Link href="/humanities/history">{shellT("nav.history")}</Link>
    </Button>
    <Button asChild variant="navigation" wrap="normal">
     <Link href="/translation">{shellT("nav.translation")}</Link>
    </Button>
    <Button asChild variant="navigation" wrap="normal">
     <Link href="/translation?track=interpreting">{shellT("nav.interpreting")}</Link>
    </Button>
   </nav>
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="accent" weight="black">
       {t("guide.beginner")}
      </Typography>
      <Typography as="h2" variant="sectionTitle" weight="black">
       {trackTitle}
      </Typography>
     </div>
     <Badge casing="natural">{t("library.count", { count: documents.length })}</Badge>
    </div>
    <Typography as="p" variant="bodySmall" tone="muted">
     {kind === "poetry" ? t("guide.poetryWhy") : t("guide.historyWhy")}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="muted">
     {kind === "poetry" ? t("guide.poetryStart") : t("guide.historyStart")}
    </Typography>
    <Card variant="subtle" padding="sm" className="grid gap-1">
     <Typography as="strong" variant="caption" tone="accent" weight="black">
      {t("guide.startHere")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {kind === "poetry" ? t("guide.poetryMethod") : t("guide.historyMethod")}
     </Typography>
    </Card>
   </Card>
   <section className="grid gap-3" aria-labelledby={`${kind}-library`}>
    <div className="grid gap-1">
     <Typography as="h2" variant="sectionTitle" weight="black" id={`${kind}-library`}>
      {kind === "poetry" ? t("library.poetry") : t("library.history")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("library.description")}
     </Typography>
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
     {documents.map((document, index) => (
      <Button
       key={document.id}
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant="surfaceCard"
       onClick={() =>
        router.push(`${pathname}?document=${encodeURIComponent(document.id)}`, { scroll: false })
       }
      >
       <Typography
        as="span"
        variant="caption"
        tone="accent"
        weight="black"
        className="w-full text-left"
       >
        {t("library.moduleLesson", {
         module: moduleNumber(kind, index),
         lesson: index + 1,
         total: documents.length,
        })}
       </Typography>
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        {document.title_zh}
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        {document.title_vi} · {document.genre_vi}
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        {Array.isArray(document.source_metadata.tags)
         ? document.source_metadata.tags.join(" · ")
         : t("library.open")}
       </Typography>
      </Button>
     ))}
    </div>
   </section>
  </div>
 );
}
