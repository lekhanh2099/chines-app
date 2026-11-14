"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import {
 ReaderHanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { TranslationDirection } from "@/features/hanzihome/practice/translation-practice";
import type { HumanitiesDocumentResource } from "@/features/humanities/model/humanities-resource.schemas";

import type {
 translationResourceSegments,
 translationSourceKind,
} from "./translation-workspace-utils";

export const TranslationSourcePanel = memo(function TranslationSourcePanel({
 segment,
 direction,
 titleVi,
 sourceKind,
 totalSegments,
 glossary,
 onDirectionChange,
}: {
 segment: ReturnType<typeof translationResourceSegments>[number];
 direction: TranslationDirection;
 titleVi: HumanitiesDocumentResource["document"]["title_vi"];
 sourceKind: ReturnType<typeof translationSourceKind>;
 totalSegments: number;
 glossary: HumanitiesDocumentResource["exerciseItems"][number]["payload"]["glossary"];
 onDirectionChange: (direction: TranslationDirection) => void;
}) {
 const t = useTranslations("HumanitiesPractice");
 return (
  <Card variant="section" padding="md" className="grid min-w-0 content-start gap-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <Typography as="h2" variant="cardTitle" weight="black">
     {t("source.title")}
    </Typography>
    <Badge>{direction === "zh-vi" ? t("source.directionZhVi") : t("source.directionViZh")}</Badge>
   </div>
   <Typography as="p" variant="caption" tone="muted">
    {t("source.segment", {
     order: segment.order,
     total: totalSegments,
     source: sourceKind,
    })}
   </Typography>
   {direction === "zh-vi" ? (
    <ReaderHanziText
     displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin: true, showMeaning: false }}
     leading="learner"
     wrapping="preWrap"
    >
     {segment.zh}
    </ReaderHanziText>
   ) : (
    <Typography as="p" variant="body" wrapping="preWrap" leading="relaxed">
     {segment.vi || titleVi}
    </Typography>
   )}
   {segment.pinyin ? (
    <PinyinText variant="bodySmall" tone="accent" weight="semibold">
     {segment.pinyin}
    </PinyinText>
   ) : null}
   <div className="grid gap-2 border-t border-border-default pt-3">
    <Typography as="span" variant="caption" tone="muted" weight="black">
     {t("source.glossary")}
    </Typography>
    {glossary === undefined || glossary.length === 0 ? (
     <Typography as="p" variant="caption" tone="muted">
      {t("source.noGlossary")}
     </Typography>
    ) : (
     glossary.map((entry) => (
      <div key={entry.id} className="grid gap-1 border-b border-border-default pb-2 last:border-0">
       <Typography as="strong" variant="bodySmall" weight="black">
        {entry.headword} {entry.pinyin === null ? "" : entry.pinyin}
       </Typography>
       <Typography as="p" variant="caption" tone="muted">
        {entry.meaningVi}
       </Typography>
       <Typography as="p" variant="caption" tone="muted">
        {entry.noteVi}
       </Typography>
      </div>
     ))
    )}
   </div>
   <div className="grid grid-cols-2 gap-2">
    <Button
     type="button"
     variant={direction === "zh-vi" ? "active" : "outline"}
     onClick={() => {
      onDirectionChange("zh-vi");
     }}
    >
     {t("source.zhViButton")}
    </Button>
    <Button
     type="button"
     variant={direction === "vi-zh" ? "active" : "outline"}
     onClick={() => {
      onDirectionChange("vi-zh");
     }}
    >
     {t("source.viZhButton")}
    </Button>
   </div>
  </Card>
 );
});
