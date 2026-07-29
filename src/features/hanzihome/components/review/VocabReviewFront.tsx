"use client";

import { BookOpen } from "lucide-react";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

export function VocabReviewFront({ item }: { item: Extract<ReviewItem, { type: "vocab" }> }) {
 const example = item.source.examples.find((entry) => entry.zh)?.zh;

 return (
  <div className="grid gap-3">
   <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
    <BookOpen className="h-5 w-5" />
   </div>
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
    <NativeMandarinSpeakButton text={item.prompt} />
   </div>
   {example && (
    <StudyInstructionText
     tone="default"
     weight="bold"
     leading="relaxed"
     className="mx-auto max-w-2xl rounded-xl bg-bg-subtle p-3"
    >
     {example}
    </StudyInstructionText>
   )}
  </div>
 );
}
