"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";

/** Shadowing title, delay/position summary and paragraph navigation. */
export function ShadowingPracticeHeader({
 delayMs,
 activeIndex,
 total,
 navigationDisabled,
 onPrevious,
 onNext,
}: {
 delayMs: number;
 activeIndex: number;
 total: number;
 navigationDisabled: boolean;
 onPrevious: () => void;
 onNext: () => void;
}) {
 const t = useTranslations("Reader.study.shadowing");

 return (
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div className="grid gap-1">
    <Typography as="h3" variant="cardTitle" weight="black">
     Shadowing
    </Typography>
    <Typography variant="caption" tone="muted">
     {t("description", { delay: delayMs, current: activeIndex + 1, total })}
    </Typography>
   </div>
   <div className="flex items-center gap-1">
    <Button
     type="button"
     size="icon-xs"
     variant="ghost"
     disabled={activeIndex === 0 || navigationDisabled}
     onClick={onPrevious}
     aria-label={t("previous")}
    >
     <ChevronLeft />
    </Button>
    <Button
     type="button"
     size="icon-xs"
     variant="ghost"
     disabled={activeIndex >= total - 1 || navigationDisabled}
     onClick={onNext}
     aria-label={t("next")}
    >
     <ChevronRight />
    </Button>
   </div>
  </div>
 );
}
