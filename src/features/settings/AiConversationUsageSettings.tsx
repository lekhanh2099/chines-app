"use client";

import { BarChart3 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import {
 EMPTY_AI_USAGE_SNAPSHOT,
 getAiUsageSnapshot,
 subscribeAiUsage,
 SYSTEM_AI_USAGE_KEY,
} from "@/lib/ai-usage.client";

import { useManagedApiKeys } from "./useManagedApiKeys";

export function AiConversationUsageSettings() {
 const t = useTranslations("AiUsage");
 const locale = useLocale();
 const { query } = useManagedApiKeys();
 const [usage, setUsage] = useState(EMPTY_AI_USAGE_SNAPSHOT);

 useEffect(() => {
  const refreshUsage = () => setUsage(getAiUsageSnapshot());
  refreshUsage();
  return subscribeAiUsage(refreshUsage);
 }, []);

 const keyLabels = useMemo(
  () => new Map((query.data?.keys ?? []).map((key) => [key.id, key.label])),
  [query.data?.keys],
 );
 const runtimeEntries = Object.entries(usage.byKey).toSorted((left, right) =>
  (right[1].lastUsedAt || "").localeCompare(left[1].lastUsedAt || ""),
 );
 const numberFormatter = new Intl.NumberFormat(locale);
 const dateFormatter = new Intl.DateTimeFormat(locale, {
  dateStyle: "medium",
  timeStyle: "short",
 });
 const hasTokenData = usage.inputTokens > 0 || usage.outputTokens > 0 || usage.totalTokens > 0;
 const formatTokens = (value: number) => (hasTokenData ? numberFormatter.format(value) : "—");
 const lastUsedLabel = usage.lastUsedAt
  ? dateFormatter.format(new Date(usage.lastUsedAt))
  : t("never");

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex max-w-3xl items-start gap-3">
    <IconTile tone="accent" size="sm">
     <BarChart3 aria-hidden="true" />
    </IconTile>
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("title")}
     </Typography>
     <Typography as="p" tone="secondary" leading="standard">
      {t("description")}
     </Typography>
    </div>
   </div>

   <div className="grid grid-cols-2 gap-3 border-y border-border-default py-4 md:grid-cols-4">
    <UsageStat label={t("requests")} value={numberFormatter.format(usage.requests)} />
    <UsageStat label={t("inputTokens")} value={formatTokens(usage.inputTokens)} />
    <UsageStat label={t("outputTokens")} value={formatTokens(usage.outputTokens)} />
    <UsageStat label={t("totalTokens")} value={formatTokens(usage.totalTokens)} />
   </div>

   <div className="grid gap-1">
    <Typography variant="caption" tone="muted">
     {t("lastUsed")}
    </Typography>
    <Typography weight="semibold">{lastUsedLabel}</Typography>
   </div>

   {runtimeEntries.length === 0 ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("empty")}
    </Typography>
   ) : (
    <div className="grid border-y border-border-default">
     {runtimeEntries.map(([runtimeKey, runtimeUsage], index) => {
      const runtimeLabel =
       runtimeKey === SYSTEM_AI_USAGE_KEY
        ? t("systemRuntime")
        : keyLabels.get(runtimeKey) || runtimeUsage.provider;
      const runtimeHasTokenData = runtimeUsage.totalTokens > 0;

      return (
       <div
        key={runtimeKey}
        className={`flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between ${index > 0 ? "border-t border-border-default" : ""}`}
       >
        <div className="grid min-w-0 gap-0.5">
         <Typography weight="semibold" clamp="one">
          {runtimeLabel}
         </Typography>
         <Typography variant="caption" tone="muted" clamp="one">
          {runtimeUsage.provider} · {runtimeUsage.model}
         </Typography>
        </div>
        <Typography variant="bodySmall" tone="secondary">
         {t("runtimeUsage", {
          requests: numberFormatter.format(runtimeUsage.requests),
          tokens: runtimeHasTokenData ? numberFormatter.format(runtimeUsage.totalTokens) : "—",
         })}
        </Typography>
       </div>
      );
     })}
    </div>
   )}

   <Typography as="p" variant="caption" tone="muted" leading="standard">
    {hasTokenData ? t("scope") : t("scopeWithoutTokens")}
   </Typography>
  </Card>
 );
}

function UsageStat({ label, value }: { label: string; value: string }) {
 return (
  <div className="grid min-w-0 gap-1">
   <Typography variant="caption" tone="muted">
    {label}
   </Typography>
   <Typography weight="bold" clamp="one">
    {value}
   </Typography>
  </div>
 );
}
