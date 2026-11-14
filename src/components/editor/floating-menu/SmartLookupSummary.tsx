"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import type { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";

export function SmartLookupSummary({
 smartLoading,
 smartError,
 error,
 smartData,
 smartMode,
}: {
 smartLoading: boolean;
 smartError: boolean;
 error: ReturnType<typeof useSmartSelectionInsights>["error"];
 smartData: ReturnType<typeof useSmartSelectionInsights>["data"];
 smartMode: ReturnType<typeof useSmartSelectionInsights>["mode"];
}) {
 if (smartLoading) {
  return (
   <div className="flex items-center justify-center gap-2 rounded-lg bg-bg-card/70 py-2.5 px-3 border border-border-default/40">
    <Loader2 className="size-3.5 animate-spin text-accent-text" />
    <Typography variant="caption" tone="muted">
     Đang tra cứu từ điển AI...
    </Typography>
   </div>
  );
 }

 if (smartError) {
  return (
   <div className="rounded-lg bg-bg-card/70 p-2 border border-border-default/40" role="alert">
    <Typography as="p" variant="caption" tone="danger" weight="semibold">
     {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
    </Typography>
   </div>
  );
 }

 if (!smartData) return null;

 const wordPos = smartData.definitions[0]?.pos || smartData.entry.ai_analysis?.word_type;
 const wordMeaning =
  smartData.meaning_summary ||
  smartData.definitions[0]?.meaning ||
  smartData.definitions[0]?.text ||
  smartData.entry.meaning ||
  "Chưa có nghĩa";

 if (smartMode === "word") {
  return (
   <div className="grid gap-1.5 rounded-lg bg-bg-card/70 p-2.5 border border-border-default/40">
    <div className="flex items-baseline justify-between gap-2">
     <div className="flex items-baseline gap-2">
      <Typography as="span" variant="sectionTitle" tone="default" weight="bold">
       {smartData.entry.hanzi}
      </Typography>
      {smartData.entry.pinyin ? (
       <Typography as="span" variant="bodySmall" tone="accent" weight="semibold">
        {smartData.entry.pinyin}
       </Typography>
      ) : null}
      {wordPos ? (
       <Badge variant="default" size="sm" casing="natural">
        {wordPos}
       </Badge>
      ) : null}
     </div>
    </div>

    <Typography as="p" variant="caption" tone="secondary" leading="standard" clamp="two">
     {wordMeaning}
    </Typography>

    {smartData.definitions[1] ? (
     <Typography as="p" variant="caption" tone="muted" leading="compact" clamp="one">
      2. {smartData.definitions[1].meaning || smartData.definitions[1].text}
     </Typography>
    ) : null}
   </div>
  );
 }

 return (
  <div className="grid gap-1.5 rounded-lg bg-bg-card/70 p-2.5 border border-border-default/40">
   <div className="flex items-baseline gap-2">
    <Typography as="span" variant="bodySmall" tone="default" weight="bold">
     {smartData.selection}
    </Typography>
    {smartData.entry.pinyin ? (
     <Typography as="span" variant="caption" tone="muted">
      {smartData.entry.pinyin}
     </Typography>
    ) : null}
   </div>

   {smartData.translation ? (
    <Typography as="p" variant="caption" tone="secondary" leading="standard">
     {smartData.translation}
    </Typography>
   ) : null}

   {smartData.grammar_points[0]?.explanation ? (
    <Typography as="p" variant="caption" tone="muted" leading="compact">
     Ngữ pháp: {smartData.grammar_points[0].explanation}
    </Typography>
   ) : null}
  </div>
 );
}
