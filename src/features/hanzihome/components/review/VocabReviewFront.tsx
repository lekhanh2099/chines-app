"use client";

import { BookOpen } from "lucide-react";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";

export function VocabReviewFront({ item }: { item: Extract<ReviewItem, { type: "vocab" }> }) {
 return (
  <div className="grid gap-3">
   <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
    <BookOpen className="h-5 w-5" />
   </div>
   <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
    Nhớ nghĩa và cách dùng
   </p>
   <h3 className="text-6xl font-black tracking-normal text-text-primary" lang="zh-CN">
    {item.prompt}
   </h3>
  </div>
 );
}
