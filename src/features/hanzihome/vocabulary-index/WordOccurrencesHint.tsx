"use client";

import { useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

import { DetailHint } from "@/features/hanzihome/components/DetailHint";
import { Link } from "@/i18n/navigation";

import { useIsReusedVocabularyWord } from "./useVocabularyWords";
import { vocabularyWordHref } from "./vocabulary-index";
import { WordOccurrenceList } from "./WordOccurrenceList";

const previewOccurrenceCount = 5;

/**
 * A marker beside a word the learner has also met elsewhere. Hover (or tap on
 * touch) lists the meaning it carries in each place; pressing it opens the word
 * page. Renders nothing for a word that occurs only once.
 */
export function WordOccurrencesHint({ hanzi }: { hanzi: string }) {
 const t = useTranslations("Inspector.store");
 const [open, setOpen] = useState(false);
 const reused = useIsReusedVocabularyWord(hanzi);
 if (!reused) return null;
 const href = vocabularyWordHref(hanzi.trim());

 return (
  <DetailHint
   href={href}
   label={t("reuseHintAria", { hanzi })}
   open={open}
   onOpenChange={setOpen}
   icon={<Layers />}
  >
   <WordOccurrenceList hanzi={hanzi} enabled={open} limit={previewOccurrenceCount} />
   <Link
    href={href}
    prefetch={false}
    className="flex items-center gap-1 text-sm font-bold text-primary"
   >
    {t("openWord", { hanzi })}
    <ArrowRight className="size-3.5" />
   </Link>
  </DetailHint>
 );
}
