"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { GraduationCap } from "lucide-react";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";

export function GrammarReviewFront({ item }: { item: Extract<ReviewItem, { type: "grammar" }> }) {
 return (
  <div className="grid gap-4 text-left">
   <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-info-subtle text-info-text">
    <GraduationCap className="h-5 w-5" />
   </div>
   <div className="text-center grid gap-2">
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="extraLoose"
     transform="uppercase"
    >
     Nhận diện ngữ pháp
    </StudyInstructionText>
    <Typography as="h3" variant="cardTitle" tone="default" weight="black" tracking="tight">
     {item.prompt}
    </Typography>
   </div>
   <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-4">
    <StudyInstructionText tone="default" weight="black">
     Trước khi mở đáp án, tự trả lời:
    </StudyInstructionText>
    <ul className="grid gap-1 font-semibold leading-relaxed text-text-secondary">
     <li>Ý nghĩa cốt lõi là gì?</li>
     <li>Công thức / pattern chính là gì?</li>
     <li>Dùng trong câu ví dụ nào?</li>
    </ul>
   </div>
  </div>
 );
}
