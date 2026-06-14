import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";

import type { GrammarReading } from "./grammar-reading";

export function GrammarReadingReader({ reading }: { reading: GrammarReading }) {
 return (
  <Card
   padding="lg"
   className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
  >
   <article className="grid gap-3">
    <div className="grid gap-1">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">{reading.title}</p>
     <h2 className="text-2xl font-black tracking-normal text-text-primary">Bài đọc áp dụng</h2>
    </div>

    <MarkdownContent content={reading.contentMd} className="gap-3" />
   </article>
  </Card>
 );
}
