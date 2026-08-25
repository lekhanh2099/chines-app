import { Typography } from "@/components/ui/typography";
import { BookOpenCheck, ListChecks } from "lucide-react";

import { Card } from "@/components/ui/card";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { IconTile } from "@/components/ui/icon-tile";
import { Separator } from "@/components/ui/separator";
import type { NotebookSection } from "@/features/notebook/types";
import { useTranslations } from "next-intl";

export function NotebookSectionGuide({ section }: { section: NotebookSection }) {
 const t = useTranslations("Notebook");

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex items-center gap-3">
    <IconTile>
     <BookOpenCheck />
    </IconTile>
    <div>
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      {t("guide.title", { section: section.label })}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" weight="medium">
      {t("guide.description")}
     </Typography>
    </div>
   </div>

   <Separator />

   <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {section.principles.map((principle, index) => (
     <section
      key={principle}
      className="grid gap-1"
      aria-label={t("guide.step", { number: index + 1 })}
     >
      <Typography
       as="p"
       variant="overline"
       tone="accent"
       weight="black"
       tracking="overline"
       transform="uppercase"
      >
       {t("guide.step", { number: index + 1 })}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="standard">
       {principle}
      </Typography>
     </section>
    ))}
   </div>

   <Separator />

   <details className="group grid gap-3">
    <summary
     className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 marker:content-none [&::-webkit-details-marker]:hidden ${focusRingClassName}`}
    >
     <ListChecks className="size-4 text-accent-text" />
     <Typography as="span" variant="label" weight="black">
      {t("guide.quickLookup")}
     </Typography>
     <Typography variant="caption" tone="muted" className="ml-auto group-open:hidden">
      {t("guide.open")}
     </Typography>
     <Typography variant="caption" tone="muted" className="ml-auto hidden group-open:inline">
      {t("guide.close")}
     </Typography>
    </summary>
    <div className="grid gap-3 px-2 sm:grid-cols-2 lg:grid-cols-3">
     {section.quick.map(([label, value]) => (
      <section key={`${label}-${value}`} className="grid gap-1">
       <Typography
        as="p"
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        {label}
       </Typography>
       <Typography
        as="p"
        lang="zh-CN"
        variant="bodySmall"
        tone="default"
        weight="semibold"
        leading="standard"
       >
        {value}
       </Typography>
      </section>
     ))}
    </div>
   </details>
  </Card>
 );
}
