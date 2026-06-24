import { ArrowLeftRight, CircleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { NotebookComparisonItem, NotebookItem } from "@/features/notebook/types";

export function NotebookComparePanel({
 comparisons,
 items,
}: {
 comparisons: NotebookComparisonItem[];
 items: NotebookItem[];
}) {
 const itemByTerm = new Map(items.map((item) => [item.term, item]));

 return (
  <div className="grid gap-4">
   {comparisons.map((comparison) => {
    const comparedItems = comparison.terms
     .map((term) => itemByTerm.get(term))
     .filter((item): item is NotebookItem => Boolean(item));

    return (
     <Card key={comparison.id} variant="glass" padding="lg">
      <div className="flex items-start gap-3">
       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <ArrowLeftRight className="h-5 w-5" />
       </span>
       <div>
        <h2 lang="zh-CN" className="text-xl font-black text-text-primary">
         {comparison.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-text-muted">{comparison.note}</p>
       </div>
      </div>

      {comparedItems.length > 0 ? (
       <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {comparedItems.map((item) => (
         <div key={item.id} className="rounded-2xl border border-border-default bg-bg-card/80 p-4">
          <div className="flex items-baseline gap-2">
           <strong lang="zh-CN" className="font-hanzi text-3xl text-text-primary">
            {item.term}
           </strong>
           <span className="text-sm font-bold text-accent-text">{item.p}</span>
          </div>
          <p className="mt-2 font-bold text-text-secondary">{item.vi}</p>
          <p className="mt-3 text-sm font-medium leading-6 text-text-muted">{item.essence}</p>
          <p className="mt-3 rounded-xl bg-accent-subtle px-3 py-2 font-mono text-sm font-bold text-accent-text">
           {item.pattern}
          </p>
         </div>
        ))}
       </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
       <div className="rounded-xl border border-success/20 bg-success-subtle p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-success-text">
         Quy tắc nhớ
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-text-primary">{comparison.rule}</p>
       </div>
       <div className="rounded-xl border border-warning/20 bg-warning-subtle p-4">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-warning-text">
         <CircleAlert className="h-4 w-4" />
         Bẫy thường gặp
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-text-primary">
         {comparison.danger}
        </p>
       </div>
      </div>
     </Card>
    );
   })}
  </div>
 );
}
