"use client";

import { BookOpen } from "lucide-react";

import { IconTile } from "@/components/ui/icon-tile";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";

export function VocabReviewFront({
 item,
 speakButtonClassName,
}: {
 item: Extract<ReviewItem, { type: "vocab" }>;
 speakButtonClassName?: string;
}) {
 const example = item.source.examples.find((entry) => entry.zh)?.zh;

 return (
  <div className="grid gap-3">
   <IconTile size="lg" tone="accent" className="mx-auto">
    <BookOpen />
   </IconTile>
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="extraLoose"
    transform="uppercase"
   >
    Nhớ nghĩa và cách dùng
   </StudyInstructionText>
   <div className="flex items-center justify-center gap-2">
    <HanziText as="h3" size="hero" weight="black" tracking="normal">
     {item.prompt}
    </HanziText>
    <MandarinSpeakButton text={item.prompt} className={speakButtonClassName} />
   </div>
   {example ? (
    <HanziText
     as="p"
     size="inherit"
     tone="default"
     weight="bold"
     leading="relaxed"
     className="mx-auto max-w-2xl rounded-xl bg-bg-subtle p-3"
    >
     {example}
    </HanziText>
   ) : null}
  </div>
 );
}
