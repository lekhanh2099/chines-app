import { Typography } from "@/components/ui/typography";
import { LearnerHanziText } from "@/components/patterns/learner-text";
import { ArrowLeftRight, CircleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Separator } from "@/components/ui/separator";
import type { NotebookComparisonItem, NotebookItem } from "@/features/notebook/types";
import { useTranslations } from "next-intl";

export function NotebookComparePanel({
 comparisons,
 items,
}: {
 comparisons: NotebookComparisonItem[];
 items: NotebookItem[];
}) {
 const t = useTranslations("Notebook");
 const itemByTerm = new Map(items.map((item) => [item.term, item]));

 return (
  <div className="grid gap-4">
   {comparisons.map((comparison) => {
    const comparedItems = comparison.terms
     .map((term) => itemByTerm.get(term))
     .filter((item): item is NotebookItem => Boolean(item));

    return (
     <Card key={comparison.id} variant="section" padding="lg" className="grid gap-5">
      <div className="flex items-start gap-3">
       <IconTile tone="inverse">
        <ArrowLeftRight />
       </IconTile>
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
         <section key={item.id} className="grid gap-2">
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
          <Typography as="p" variant="code" tone="accent" weight="bold">
           {item.pattern}
          </Typography>
         </section>
        ))}
       </div>
      ) : null}

      <Separator />

      <div className="grid gap-4 lg:grid-cols-2">
       <section className="grid gap-2" aria-label={t("compare.memoryRule")}>
        <Typography
         as="p"
         variant="overline"
         tone="success"
         weight="black"
         tracking="overline"
         transform="uppercase"
        >
         {t("compare.memoryRule")}
        </Typography>
        <Typography as="p" variant="bodySmall" tone="default" weight="semibold" leading="standard">
         {comparison.rule}
        </Typography>
       </section>
       <section className="grid gap-2" aria-label={t("compare.commonTrap")}>
        <Typography
         as="p"
         variant="overline"
         tone="warning"
         weight="black"
         tracking="overline"
         transform="uppercase"
         className="flex items-center gap-1.5"
        >
         <CircleAlert className="size-4" />
         {t("compare.commonTrap")}
        </Typography>
        <Typography as="p" variant="bodySmall" tone="default" weight="semibold" leading="standard">
         {comparison.danger}
        </Typography>
       </section>
      </div>
     </Card>
    );
   })}
  </div>
 );
}
