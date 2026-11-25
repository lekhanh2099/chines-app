"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { cn } from "@/lib/utils";

import type { DictationDiffSummary, DictationDiffToken } from "./dictation-comparison";

/** Shared per-character dictation diff and mistake summary badges. */
export function DictationDiffView({
 diff,
 summary,
 keyPrefix,
 showSummary = true,
}: {
 diff: DictationDiffToken[];
 summary: DictationDiffSummary;
 keyPrefix: string;
 showSummary?: boolean;
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
      key={`${keyPrefix}:${tokenIndex}:${token.kind}:${token.value}`}
      className={cn(
       token.kind === "match" && "text-success-text",
       token.kind === "missing" && "text-warning-text",
       token.kind !== "match" && token.kind !== "missing" && "text-danger-text",
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
   {showSummary ? (
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
