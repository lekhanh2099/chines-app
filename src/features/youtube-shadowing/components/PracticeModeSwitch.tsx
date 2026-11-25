"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Typography } from "@/components/ui/display/typography";
import {
 SegmentedControl,
 type SegmentedControlItem,
} from "@/components/ui/forms/segmented-control";
import { usePathname, useRouter } from "@/i18n/navigation";

import { practiceModeSchema, type PracticeMode } from "../model/practice-mode";

export function PracticeModeSwitch({
 value,
 canUseDictation,
 showUntimedHint,
 onBeforeChange,
}: {
 value: PracticeMode;
 canUseDictation: boolean;
 showUntimedHint: boolean;
 onBeforeChange: (nextMode: PracticeMode) => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();

 const items: SegmentedControlItem<PracticeMode>[] = useMemo(
  () => [
   {
    key: practiceModeSchema.enum.shadowing,
    label: t("dictationMode.tabShadowing"),
   },
   {
    key: practiceModeSchema.enum.dictation,
    label: t("dictationMode.tabDictation"),
    disabled: !canUseDictation,
   },
  ],
  [canUseDictation, t],
 );

 const handleChange = (nextMode: PracticeMode) => {
  if (nextMode === value) return;
  if (nextMode === practiceModeSchema.enum.dictation && !canUseDictation) return;
  onBeforeChange(nextMode);

  const nextParams = new URLSearchParams(searchParams.toString());
  if (nextMode === practiceModeSchema.enum.dictation) {
   nextParams.set("mode", practiceModeSchema.enum.dictation);
  } else {
   nextParams.delete("mode");
  }
  const query = nextParams.toString();
  router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
 };

 return (
  <div className="grid min-w-0 gap-1">
   <SegmentedControl
    value={value}
    items={items}
    density="toolbar"
    layout="wrap"
    aria-label={t("dictationMode.switchAria")}
    onChange={handleChange}
   />
   {showUntimedHint ? (
    <Typography as="p" variant="caption" tone="muted">
     {t("dictationMode.untimedDisabledHint")}
    </Typography>
   ) : null}
  </div>
 );
}
