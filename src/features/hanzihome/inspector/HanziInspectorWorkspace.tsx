"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Square, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { JsonValueSchema } from "@/types/json";
import { aiRuntimeReceiptSchema } from "@/lib/ai-task-contract";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import {
 analyzeContextualPronunciation,
 formatContextualSpokenPinyin,
 type ContextualPronunciationAnalysis,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { ContextualReaderText } from "@/features/hanzihome/reader/ContextualReaderText";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";

const lookupResponseSchema = z.strictObject({
 cached: z.boolean(),
 source: z.string().min(1),
 provenance: z.string().min(1),
 runtimeReceipt: aiRuntimeReceiptSchema.optional(),
 data: z.strictObject({
  id: z.string().optional(),
  dictionary_id: z.string().optional(),
  hanzi: z.string().min(1),
  pinyin: z.string(),
  sino_vietnamese: z.string().nullable(),
  meaning: z.string(),
  analysis: z.json(),
 }),
});

type LookupResponse = z.output<typeof lookupResponseSchema>;

export function HanziInspectorWorkspace() {
 const t = useTranslations("Inspector");
 const common = useTranslations("Common");
 const tts = useSharedMandarinTts();
 const [term, setTerm] = useState("");
 const [contextText, setContextText] = useState("");
 const [lookup, setLookup] = useState<LookupResponse | null>(null);
 const [analysis, setAnalysis] = useState<ContextualPronunciationAnalysis | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const requestRef = useRef<AbortController | null>(null);

 useEffect(() => () => requestRef.current?.abort(), []);

 const analyzedText = analysis?.normalizedText ?? "";
 const spokenPinyin = useMemo(
  () => (analysis === null ? "" : formatContextualSpokenPinyin(analysis)),
  [analysis],
 );

 const inspect = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const normalizedTerm = term.normalize("NFC").trim();
  const normalizedContext = contextText.normalize("NFC").trim();
  if (!normalizedTerm) return;

  requestRef.current?.abort();
  const controller = new AbortController();
  requestRef.current = controller;
  setIsLoading(true);
  setError(null);
  setLookup(null);
  setAnalysis(null);

  try {
   const response = await fetch("/api/lookup/basic", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ text: normalizedTerm }),
    signal: controller.signal,
   });
   const payload = JsonValueSchema.parse(await response.json().catch(() => null));
   const parsed = lookupResponseSchema.safeParse(payload);
   if (!response.ok || !parsed.success) {
    throw new Error(response.ok ? t("errors.contract") : t("errors.lookup"));
   }
   const nextLookup = parsed.data;
   const text = normalizedContext || nextLookup.data.hanzi;
   const nextAnalysis = analyzeContextualPronunciation(
    {
     text,
     sourcePinyin: text === nextLookup.data.hanzi ? nextLookup.data.pinyin : null,
    },
    [
     {
      id: nextLookup.data.id ?? nextLookup.data.hanzi,
      text: nextLookup.data.hanzi,
      pinyin: nextLookup.data.pinyin,
      priority: 100,
     },
    ],
   );
   setLookup(nextLookup);
   setAnalysis(nextAnalysis);
  } catch (caught) {
   if (caught instanceof DOMException && caught.name === "AbortError") return;
   setError(caught instanceof Error ? caught.message : t("errors.complete"));
  } finally {
   if (!controller.signal.aborted) setIsLoading(false);
  }
 };

 return (
  <div className="grid min-w-0 gap-5">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     {t("title")}
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     {t("description")}
    </Typography>
   </div>

   <Card variant="section" padding="md" className="grid">
    <form className="grid gap-4" onSubmit={inspect}>
     <label className="grid gap-2">
      <Typography as="span" variant="label" weight="bold">
       {t("fields.term")}
      </Typography>
      <Input
       value={term}
       onChange={(event) => setTerm(event.target.value)}
       maxLength={48}
       autoComplete="off"
       placeholder={t("fields.termPlaceholder")}
      />
     </label>
     <label className="grid gap-2">
      <Typography as="span" variant="label" weight="bold">
       {t("fields.context")}
      </Typography>
      <Textarea
       value={contextText}
       onChange={(event) => setContextText(event.target.value)}
       maxLength={500}
       placeholder={t("fields.contextPlaceholder")}
       className="min-h-24"
      />
     </label>
     <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={!term.trim() || isLoading}>
       <Search data-icon="inline-start" />
       {isLoading ? t("actions.inspecting") : t("actions.inspect")}
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={!analyzedText || !tts.selectedVoice}
       onClick={() => tts.speakSequence([analyzedText])}
      >
       <Volume2 data-icon="inline-start" />
       {common("actions.listen")}
      </Button>
      <Button
       type="button"
       variant="ghost"
       disabled={!tts.isSpeaking && !tts.isLoading}
       onClick={tts.stop}
      >
       <Square data-icon="inline-start" />
       {common("actions.stop")}
      </Button>
     </div>
    </form>
   </Card>

   {error ? (
    <Card variant="subtle" padding="md">
     <Typography variant="body" tone="danger">
      {error}
     </Typography>
    </Card>
   ) : null}

   {lookup && analysis ? (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
     <Card variant="section" padding="md" className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="grid gap-1">
        <Typography as="h2" variant="sectionTitle" weight="black" lang="zh-CN">
         {lookup.data.hanzi}
        </Typography>
        <Typography variant="body" tone="accent" lang="zh-Latn-pinyin">
         {lookup.data.pinyin || t("result.missingPinyin")}
        </Typography>
       </div>
       <div className="flex flex-wrap justify-end gap-1.5">
        <Badge variant="default" size="sm" casing="natural">
         {lookup.provenance}
        </Badge>
        {lookup.runtimeReceipt ? (
         <>
          <Badge variant="info" size="sm" casing="natural">
           {lookup.runtimeReceipt.provider}
          </Badge>
          <Badge variant="default" size="sm" casing="natural">
           {lookup.runtimeReceipt.model}
          </Badge>
         </>
        ) : null}
       </div>
      </div>
      <div className="grid gap-1">
       <Typography variant="label" weight="bold">
        {t("result.meaning")}
       </Typography>
       <Typography variant="body">{lookup.data.meaning || t("result.missingMeaning")}</Typography>
       {lookup.data.sino_vietnamese ? (
        <Typography variant="bodySmall" tone="muted">
         {t("result.sinoVietnamese", { value: lookup.data.sino_vietnamese })}
        </Typography>
       ) : null}
      </div>
     </Card>
     <Card variant="section" padding="md" className="grid min-w-0 gap-4 overflow-hidden">
      <div className="grid gap-1">
       <Typography as="h2" variant="sectionTitle" weight="black">
        {t("result.contextReading")}
       </Typography>
       <Typography variant="bodySmall" tone="muted" lang="zh-Latn-pinyin">
        {spokenPinyin || t("result.unresolvedReading")}
       </Typography>
      </div>
      <ContextualReaderText
       analysis={analysis}
       displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin: true }}
       className="max-w-full overflow-x-auto"
      />
      {analysis.unresolved.length > 0 ? (
       <Typography variant="caption" tone="warning">
        {t("result.unresolvedWarning")}
       </Typography>
      ) : null}
      {analysis.sourcePinyinStatus === "rejected" ? (
       <Typography variant="caption" tone="warning">
        {t("result.rejectedSourcePinyin")}
       </Typography>
      ) : null}
     </Card>
    </div>
   ) : null}
  </div>
 );
}
