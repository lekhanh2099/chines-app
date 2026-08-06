import { Typography } from "@/components/ui/typography";
import { LearnerHanziText } from "@/components/patterns/learner-text";
import { CircleAlert, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NotebookDeepDive } from "@/features/notebook/components/NotebookDeepDive";
import { getNotebookDeepDive } from "@/features/notebook/data/notebookDeepDiveData";
import type { NotebookItem } from "@/features/notebook/types";

export function NotebookTermCard({ item }: { item: NotebookItem }) {
 const deepDive = getNotebookDeepDive(item);

 return (
  <Card variant="section" padding="none" className="overflow-hidden">
   <div className="grid gap-4 p-5">
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

    <div className="rounded-xl border border-primary/15 bg-accent-subtle/75 p-4 grid gap-2">
     <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-accent-text">
      <Sparkles className="h-4 w-4" />
      Bản chất
     </div>
     <Typography as="p" tone="default" weight="semibold" leading="standard">
      {item.essence}
     </Typography>
    </div>

    <div className="grid gap-2">
     <Typography
      as="p"
      variant="overline"
      tone="muted"
      weight="black"
      tracking="loose"
      transform="uppercase"
     >
      Công thức
     </Typography>
     <Typography
      as="p"
      lang="zh-CN"
      variant="code"
      tone="accent"
      weight="bold"
      className="rounded-xl border border-border-default bg-bg-card/80 px-4 py-3"
     >
      {item.pattern}
     </Typography>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
     <div className="rounded-xl bg-bg-subtle p-4 grid gap-2">
      <Typography
       as="p"
       variant="overline"
       tone="muted"
       weight="black"
       tracking="overline"
       transform="uppercase"
      >
       Dùng khi
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="standard">
       {item.use}
      </Typography>
     </div>
     <div className="rounded-xl bg-bg-subtle p-4 grid gap-2">
      <Typography
       as="p"
       variant="overline"
       tone="dangerStrong"
       weight="black"
       tracking="overline"
       transform="uppercase"
       className="flex items-center gap-1.5"
      >
       <CircleAlert className="h-4 w-4" />
       Tránh
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="standard">
       {item.avoid}
      </Typography>
     </div>
    </div>

    <NotebookDeepDive deepDive={deepDive} />

    <div className="border-t border-border-default pt-4 grid gap-1">
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
   </div>
  </Card>
 );
}
