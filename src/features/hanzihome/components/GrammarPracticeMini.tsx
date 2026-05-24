"use client";

import { Card } from "@/components/ui/card";
import type { GrammarViewModel } from "@/features/hanzihome/types";

export function GrammarPracticeMini({
 point,
}: {
 point: GrammarViewModel | null;
}) {
 if (!point?.examplesParsed[0]) return null;
 const example = point.examplesParsed[0];

 return (
  <Card padding="md" className="rounded-xl">
   <div className="grid gap-2">
    <h3 className="text-base font-black text-text-primary">Practice nhanh</h3>
    <p className="text-sm text-text-secondary">
     Đọc câu ví dụ và tự nói lại bằng cùng công thức.
    </p>
    <p className="rounded-xl bg-bg-subtle p-3 font-black text-text-primary">
     {example.zh}
    </p>
   </div>
  </Card>
 );
}
