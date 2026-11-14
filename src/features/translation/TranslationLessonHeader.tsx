"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import type { HumanitiesDocumentResource } from "@/features/humanities/model/humanities-resource.schemas";
import {
 humanitiesPracticeContent,
 type HumanitiesPracticeTrack,
} from "@/features/humanities/humanities-practice-content";

import {
 translationCourseModuleOrder,
 type createTranslationSubmission,
 type translationTrackDocuments,
} from "./translation-workspace-utils";

type TranslationTrackDocuments = ReturnType<typeof translationTrackDocuments>;

export function TranslationLessonHeader({
 activeTrack,
 trackTitle,
 document,
 trackDocuments,
 selectedLessonIndex,
 onBack,
 onLessonList,
 onOpenDocument,
 onSelectTrack,
}: {
 activeTrack: HumanitiesPracticeTrack;
 trackTitle: string;
 document: HumanitiesDocumentResource["document"];
 trackDocuments: TranslationTrackDocuments;
 selectedLessonIndex: number;
 onBack: () => void;
 onLessonList: () => void;
 onOpenDocument: (documentId: TranslationTrackDocuments[number]["id"]) => void;
 onSelectTrack: (track: HumanitiesPracticeTrack) => void;
}) {
 const t = useTranslations("HumanitiesPractice");

 return (
  <>
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
       module: translationCourseModuleOrder(activeTrack, selectedLessonIndex),
       lesson: selectedLessonIndex,
       total: trackDocuments.length,
      })}
     </Badge>
     <Typography as="h1" variant="sectionTitle" weight="black">
      {document.title_zh}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {document.title_vi} · {document.genre_vi}
     </Typography>
    </div>
   </Card>
   <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t("nav.aria")}>
    <Button type="button" variant="outline" onClick={onLessonList}>
     {t("nav.lessonList")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={selectedLessonIndex <= 1}
     onClick={() => {
      const previous = trackDocuments[selectedLessonIndex - 2];
      if (previous !== undefined) onOpenDocument(previous.id);
     }}
    >
     {t("nav.previous")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={selectedLessonIndex >= trackDocuments.length}
     onClick={() => {
      const next = trackDocuments[selectedLessonIndex];
      if (next !== undefined) onOpenDocument(next.id);
     }}
    >
     {t("nav.next")}
    </Button>
    <Button
     type="button"
     variant={activeTrack === "translation" ? "active" : "outline"}
     onClick={() => {
      onSelectTrack("translation");
     }}
    >
     {t("tracks.translation.title")}
    </Button>
    <Button
     type="button"
     variant={activeTrack === "interpreting" ? "active" : "outline"}
     onClick={() => {
      onSelectTrack("interpreting");
     }}
    >
     {t("tracks.interpreting.title")}
    </Button>
   </nav>
  </>
 );
}

export function TranslationLessonGuide({
 activeTrack,
 lessonCount,
 hasPracticeMetadata,
 humanitiesEvaluation,
}: {
 activeTrack: HumanitiesPracticeTrack;
 lessonCount: number;
 hasPracticeMetadata: boolean;
 humanitiesEvaluation: Parameters<typeof createTranslationSubmission>[4];
}) {
 const t = useTranslations("HumanitiesPractice");
 const content = humanitiesPracticeContent[activeTrack];

 return (
  <>
   <Card variant="subtle" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="accent" weight="black">
       {t("detail.beginner")}
      </Typography>
      <Typography as="strong" variant="bodySmall" weight="black">
       {content.beginnerStart}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {content.detailStart}
      </Typography>
     </div>
     <Badge>{t("guide.count", { count: lessonCount })}</Badge>
    </div>
    <div className="grid gap-2">
     <Typography as="strong" variant="caption" weight="black">
      {t("detail.order")}
     </Typography>
     <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {content.workflow.map((step, index) => (
       <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <Badge variant="purple">{index + 1}</Badge>
        <Typography as="span" variant="caption" tone="muted">
         {step}
        </Typography>
       </li>
      ))}
     </ol>
    </div>
   </Card>
   {hasPracticeMetadata && humanitiesEvaluation !== undefined ? (
    <Card variant="section" padding="md" className="grid gap-3">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="accent" weight="black">
       {t("detail.newbieGuide")}
      </Typography>
      <Typography as="h2" variant="sectionTitle" weight="black">
       {activeTrack === "translation"
        ? t("detail.translationPrinciple")
        : t("detail.interpretingPrinciple")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {activeTrack === "translation"
        ? t("detail.translationPrincipleDescription")
        : t("detail.interpretingPrincipleDescription")}
      </Typography>
     </div>
     <Typography as="strong" variant="bodySmall" weight="black">
      {t("detail.requiredUnits", { count: humanitiesEvaluation.informationUnits.length })}
     </Typography>
     <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {content.workflow.slice(0, 5).map((step, index) => (
       <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <Badge variant="purple">{index + 1}</Badge>
        <Typography as="span" variant="caption" tone="muted">
         {step}
        </Typography>
       </li>
      ))}
     </ol>
     <Typography as="p" variant="caption" tone="muted">
      {t("detail.referenceNotice")}
     </Typography>
    </Card>
   ) : null}
  </>
 );
}
