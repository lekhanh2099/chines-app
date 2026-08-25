import { Typography } from "@/components/ui/typography";
import { LearnerHanziText } from "@/components/patterns/learner-text";
import { CircleAlert, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NotebookDeepDive } from "@/features/notebook/components/NotebookDeepDive";
import { getNotebookDeepDive } from "@/features/notebook/data/notebookDeepDiveData";
import type { NotebookItem } from "@/features/notebook/types";
import { useTranslations } from "next-intl";

export function NotebookTermCard({ item }: { item: NotebookItem }) {
 const t = useTranslations("Notebook");
 const deepDive = getNotebookDeepDive(item);

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex items-start justify-between gap-4">
    <div className="grid gap-1">
     <div className="flex flex-wrap items-baseline gap-3">
      <LearnerHanziText as="h2" variant="sectionTitle" tone="default" weight="black">
       {item.term}
      </LearnerHanziText>
      <Typography as="span" tone="accent" weight="bold">
       {item.p}
      </Typography>
     </div>
     <Typography as="p" tone="secondary" weight="bold">
      {item.vi}
     </Typography>
    </div>
    <div className="flex flex-wrap justify-end gap-1">
     {item.tags.slice(0, 2).map((tag) => (
      <Badge key={tag} variant="purple" size="sm">
       {tag}
      </Badge>
     ))}
    </div>
   </div>

   <section className="grid gap-2" aria-label={t("term.essence")}>
    <Typography
     as="div"
     variant="overline"
     tone="accent"
     weight="black"
     tracking="wide"
     transform="uppercase"
     className="flex items-center gap-2"
    >
     <Sparkles className="size-4" />
     {t("term.essence")}
    </Typography>
    <Typography as="p" tone="default" weight="semibold" leading="standard">
     {item.essence}
    </Typography>
   </section>

   <section className="grid gap-2" aria-label={t("term.pattern")}>
    <Typography
     as="p"
     variant="overline"
     tone="muted"
     weight="black"
     tracking="loose"
     transform="uppercase"
    >
     {t("term.pattern")}
    </Typography>
    <Typography
     as="p"
     lang="zh-CN"
     variant="code"
     tone="accent"
     weight="bold"
     wrapping="breakWords"
    >
     {item.pattern}
    </Typography>
   </section>

   <div className="grid gap-4 sm:grid-cols-2">
    <section className="grid gap-2" aria-label={t("term.use")}>
     <Typography
      as="p"
      variant="overline"
      tone="muted"
      weight="black"
      tracking="overline"
      transform="uppercase"
     >
      {t("term.use")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="standard">
      {item.use}
     </Typography>
    </section>
    <section className="grid gap-2" aria-label={t("term.avoid")}>
     <Typography
      as="p"
      variant="overline"
      tone="dangerStrong"
      weight="black"
      tracking="overline"
      transform="uppercase"
      className="flex items-center gap-1.5"
     >
      <CircleAlert className="size-4" />
      {t("term.avoid")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="standard">
      {item.avoid}
     </Typography>
    </section>
   </div>

   <Separator />
   <NotebookDeepDive deepDive={deepDive} />

   <Separator />
   <div className="grid gap-1">
    <LearnerHanziText as="p" variant="pageTitle" tone="default" leading="relaxed">
     {item.ex[0]}
    </LearnerHanziText>
    <Typography as="p" variant="bodySmall" tone="accent" weight="semibold" emphasis="italic">
     {item.ex[1]}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="muted" weight="medium">
     {item.ex[2]}
    </Typography>
   </div>
  </Card>
 );
}
