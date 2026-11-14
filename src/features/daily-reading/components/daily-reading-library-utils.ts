import type { ComponentProps } from "react";
import type { z } from "zod";

import type { Badge } from "@/components/ui/display/badge";
import { analyzeContextualPronunciation } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type {
 DailyReading,
 DailyReadingTopic,
 dailyReadingVocabularyDataSchema,
} from "@/features/daily-reading/model/daily-reading.schemas";
import { getDailyReadingLearningSummary } from "@/features/daily-reading/model/daily-reading-view-model";

export type LibraryView = "articles" | "activity";
export type DailyReadingTab =
 | "reader"
 | "notes"
 | "support"
 | "questions"
 | "vocabulary"
 | "grammar"
 | "source";
type DailyReadingTabTranslationKey =
 | "tabs.reader"
 | "tabs.notes"
 | "detail.supportTab"
 | "tabs.questions"
 | "tabs.vocabulary"
 | "tabs.grammar"
 | "tabs.source";

export type DailyReadingVocabularyItem = z.output<
 typeof dailyReadingVocabularyDataSchema
>["items"][number];

export const fallbackTabs: readonly DailyReadingTab[] = ["reader", "notes", "support", "source"];
const contextualPronunciationMaximumCharacters = 2_000;

export const emptyReaderDocument: ReaderDocumentModel = {
 id: "empty",
 language: "zh-CN",
 source: {
  kind: "article",
  sourceId: "empty",
  href: "",
  label: "",
 },
 sections: [],
 segments: [],
 metadata: [],
 capabilities: ["pinyin", "translation"],
};

type TopicTranslationKey =
 | "generated.topic.culture"
 | "generated.topic.education"
 | "generated.topic.history"
 | "generated.topic.language"
 | "generated.topic.science"
 | "generated.topic.society"
 | "generated.topic.travel"
 | "generated.topic.environment"
 | "generated.topic.health";

export function getTopicTranslationKey(topic: DailyReadingTopic): TopicTranslationKey {
 switch (topic) {
  case "culture":
   return "generated.topic.culture";
  case "education":
   return "generated.topic.education";
  case "history":
   return "generated.topic.history";
  case "language":
   return "generated.topic.language";
  case "science":
   return "generated.topic.science";
  case "society":
   return "generated.topic.society";
  case "travel":
   return "generated.topic.travel";
  case "environment":
   return "generated.topic.environment";
  case "health":
   return "generated.topic.health";
 }
}

export function findDailyReading(items: readonly DailyReading[], id: string) {
 return items.find((item) => item.id === id) ?? null;
}

export function availableTabs(reading: DailyReading): readonly DailyReadingTab[] {
 const tabs: DailyReadingTab[] = ["reader", "notes", "support"];
 if (reading.enrichment.vocabulary.status === "ready") tabs.push("vocabulary");
 if (reading.enrichment.grammar.status === "ready") tabs.push("grammar");
 if (reading.enrichment.questions.status === "ready") tabs.push("questions");
 tabs.push("source");
 return tabs;
}

export function tabLabelKey(tab: DailyReadingTab): DailyReadingTabTranslationKey {
 switch (tab) {
  case "reader":
   return "tabs.reader";
  case "notes":
   return "tabs.notes";
  case "support":
   return "detail.supportTab";
  case "questions":
   return "tabs.questions";
  case "vocabulary":
   return "tabs.vocabulary";
  case "grammar":
   return "tabs.grammar";
  case "source":
   return "tabs.source";
 }
}

export function analyzeDailyReadingText(text: string) {
 if (text.length === 0 || text.length > contextualPronunciationMaximumCharacters) return null;
 try {
  return analyzeContextualPronunciation({ text });
 } catch {
  return null;
 }
}

export function learningStatusVariant(
 reading: DailyReading,
): ComponentProps<typeof Badge>["variant"] {
 const summary = getDailyReadingLearningSummary(reading);
 if (summary.complete) return "success";
 if (summary.running) return "info";
 if (summary.attention) return "warning";
 return "default";
}

export function filterDailyReadingArticles(
 items: readonly DailyReading[],
 searchQuery: string,
): readonly DailyReading[] {
 if (!searchQuery.trim()) return items;
 const q = searchQuery.trim().toLowerCase();
 return items.filter((reading) => {
  const titleZh = reading.article.titleZh.toLowerCase();
  const publisher = reading.source.publisher.toLowerCase();
  const titleVi =
   reading.enrichment.translation.status === "ready"
    ? reading.enrichment.translation.data.titleVi.toLowerCase()
    : "";
  return titleZh.includes(q) || publisher.includes(q) || titleVi.includes(q);
 });
}

export function filterDailyReadingVocabItems(
 vocabItems: readonly DailyReadingVocabularyItem[],
 searchQuery: string,
): readonly DailyReadingVocabularyItem[] {
 const trimmedVocabQuery = searchQuery.trim().toLowerCase();
 return trimmedVocabQuery
  ? vocabItems.filter(
     (item) =>
      item.hanzi.toLowerCase().includes(trimmedVocabQuery) ||
      item.meaningVi.toLowerCase().includes(trimmedVocabQuery) ||
      item.categoryVi.toLowerCase().includes(trimmedVocabQuery) ||
      item.meaningInContextVi.toLowerCase().includes(trimmedVocabQuery),
    )
  : vocabItems;
}
