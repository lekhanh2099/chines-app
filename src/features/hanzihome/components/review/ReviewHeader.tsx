"use client";

import { Button } from "@/components/ui/button";
import type { ReviewDeckMode } from "@/features/hanzihome/hooks/useVocabReviewSession";
import { deckModeOptions } from "./reviewDeckModes";

type ReviewHeaderProps = {
 mode: ReviewDeckMode;
 modes?: Array<{ value: ReviewDeckMode; label: string }>;
 title?: string;
 description?: string;
 onModeChange: (mode: ReviewDeckMode) => void;
};

export function ReviewHeader({
 mode,
 modes = deckModeOptions,
 title = "Ôn tập chủ động",
 description,
 onModeChange,
}: ReviewHeaderProps) {
 return (
  <div className="flex flex-wrap items-end justify-between gap-3">
   <div>
    <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Ôn tập</p>
    <h2 className="text-2xl font-black text-text-primary">{title}</h2>
    {description && <p className="font-semibold text-text-muted">{description}</p>}
   </div>

   {modes.length > 1 && (
    <div className="flex flex-wrap gap-2">
     {modes.map((item) => (
      <Button
       key={item.value}
       type="button"
       variant={mode === item.value ? "active" : "outline"}
       onClick={() => onModeChange(item.value)}
      >
       {item.label}
      </Button>
     ))}
    </div>
   )}
  </div>
 );
}
