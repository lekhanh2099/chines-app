"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
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
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="extraLoose"
     transform="uppercase"
     className="hidden sm:block"
    >
     Ôn tập
    </StudyInstructionText>
    <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
     {title}
    </Typography>
    {description && (
     <StudyInstructionText tone="muted" weight="semibold">
      {description}
     </StudyInstructionText>
    )}
   </div>

   {modes.length > 1 && (
    <>
     <div className="w-full sm:hidden">
      <Select
       value={mode}
       onValueChange={(value) => {
        const selectedMode = modes.find((item) => item.value === value);
        if (selectedMode) onModeChange(selectedMode.value);
       }}
      >
       <SelectTrigger width="full" size="sm" aria-label={title}>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        {modes.map((item) => (
         <SelectItem key={item.value} value={item.value}>
          {item.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <div className="hidden flex-wrap gap-2 sm:flex">
      {modes.map((item) => (
       <Button
        key={item.value}
        type="button"
        variant={mode === item.value ? "active" : "outline"}
        aria-pressed={mode === item.value}
        onClick={() => onModeChange(item.value)}
       >
        {item.label}
       </Button>
      ))}
     </div>
    </>
   )}
  </div>
 );
}
