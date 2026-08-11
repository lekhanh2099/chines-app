"use client";

import { GraduationCap } from "lucide-react";

import { IconTile } from "@/components/ui/icon-tile";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";

export function GrammarReviewFront({ item }: { item: Extract<ReviewItem, { type: "grammar" }> }) {
 return (
  <div className="grid gap-4 text-left">
   <IconTile size="lg" tone="info" className="mx-auto">
    <GraduationCap />
   </IconTile>
   <div className="grid gap-2 text-center">
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="extraLoose"
     transform="uppercase"
    >
     Nhận diện ngữ pháp
    </StudyInstructionText>
    <HanziText as="h3" size="large" tone="default" weight="black" tracking="tight">
     {item.prompt}
    </HanziText>
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
