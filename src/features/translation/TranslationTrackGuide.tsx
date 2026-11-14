"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import { Link } from "@/i18n/navigation";
import {
 humanitiesPracticeContent,
 type HumanitiesPracticeTrack,
} from "@/features/humanities/humanities-practice-content";

import {
 translationCourseModuleOrder,
 type translationTrackDocuments,
} from "./translation-workspace-utils";

type TranslationTrackDocuments = ReturnType<typeof translationTrackDocuments>;

export function TranslationTrackGuide({
 activeTrack,
 trackTitle,
 trackDocuments,
 onTrackChange,
 onSelectDocument,
}: {
 activeTrack: HumanitiesPracticeTrack;
 trackTitle: string;
 trackDocuments: TranslationTrackDocuments;
 onTrackChange: (track: HumanitiesPracticeTrack) => void;
 onSelectDocument: (documentId: TranslationTrackDocuments[number]["id"]) => void;
}) {
 const t = useTranslations("HumanitiesPractice");
 const content = humanitiesPracticeContent[activeTrack];
 const trackDescription =
  activeTrack === "translation"
   ? t("tracks.translation.description")
   : t("tracks.interpreting.description");

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
   <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t("nav.aria")}>
    <Button asChild variant="navigation" wrap="normal">
     <Link href="/humanities">{t("nav.humanities")}</Link>
    </Button>
    <Button asChild variant="navigation" wrap="normal">
     <Link href="/reader">{t("nav.reader")}</Link>
    </Button>
    <div className="col-span-2 sm:col-span-3">
     <SegmentedControl<HumanitiesPracticeTrack>
      value={activeTrack}
      items={[
       { key: "translation", label: t("tracks.translation.title") },
       { key: "interpreting", label: t("tracks.interpreting.title") },
      ]}
      onChange={onTrackChange}
      aria-label={t("nav.chooseTrack")}
     />
    </div>
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
     <Badge>{t("guide.count", { count: trackDocuments.length })}</Badge>
    </div>
    <Typography as="p" variant="bodySmall" tone="muted">
     {content.definition}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("guide.chooseFoundation")}
    </Typography>
    <Card variant="subtle" padding="sm" className="grid gap-1">
     <Typography as="strong" variant="caption" tone="accent" weight="black">
      {t("guide.startHere")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {content.beginnerStart}
     </Typography>
    </Card>
   </Card>
   <TranslationTrackGuideSections activeTrack={activeTrack} />
   <TranslationTrackLibrary
    activeTrack={activeTrack}
    trackDocuments={trackDocuments}
    onSelectDocument={onSelectDocument}
   />
  </div>
 );
}

function TranslationTrackGuideSections({ activeTrack }: { activeTrack: HumanitiesPracticeTrack }) {
 const t = useTranslations("HumanitiesPractice");
 const content = humanitiesPracticeContent[activeTrack];

 return (
  <>
   <section className="grid gap-3" aria-labelledby="humanities-practice-levels">
    <div className="grid gap-1">
     <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-practice-levels">
      {t("guide.levelsTitle")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("guide.levelsDescription")}
     </Typography>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
     {content.levels.map((level, index) => (
      <Card key={level.title} variant="subtle" padding="md" className="grid gap-2">
       <Badge variant="purple" className="justify-self-start">
        {index + 1}
       </Badge>
       <Typography as="h3" variant="cardTitle" weight="black">
        {level.title}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="muted">
        {level.description}
       </Typography>
      </Card>
     ))}
    </div>
   </section>
   <section className="grid gap-3" aria-labelledby="humanities-foundation-lessons">
    <div className="grid gap-1">
     <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-foundation-lessons">
      {t("guide.foundationTitle")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("guide.foundationDescription")}
     </Typography>
    </div>
    <div className="grid gap-2">
     {content.foundationLessons.map((lesson, index) => (
      <Card asChild key={lesson.title} variant="default" padding="none" className="group">
       <details open={index === 0}>
        <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 p-3 [&::-webkit-details-marker]:hidden">
         <Badge variant="purple">{index + 1}</Badge>
         <span className="grid gap-1">
          <Typography as="strong" variant="bodySmall" weight="black">
           {lesson.title}
          </Typography>
          <Typography as="span" variant="caption" tone="muted">
           {lesson.question}
          </Typography>
         </span>
        </summary>
        <div className="grid gap-2 border-t border-border-default p-4">
         <Typography as="p" variant="bodySmall" tone="muted">
          {lesson.explanation}
         </Typography>
         <Typography as="p" variant="caption" tone="muted">
          {t("guide.understood")}
         </Typography>
        </div>
       </details>
      </Card>
     ))}
    </div>
   </section>
   <section className="grid gap-3 lg:grid-cols-2">
    <Card variant="subtle" padding="md" className="grid gap-2">
     <Typography as="h2" variant="cardTitle" weight="black">
      {t("guide.knowledge")}
     </Typography>
     {content.knowledge.map((item) => (
      <Typography key={item} as="p" variant="bodySmall" tone="muted">
       ✓ {item}
      </Typography>
     ))}
    </Card>
    <Card variant="subtle" padding="md" className="grid gap-2">
     <Typography as="h2" variant="cardTitle" weight="black">
      {t("guide.skills")}
     </Typography>
     {content.skills.map((item) => (
      <Typography key={item} as="p" variant="bodySmall" tone="muted">
       ✓ {item}
      </Typography>
     ))}
    </Card>
   </section>
   <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
    <Card variant="subtle" padding="md" className="grid gap-2">
     <Typography as="h2" variant="cardTitle" weight="black">
      {t("guide.workflow")}
     </Typography>
     {content.workflow.map((step, index) => (
      <Typography key={step} as="p" variant="bodySmall" tone="muted">
       {index + 1}. {step}
      </Typography>
     ))}
    </Card>
    <Card variant="subtle" padding="md" className="grid gap-2">
     <Typography as="h2" variant="cardTitle" weight="black">
      {t("guide.mistakes")}
     </Typography>
     {content.mistakes.map((item) => (
      <Typography key={item} as="p" variant="caption" tone="muted">
       • {item}
      </Typography>
     ))}
    </Card>
   </section>
  </>
 );
}

function TranslationTrackLibrary({
 activeTrack,
 trackDocuments,
 onSelectDocument,
}: {
 activeTrack: HumanitiesPracticeTrack;
 trackDocuments: TranslationTrackDocuments;
 onSelectDocument: (documentId: TranslationTrackDocuments[number]["id"]) => void;
}) {
 const t = useTranslations("HumanitiesPractice");

 return (
  <section className="grid gap-3" aria-labelledby="humanities-library">
   <div className="grid gap-1">
    <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-library">
     {t("guide.library")}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("guide.libraryDescription")}
    </Typography>
   </div>
   <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {trackDocuments.map((document, index) => {
     const lessonIndex = index + 1;
     const directionLabel = document.genre_vi || t("guide.defaultGenre");
     return (
      <Button
       key={document.id}
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant="surfaceCard"
       onClick={() => {
        onSelectDocument(document.id);
       }}
      >
       <Typography
        as="span"
        variant="caption"
        tone="accent"
        weight="black"
        className="w-full text-left"
       >
        {t("guide.moduleLesson", {
         module: translationCourseModuleOrder(activeTrack, lessonIndex),
         lesson: lessonIndex,
         total: trackDocuments.length,
        })}
       </Typography>
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        {document.title_zh}
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        {document.title_vi} · {directionLabel}
       </Typography>
      </Button>
     );
    })}
   </div>
  </section>
 );
}
