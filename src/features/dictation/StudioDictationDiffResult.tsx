"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { cn } from "@/lib/utils";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import type { buildDictationDiff } from "@/features/hanzihome/practice/dictation-comparison";
import type { useStudioDictationSession } from "./useStudioDictationSession";

type StudioDictationSession = ReturnType<typeof useStudioDictationSession>;

type DictationTokenTone = "success" | "warning" | "danger";

function tokenTone(
 kind: ReturnType<typeof buildDictationDiff>[number]["kind"],
): DictationTokenTone {
 if (kind === "match") return "success";
 if (kind === "missing") return "warning";
 return "danger";
}

/** Checked answer: per-token diff against the target plus the mistake summary badges. */
export function StudioDictationDiffResult({
 entry,
 diff,
 summary,
}: {
 entry: ListeningTranscriptEntry;
 diff: StudioDictationSession["diff"];
 summary: StudioDictationSession["summary"];
}) {
 const t = useTranslations("Dictation");

 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <Typography
    as="div"
    variant="sectionTitle"
    weight="medium"
    leading="relaxed"
    tracking="wide"
    wrapping="breakWords"
    lang="zh-CN"
   >
    {diff.map((token, tokenIndex) => (
     <span
      key={`${entry.id}:${tokenIndex}:${token.kind}:${token.value}`}
      className={cn(
       tokenTone(token.kind) === "success" && "text-success-text",
       tokenTone(token.kind) === "warning" && "text-warning-text",
       tokenTone(token.kind) === "danger" && "text-danger-text",
       token.kind === "missing" && "line-through opacity-75",
      )}
      title={
       token.expected && token.actual && token.expected !== token.actual
        ? t("expected", { value: token.expected })
        : undefined
      }
     >
      {token.kind === "missing" ? `(${token.expected})` : token.value}
     </span>
    ))}
   </Typography>
   {summary ? (
    <div className="flex flex-wrap gap-2">
     <Badge variant="success" casing="natural">
      {t("correct", { count: summary.correct })}
     </Badge>
     {summary.replaced > 0 ? (
      <Badge variant="danger" casing="natural">
       {t("replaced", { count: summary.replaced })}
      </Badge>
     ) : null}
     {summary.missing > 0 ? (
      <Badge variant="warning" casing="natural">
       {t("missing", { count: summary.missing })}
      </Badge>
     ) : null}
     {summary.extra > 0 ? (
      <Badge variant="danger" casing="natural">
       {t("extra", { count: summary.extra })}
      </Badge>
     ) : null}
     {summary.transposed > 0 ? (
      <Badge variant="warning" casing="natural">
       {t("transposed", { count: summary.transposed })}
      </Badge>
     ) : null}
    </div>
   ) : null}
  </Card>
 );
}
