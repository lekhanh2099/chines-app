"use client";

import { useState } from "react";
import { Copy, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";

import { HSK_GRAMMAR_EXAMPLE_TIERS } from "./hsk-grammar.constants";
import type {
 HskGrammarExampleTier,
 HskGrammarItem,
} from "./hsk-grammar.schemas";

export function HskGrammarExamples({ item }: { item: HskGrammarItem }) {
 const t = useTranslations("HskGrammar.examples");
 const tts = useSharedMandarinTts();
 const firstAvailableTier =
  HSK_GRAMMAR_EXAMPLE_TIERS.find((tier) => item.examples[tier].length > 0) ?? "source";
 const [activeTier, setActiveTier] = useState<HskGrammarExampleTier>(firstAvailableTier);
 const tabs = HSK_GRAMMAR_EXAMPLE_TIERS.map((tier) => ({
  key: tier,
  label: t(tier),
  suffix: (
   <Typography as="span" variant="caption" tone="muted">
    {item.examples[tier].length}
   </Typography>
  ),
  disabled: item.examples[tier].length === 0,
 }));

 const getOriginLabel = (
  origin: HskGrammarItem["examples"][HskGrammarExampleTier][number]["origin"],
 ) => {
  if (origin === "source_normalized") return t("normalized");
  if (origin === "source_corrected") return t("corrected");
  return t("editorial");
 };

 const copyExample = async (text: string) => {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
 };

 return (
  <Tabs
   value={activeTier}
   onValueChange={setActiveTier}
   items={tabs}
   aria-label={t("source")}
   className="grid min-w-0 gap-3"
  >
   {HSK_GRAMMAR_EXAMPLE_TIERS.map((tier) => (
    <TabsContent key={tier} value={tier} className="min-w-0">
     <div className="grid min-w-0">
      {item.examples[tier].map((example, index) => (
       <div key={`${tier}-${index}`} className="grid min-w-0 gap-2 py-4 first:pt-2 last:pb-0">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
         <div className="grid min-w-0 flex-1 gap-1.5">
          <HanziText as="p" size="large" variant="body" weight="bold" leading="relaxed">
           {example.zh}
          </HanziText>
          <PinyinText as="p" variant="bodySmall">
           {example.pinyin}
          </PinyinText>
          <TranslationText as="p" variant="bodySmall" tone="default">
           {example.vi}
          </TranslationText>
         </div>
         <div className="flex shrink-0 items-center gap-1">
          <Button
           type="button"
           size="icon-toolbar"
           variant="ghost"
           aria-label={t("listen")}
           disabled={tts.isLoading}
           onClick={() => tts.speakSequence([example.zh])}
          >
           <Volume2 />
          </Button>
          <Button
           type="button"
           size="icon-toolbar"
           variant="ghost"
           aria-label={t("copy")}
           onClick={() => void copyExample(example.zh)}
          >
           <Copy />
          </Button>
         </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
         <Badge
          variant={example.origin === "editorial" ? "default" : "info"}
          size="sm"
          casing="natural"
         >
          {getOriginLabel(example.origin)}
         </Badge>
         {example.note_vi ? (
          <HanziAwareText as="p" text={example.note_vi} variant="caption" tone="muted" />
         ) : null}
        </div>

        {index < item.examples[tier].length - 1 ? <Separator /> : null}
       </div>
      ))}
     </div>
    </TabsContent>
   ))}
  </Tabs>
 );
}
