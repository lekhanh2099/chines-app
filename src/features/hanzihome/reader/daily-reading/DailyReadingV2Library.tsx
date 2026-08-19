"use client";

import { ChevronRight, FileText, Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { DailyReadingLearningSupportPanel } from "./DailyReadingLearningSupportPanel";
import type { DailyReadingTopic } from "./daily-reading.schemas";
import {
 captureDailyReadingNow,
 useDailyReadingV2Library,
 useDailyReadingV2Settings,
} from "./daily-reading-v2-client";
import { enrichDailyReadingV2LearningSupport } from "./daily-reading-v2-enrichment.client";
import type { DailyReadingV2 } from "./daily-reading-v2.schemas";

type V2Tab = "reader" | "translation" | "questions" | "vocabulary" | "grammar" | "source";

const fallbackTabs: readonly V2Tab[] = ["reader", "source"];

type TopicTranslationKey =
 | "generated.topic.culture"
 | "generated.topic.education"
 | "generated.topic.history"
 | "generated.topic.language"
 | "generated.topic.science"
 | "generated.topic.society"
 | "generated.topic.travel"
 | "generated.topic.environment"
 | "generated.topic.health";

function getTopicTranslationKey(topic: DailyReadingTopic): TopicTranslationKey {
 switch (topic) {
  case "culture":
   return "generated.topic.culture";
  case "education":
   return "generated.topic.education";
  case "history":
   return "generated.topic.history";
  case "language":
   return "generated.topic.language";
  case "science":
   return "generated.topic.science";
  case "society":
   return "generated.topic.society";
  case "travel":
   return "generated.topic.travel";
  case "environment":
   return "generated.topic.environment";
  case "health":
   return "generated.topic.health";
 }
}

function availableTabs(reading: DailyReadingV2): readonly V2Tab[] {
 const tabs: V2Tab[] = ["reader"];
 if (reading.enrichment.translation.status === "ready") tabs.push("translation");
 if (reading.enrichment.questions.status === "ready") tabs.push("questions");
 if (reading.enrichment.vocabulary.status === "ready") tabs.push("vocabulary");
 if (reading.enrichment.grammar.status === "ready") tabs.push("grammar");
 tabs.push("source");
 return tabs;
}

function readyLearningModuleCount(reading: DailyReadingV2) {
 return Object.values(reading.enrichment).filter((state) => state.status === "ready").length;
}

export function DailyReadingV2Library() {
 const t = useTranslations("DailyReading");
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const library = useDailyReadingV2Library();
 const { settings } = useDailyReadingV2Settings();
 const [capturing, setCapturing] = useState(false);

 const readingHref = (id: string) => {
  const next = new URLSearchParams(searchParams.toString());
  next.set("generated", id);
  return `${pathname}?${next.toString()}`;
 };

 async function captureArticle() {
  setCapturing(true);
  try {
   const reading = await captureDailyReadingNow("manual");
   toast.success(t("v2.settings.toast.articleReady", { title: reading.article.titleZh }));
   router.push(readingHref(reading.id), { scroll: false });
   if (settings.autoEnrichmentEnabled) {
    void enrichDailyReadingV2LearningSupport(reading.id).catch(() => undefined);
   }
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("v2.settings.toast.captureFailed"));
  } finally {
   setCapturing(false);
  }
 }

 return (
  <div className="grid min-w-0 gap-6">
   <PageHeader
    eyebrow={t("header.eyebrow")}
    title={t("header.title")}
    description={t("v2.library.description")}
    actions={
     <>
      <Button type="button" variant="outline" size="toolbar" asChild>
       <Link href="/settings?section=ai&panel=daily-reading" prefetch={false}>
        <Settings data-icon="inline-start" />
        {t("v2.actions.openSettings")}
       </Link>
      </Button>
      <Button
       type="button"
       size="toolbar"
       onClick={() => void captureArticle()}
       disabled={capturing}
      >
       {capturing ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
       {capturing ? t("v2.actions.findingArticle") : t("v2.actions.findNewArticle")}
      </Button>
     </>
    }
   />

   <section className="grid gap-3" aria-labelledby="daily-reading-v2-library-heading">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div className="grid gap-1">
      <Typography variant="overline" tone="accent" weight="black">
       {t("generated.library.eyebrow")}
      </Typography>
      <Typography as="h2" variant="sectionTitle" id="daily-reading-v2-library-heading" weight="black">
       {t("generated.library.title")}
      </Typography>
      <Typography variant="bodySmall" tone="muted">
       {t("v2.library.description")}
      </Typography>
     </div>
     <Badge variant={settings.autoCaptureEnabled ? "success" : "default"} size="sm">
      {settings.autoCaptureEnabled ? t("v2.library.autoOn") : t("v2.library.autoOff")}
     </Badge>
    </div>

    {library.items.length === 0 ? (
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography weight="semibold">{t("empty.title")}</Typography>
      <Typography variant="bodySmall" tone="muted">
       {t("empty.description")}
      </Typography>
     </Card>
    ) : (
     <div className="grid gap-3 xl:grid-cols-2">
      {library.items.slice(0, 12).map((reading) => {
       const translation =
        reading.enrichment.translation.status === "ready"
         ? reading.enrichment.translation.data
         : null;
       const readyModules = readyLearningModuleCount(reading);
       return (
        <Card
         key={reading.id}
         asChild
         variant="interactive"
         padding="md"
         className="group grid min-w-0 gap-3"
        >
         <Link href={readingHref(reading.id)} prefetch={false}>
          <div className="flex flex-wrap gap-2">
           <Badge variant={reading.releaseKind === "scheduled" ? "success" : "info"} size="sm">
            {reading.releaseKind === "scheduled"
             ? t("generated.kind.scheduled")
             : t("generated.kind.manual")}
           </Badge>
           {reading.classification.targetLevel !== null ? (
            <Badge variant="warning" size="sm">
             {reading.classification.targetLevel}
            </Badge>
           ) : null}
           <Badge size="sm">{t(getTopicTranslationKey(reading.classification.topic))}</Badge>
          </div>
          <div className="grid min-w-0 gap-1">
           <Typography variant="caption" tone="muted" weight="bold">
            {reading.publishedDate} · {t("sample.minutes", { count: reading.estimatedMinutes })} ·{" "}
            {reading.source.publisher}
           </Typography>
           <HanziText as="h3" size="card" clamp="two">
            {reading.article.titleZh}
           </HanziText>
           {translation !== null ? (
            <Typography variant="bodySmall" tone="secondary" clamp="two">
             {translation.titleVi}
            </Typography>
           ) : null}
           <Typography variant="caption" tone="muted">
            {t("v2.library.learningReady", { ready: readyModules, total: 4 })}
           </Typography>
          </div>
          <div className="flex items-center gap-1">
           <Typography as="span" variant="bodySmall" tone="accent" weight="bold">
            {t("sample.read")}
           </Typography>
           <ChevronRight aria-hidden />
          </div>
         </Link>
        </Card>
       );
      })}
     </div>
    )}
   </section>
  </div>
 );
}

function Questions({ reading }: { reading: DailyReadingV2 }) {
 const t = useTranslations("DailyReading");
 const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
 if (reading.enrichment.questions.status !== "ready") return null;
 return (
  <div className="grid gap-3">
   {reading.enrichment.questions.data.items.map((question, index) => {
    const isRevealed = revealed.has(question.id);
    return (
     <Card key={question.id} variant="section" padding="md" className="grid gap-3">
      <div className="flex items-start gap-3">
       <Badge variant="info" size="sm">
        {index + 1}
       </Badge>
       <div className="grid min-w-0 gap-1">
        <HanziText as="p" size="medium">
         {question.promptZh}
        </HanziText>
        <Typography variant="bodySmall" tone="muted">
         {question.promptVi}
        </Typography>
       </div>
      </div>
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       className="justify-self-start"
       onClick={() =>
        setRevealed((current) => {
         const next = new Set(current);
         if (next.has(question.id)) next.delete(question.id);
         else next.add(question.id);
         return next;
        })
       }
      >
       {isRevealed ? t("generated.questions.hideAnswer") : t("generated.questions.showAnswer")}
      </Button>
      {isRevealed ? (
       <Card variant="subtle" padding="md" className="grid gap-1">
        <HanziText as="p" size="medium">
         {question.answerZh}
        </HanziText>
        <Typography variant="bodySmall" tone="secondary">
         {question.answerVi}
        </Typography>
       </Card>
      ) : null}
     </Card>
    );
   })}
  </div>
 );
}

export function DailyReadingV2View({ id, onBack }: { id: string; onBack(): void }) {
 const t = useTranslations("DailyReading");
 const library = useDailyReadingV2Library();
 const reading = library.items.find((item) => item.id === id) ?? null;
 const [tab, setTab] = useState<V2Tab>("reader");
 const tabs = reading === null ? fallbackTabs : availableTabs(reading);
 const tabItems = tabs.map((key) => ({ key, label: t(`tabs.${key}`) }));
 const translation =
  reading?.enrichment.translation.status === "ready"
   ? reading.enrichment.translation.data
   : null;
 const translationByParagraphId = useMemo(
  () => new Map(translation?.paragraphs.map((paragraph) => [paragraph.paragraphId, paragraph]) ?? []),
  [translation],
 );

 if (reading === null) {
  return (
   <Card variant="subtle" padding="lg" className="grid gap-3">
    <Typography tone="danger">{t("generated.notFound")}</Typography>
    <Button type="button" variant="outline" size="toolbar" className="justify-self-start" onClick={onBack}>
     {t("document.back")}
    </Button>
   </Card>
  );
 }

 const effectiveTab = tabs.includes(tab) ? tab : "reader";
 return (
  <div className="grid min-w-0 gap-4">
   <Button type="button" variant="ghost" size="toolbar" className="justify-self-start" onClick={onBack}>
    {t("document.back")}
   </Button>

   <div className="grid gap-3 border-b border-border-default pb-4">
    <div className="flex flex-wrap gap-2">
     <Badge variant={reading.releaseKind === "scheduled" ? "success" : "info"}>
      {reading.releaseKind === "scheduled"
       ? t("generated.kind.scheduled")
       : t("generated.kind.manual")}
     </Badge>
     {reading.classification.targetLevel !== null ? (
      <Badge variant="warning">{reading.classification.targetLevel}</Badge>
     ) : null}
     <Badge>{t(getTopicTranslationKey(reading.classification.topic))}</Badge>
     <Badge>{t("sample.minutes", { count: reading.estimatedMinutes })}</Badge>
    </div>
    <HanziText as="h1" size="card" weight="black">
     {reading.article.titleZh}
    </HanziText>
    {translation !== null ? (
     <>
      <Typography variant="bodySmall" tone="secondary">
       {translation.titleVi}
      </Typography>
      {translation.whyWorthReadingVi ? (
       <Typography variant="bodySmall" tone="muted">
        {translation.whyWorthReadingVi}
       </Typography>
      ) : null}
     </>
    ) : null}
   </div>

   <DailyReadingLearningSupportPanel reading={reading} />

   <Tabs value={effectiveTab} items={tabItems} onValueChange={setTab} aria-label={t("tabs.aria")}>
    <TabsContent value={effectiveTab} className="pt-4">
     {effectiveTab === "reader" ? (
      <div className="grid gap-4">
       {reading.article.paragraphs.map((paragraph) => {
        const translated = translationByParagraphId.get(paragraph.id);
        return (
         <Card key={paragraph.id} variant="section" padding="md" className="grid gap-2">
          {translated?.roleVi ? (
           <Typography variant="caption" tone="muted" weight="bold">
            {translated.roleVi}
           </Typography>
          ) : null}
          <HanziText as="p" size="large" leading="relaxed" wrapping="breakWords">
           {paragraph.zh}
          </HanziText>
          {translated !== undefined ? (
           <>
            <Separator />
            <Typography as="p" tone="secondary" leading="relaxed">
             {translated.vi}
            </Typography>
           </>
          ) : null}
         </Card>
        );
       })}
      </div>
     ) : null}

     {effectiveTab === "translation" && translation !== null ? (
      <div className="grid gap-4">
       {reading.article.paragraphs.map((paragraph) => {
        const translated = translationByParagraphId.get(paragraph.id);
        if (translated === undefined) return null;
        return (
         <Card key={paragraph.id} variant="section" padding="md" className="grid gap-2">
          <HanziText as="p" size="medium" leading="relaxed" wrapping="breakWords">
           {paragraph.zh}
          </HanziText>
          <Separator />
          <Typography as="p" tone="secondary" leading="relaxed">
           {translated.vi}
          </Typography>
         </Card>
        );
       })}
      </div>
     ) : null}

     {effectiveTab === "questions" ? <Questions reading={reading} /> : null}

     {effectiveTab === "vocabulary" && reading.enrichment.vocabulary.status === "ready" ? (
      <div className="grid gap-3 sm:grid-cols-2">
       {reading.enrichment.vocabulary.data.items.map((item) => (
        <Card key={item.id} variant="section" padding="md" className="grid gap-1">
         <div className="flex flex-wrap items-center gap-2">
          <HanziText as="h3" size="medium" weight="black">
           {item.hanzi}
          </HanziText>
          <Badge size="sm">{item.categoryVi}</Badge>
         </div>
         <Typography variant="bodySmall" weight="semibold">
          {item.meaningVi}
         </Typography>
         <Typography variant="bodySmall" tone="muted">
          {t("generated.vocabulary.inContext", { meaning: item.meaningInContextVi })}
         </Typography>
        </Card>
       ))}
      </div>
     ) : null}

     {effectiveTab === "grammar" && reading.enrichment.grammar.status === "ready" ? (
      <div className="grid gap-3">
       {reading.enrichment.grammar.data.items.map((grammar, index) => (
        <Card key={grammar.id} variant="section" padding="md" className="grid gap-2">
         <div className="flex items-center gap-2">
          <Badge variant="warning">{index + 1}</Badge>
          <HanziText as="h3" size="medium" weight="black">
           {grammar.patternZh}
          </HanziText>
         </div>
         <Typography variant="bodySmall" tone="secondary">
          {grammar.explanationVi}
         </Typography>
         <HanziText as="p" size="medium" leading="relaxed">
          {grammar.evidenceSentenceZh}
         </HanziText>
        </Card>
       ))}
      </div>
     ) : null}

     {effectiveTab === "source" ? (
      <Card variant="subtle" padding="md" className="grid gap-3">
       <div className="flex items-start gap-3">
        <FileText aria-hidden />
        <div className="grid min-w-0 gap-1">
         <HanziText as="h3" size="medium" weight="black">
          {reading.source.titleZh}
         </HanziText>
         <Typography variant="bodySmall" tone="muted">
          {reading.source.publisher} · {new Date(reading.source.publishedAt).toLocaleString()}
         </Typography>
        </div>
       </div>
       {reading.provenance === "legacy-adapted" && translation?.adaptationNoticeVi ? (
        <Typography variant="bodySmall" tone="secondary">
         {translation.adaptationNoticeVi}
        </Typography>
       ) : (
        <Typography variant="bodySmall" tone="muted">
         {t("source.fallbackNotice")}
        </Typography>
       )}
       <Button type="button" variant="outline" size="toolbar" asChild className="justify-self-start">
        <a href={reading.source.url} target="_blank" rel="noreferrer">
         {t("generated.source.open")}
        </a>
       </Button>
      </Card>
     ) : null}
    </TabsContent>
   </Tabs>
  </div>
 );
}
