import { ChevronDown } from "lucide-react";
import { NOTEBOOK_DEEP_DIVE_SOURCE_LABELS } from "@/features/notebook/data/notebookDeepDiveData";
import type { NotebookDeepDive } from "@/features/notebook/types";
import { Badge } from "@/components/ui/badge";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Typography } from "@/components/ui/typography";
import { useTranslations } from "next-intl";

export function NotebookDeepDive({ deepDive }: { deepDive: NotebookDeepDive }) {
 const t = useTranslations("Notebook");
 const sections: {
  key: keyof Omit<NotebookDeepDive, "src">;
  label: string;
  warning: boolean;
 }[] = [
  { key: "why", label: t("deepDive.why"), warning: false },
  { key: "pos", label: t("deepDive.position"), warning: false },
  { key: "decision", label: t("deepDive.decision"), warning: false },
  { key: "mistake", label: t("deepDive.mistake"), warning: true },
 ];

 return (
  <details className="group grid gap-3">
   <summary
    className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-2 py-2 marker:content-none [&::-webkit-details-marker]:hidden ${focusRingClassName}`}
   >
    <Typography as="span" variant="label" tone="default" weight="black">
     {t("deepDive.summary")}
    </Typography>
    <ChevronDown
     aria-hidden="true"
     className="size-4 shrink-0 text-text-muted transition-transform group-open:rotate-180"
    />
   </summary>

   <div className="grid gap-4 px-2 pb-1">
    <Typography as="p" variant="bodySmall" tone="secondary" weight="semibold" leading="standard">
     {t.rich("deepDive.instruction", {
      strong: (chunks) => <strong>{chunks}</strong>,
     })}
    </Typography>
    <div className="grid gap-4 sm:grid-cols-2">
     {sections.map((section) => (
      <section key={section.key} className="grid gap-1.5">
       <Typography
        as="p"
        variant="overline"
        tone={section.warning ? "warning" : "muted"}
        tracking="subtle"
       >
        {section.label}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="compact">
        {deepDive[section.key]}
       </Typography>
      </section>
     ))}
    </div>
    <div className="flex flex-wrap gap-1.5">
     {deepDive.src.map((source) => (
      <Badge key={source} variant="info" size="sm">
       {NOTEBOOK_DEEP_DIVE_SOURCE_LABELS[source]}
      </Badge>
     ))}
    </div>
   </div>
  </details>
 );
}
