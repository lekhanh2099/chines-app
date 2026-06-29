"use client";

import { GraduationCap } from "lucide-react";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";

export function GrammarReviewFront({ item }: { item: Extract<ReviewItem, { type: "grammar" }> }) {
 return (
  <div className="grid gap-4 text-left">
   <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-info-subtle text-info-text">
    <GraduationCap className="h-5 w-5" />
   </div>
   <div className="text-center grid gap-2">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
     Nhận diện ngữ pháp
    </p>
    <h3 className="text-3xl font-black tracking-tight text-text-primary">{item.prompt}</h3>
   </div>
   <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-4">
    <p className="font-black text-text-primary">Trước khi mở đáp án, tự trả lời:</p>
    <ul className="grid gap-1 font-semibold leading-relaxed text-text-secondary">
     <li>Ý nghĩa cốt lõi là gì?</li>
     <li>Công thức / pattern chính là gì?</li>
     <li>Dùng trong câu ví dụ nào?</li>
    </ul>
   </div>
  </div>
 );
}
