import { Typography } from "@/components/ui/typography";
import { LearnerHanziText } from "@/components/patterns/learner-text";
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
      <div className="grid gap-5">
       <div className="flex items-start gap-3">
        <Typography
         as="span"
         tone="inverse"
         className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary"
        >
         <ArrowLeftRight className="h-5 w-5" />
        </Typography>
        <div className="grid gap-1">
         <Typography as="h2" variant="sectionTitle" lang="zh-CN" tone="default" weight="black">
          {comparison.title}
         </Typography>
         <Typography as="p" variant="bodySmall" tone="muted" weight="medium">
          {comparison.note}
         </Typography>
        </div>
       </div>

       {comparedItems.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
         {comparedItems.map((item) => (
          <div
           key={item.id}
           className="rounded-2xl border border-border-default bg-bg-card/80 p-4 grid gap-3"
          >
           <div className="flex items-baseline gap-2">
            <LearnerHanziText as="strong" size="display" tone="default">
             {item.term}
            </LearnerHanziText>
            <Typography variant="label" tone="accent" weight="bold">
             {item.p}
            </Typography>
           </div>
           <Typography as="p" tone="secondary" weight="bold">
            {item.vi}
           </Typography>
           <Typography as="p" variant="bodySmall" tone="muted" weight="medium" leading="standard">
            {item.essence}
           </Typography>
           <Typography
            as="p"
            variant="code"
            tone="accent"
            weight="bold"
            className="rounded-xl bg-accent-subtle px-3 py-2"
           >
            {item.pattern}
           </Typography>
          </div>
         ))}
        </div>
       ) : null}

       <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-success/20 bg-success-subtle p-4 grid gap-2">
         <Typography
          as="p"
          variant="overline"
          tone="success"
          weight="black"
          tracking="overline"
          transform="uppercase"
         >
          Quy tắc nhớ
         </Typography>
         <Typography as="p" variant="bodySmall" tone="default" weight="semibold" leading="standard">
          {comparison.rule}
         </Typography>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning-subtle p-4 grid gap-2">
         <Typography
          as="p"
          variant="overline"
          tone="warning"
          weight="black"
          tracking="overline"
          transform="uppercase"
          className="flex items-center gap-1.5"
         >
          <CircleAlert className="h-4 w-4" />
          Bẫy thường gặp
         </Typography>
         <Typography as="p" variant="bodySmall" tone="default" weight="semibold" leading="standard">
          {comparison.danger}
         </Typography>
        </div>
       </div>
      </div>
     </Card>
    );
   })}
  </div>
 );
}
