"use client";

import { ChevronRight, FileText, Settings, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link } from "@/i18n/navigation";

import {
 generateDailyReadingNow,
 useDailyReadingLibrary,
 useDailyReadingSettings,
} from "./daily-reading-client";
import type {
 DailyReading,
 DailyReadingGenerationStage,
 DailyReadingTopic,
} from "./daily-reading.schemas";

const generatedTabs = ["reader", "questions", "vocabulary", "grammar", "source"] as const;
type GeneratedTab = (typeof generatedTabs)[number];

const stageTranslationKey = {
 discovering: "generated.stage.discovering",
 extracting: "generated.stage.extracting",
 drafting: "generated.stage.drafting",
 repairing_core: "generated.stage.repairingCore",
 enriching: "generated.stage.enriching",
 repairing_learning: "generated.stage.repairingLearning",
 validating: "generated.stage.validating",
 finalizing: "generated.stage.finalizing",
 saving: "generated.stage.saving",
 completed: "generated.stage.completed",
} as const satisfies Record<DailyReadingGenerationStage, string>;

const topicTranslationKey = {
 culture: "generated.topic.culture",
 education: "generated.topic.education",
 history: "generated.topic.history",
 language: "generated.topic.language",
 science: "generated.topic.science",
 society: "generated.topic.society",
 travel: "generated.topic.travel",
 environment: "generated.topic.environment",
 health: "generated.topic.health",
} as const satisfies Record<DailyReadingTopic, string>;

export function GeneratedDailyReadingLibrary({ onOpen }: { onOpen(id: string): void }) {
 const t = useTranslations("DailyReading");
 const library = useDailyReadingLibrary();
 const { settings } = useDailyReadingSettings();
 const [generating, setGenerating] = useState(false);
 const [stage, setStage] = useState<DailyReadingGenerationStage | null>(null);

 async function generate() {
  setGenerating(true);
  setStage("discovering");
  try {
   const reading = await generateDailyReadingNow("manual", settings.preferredLevel, {
    onProgress: setStage,
   });
   toast.success(t("generated.toast.created", { title: reading.titleZh }));
   onOpen(reading.id);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("generated.toast.failed"));
  } finally {
   setGenerating(false);
  }
 }

 return (
  <div className="grid min-w-0 gap-6">
   <PageHeader
    eyebrow={t("header.eyebrow")}
    title={t("header.title")}
    description={t("generated.description")}
    actions={
     <>
      <Button type="button" variant="outline" size="toolbar" asChild>
       <Link href="/settings?section=reading" prefetch={false}>
        <Settings data-icon="inline-start" />
        {t("header.settings")}
       </Link>
      </Button>
      <Button type="button" size="toolbar" onClick={() => void generate()} disabled={generating}>
       {generating ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
       {t("generated.generateNow")}
      </Button>
     </>
    }
   />

   {generating && stage !== null ? (
    <Card variant="subtle" padding="md" className="flex min-w-0 items-center gap-3">
     <Spinner />
     <div className="grid min-w-0 gap-1">
      <Typography variant="label" weight="bold">
       {t(stageTranslationKey[stage])}
      </Typography>
      <Typography variant="bodySmall" tone="muted">
       {t("generated.progressHint")}
      </Typography>
     </div>
    </Card>
   ) : null}

   <section className="grid gap-3" aria-labelledby="generated-daily-reading-heading">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div className="grid gap-1">
      <Typography variant="overline" tone="accent" weight="black">
       {t("generated.library.eyebrow")}
      </Typography>
      <Typography
       as="h2"
       variant="sectionTitle"
       id="generated-daily-reading-heading"
       weight="black"
      >
       {t("generated.library.title")}
      </Typography>
      <Typography variant="bodySmall" tone="muted">
       {t("generated.library.description")}
      </Typography>
     </div>
     <Badge variant={settings.autoGenerateEnabled ? "success" : "default"} size="sm">
      {settings.autoGenerateEnabled
       ? t("generated.library.autoOn")
       : t("generated.library.autoOff")}
     </Badge>
    </div>

    {library.items.length === 0 ? (
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography weight="semibold">{t("generated.library.emptyTitle")}</Typography>
      <Typography variant="bodySmall" tone="muted">
       {t("generated.library.emptyDescription", { level: settings.preferredLevel })}
      </Typography>
     </Card>
    ) : (
     <div className="grid gap-3 xl:grid-cols-2">
      {library.items.slice(0, 12).map((reading) => (
       <Card key={reading.id} variant="interactive" padding="md">
        <button
         type="button"
         className="group grid w-full min-w-0 gap-3 text-left"
         onClick={() => onOpen(reading.id)}
        >
         <div className="flex flex-wrap gap-2">
          <Badge variant={reading.releaseKind === "scheduled" ? "success" : "info"} size="sm">
           {reading.releaseKind === "scheduled"
            ? t("generated.kind.scheduled")
            : t("generated.kind.manual")}
          </Badge>
          <Badge variant="warning" size="sm">
           {reading.level}
          </Badge>
          <Badge size="sm">{t(topicTranslationKey[reading.topic])}</Badge>
         </div>
         <div className="grid min-w-0 gap-1">
          <Typography variant="caption" tone="muted" weight="bold">
           {reading.publishedDate} · {t("sample.minutes", { count: reading.estimatedMinutes })} ·{" "}
           {reading.source.publisher}
          </Typography>
          <HanziText as="h3" size="card" clamp="two">
           {reading.titleZh}
          </HanziText>
          {reading.titlePinyin ? (
           <PinyinText as="p" variant="caption" tone="accent">
            {reading.titlePinyin}
           </PinyinText>
          ) : null}
          <Typography variant="bodySmall" tone="secondary" clamp="two">
           {reading.titleVi}
          </Typography>
         </div>
         <div className="flex items-center gap-1">
          <Typography as="span" variant="bodySmall" tone="accent" weight="bold">
           {t("sample.read")}
          </Typography>
          <ChevronRight aria-hidden />
         </div>
        </button>
       </Card>
      ))}
     </div>
    )}
   </section>
  </div>
 );
}

function Questions({ reading }: { reading: DailyReading }) {
 const t = useTranslations("DailyReading");
 const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
 return (
  <div className="grid gap-3">
   {reading.questions.map((question, index) => {
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

export function GeneratedDailyReadingView({
 id,
 onBack,
}: {
 id: string;
 onBack(): void;
}) {
 const t = useTranslations("DailyReading");
 const library = useDailyReadingLibrary();
 const reading = library.items.find((item) => item.id === id) ?? null;
 const [tab, setTab] = useState<GeneratedTab>("reader");
 const tabItems = generatedTabs.map((key) => ({ key, label: t(`tabs.${key}`) }));

 if (reading === null) {
  return (
   <Card variant="subtle" padding="lg" className="grid gap-3">
    <Typography tone="danger">{t("generated.notFound")}</Typography>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     className="justify-self-start"
     onClick={onBack}
    >
     {t("document.back")}
    </Button>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-4">
   <Button
    type="button"
    variant="ghost"
    size="toolbar"
    className="justify-self-start"
    onClick={onBack}
   >
    {t("document.back")}
   </Button>
   <div className="grid gap-3 border-b border-border-default pb-4">
    <div className="flex flex-wrap gap-2">
     <Badge variant={reading.releaseKind === "scheduled" ? "success" : "info"}>
      {reading.releaseKind === "scheduled"
       ? t("generated.kind.scheduled")
       : t("generated.kind.manual")}
     </Badge>
     <Badge variant="warning">{reading.level}</Badge>
     <Badge>{t(topicTranslationKey[reading.topic])}</Badge>
     <Badge>{t("sample.minutes", { count: reading.estimatedMinutes })}</Badge>
    </div>
    <HanziText as="h1" size="card" weight="black">
     {reading.titleZh}
    </HanziText>
    {reading.titlePinyin ? (
     <PinyinText as="p" variant="bodySmall" tone="accent">
      {reading.titlePinyin}
     </PinyinText>
    ) : null}
    <Typography variant="bodySmall" tone="secondary">
     {reading.titleVi}
    </Typography>
    <Typography variant="bodySmall" tone="muted">
     {reading.whyWorthReadingVi}
    </Typography>
   </div>

   <Tabs
    value={tab}
    items={tabItems}
    onValueChange={setTab}
    aria-label={t("tabs.aria")}
   >
    <TabsContent value={tab} className="pt-4">
     {tab === "reader" ? (
      <div className="grid gap-4">
       {reading.paragraphs.map((paragraph) => (
        <Card key={paragraph.id} variant="section" padding="md" className="grid gap-2">
         {paragraph.roleVi ? (
          <Typography variant="caption" tone="muted" weight="bold">
           {paragraph.roleVi}
          </Typography>
         ) : null}
         <HanziText as="p" size="large" leading="relaxed" wrapping="breakWords">
          {paragraph.zh}
         </HanziText>
         {paragraph.pinyin ? (
          <PinyinText as="p" variant="bodySmall" tone="accent" leading="relaxed">
           {paragraph.pinyin}
          </PinyinText>
         ) : null}
         <Separator />
         <Typography as="p" tone="secondary" leading="relaxed">
          {paragraph.vi}
         </Typography>
        </Card>
       ))}
      </div>
     ) : null}
     {tab === "questions" ? <Questions reading={reading} /> : null}
     {tab === "vocabulary" ? (
      <div className="grid gap-3 sm:grid-cols-2">
       {reading.vocabulary.map((item) => (
        <Card key={item.id} variant="section" padding="md" className="grid gap-1">
         <div className="flex flex-wrap items-center gap-2">
          <HanziText as="h3" size="medium" weight="black">
           {item.hanzi}
          </HanziText>
          <Badge size="sm">{item.categoryVi}</Badge>
         </div>
         {item.pinyin ? (
          <PinyinText as="p" variant="caption" tone="accent">
           {item.pinyin}
          </PinyinText>
         ) : null}
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
     {tab === "grammar" ? (
      <div className="grid gap-3">
       {reading.grammarPoints.map((grammar, index) => (
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
     {tab === "source" ? (
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
       <Typography variant="bodySmall" tone="secondary">
        {reading.adaptationNoticeVi}
       </Typography>
       <Typography variant="bodySmall" tone="muted">
        {reading.verificationSummaryVi}
       </Typography>
       <Button type="button" variant="outline" size="toolbar" asChild className="justify-self-start">
        <a href={reading.source.url} target="_blank" rel="noreferrer">
         {t("generated.source.open")}
        </a>
       </Button>
       <Typography variant="caption" tone="muted">
        {t("generated.source.generatedBy", {
         provider: reading.generatedByProvider,
         model: reading.generatedByModel,
        })}
       </Typography>
      </Card>
     ) : null}
    </TabsContent>
   </Tabs>
  </div>
 );
}
