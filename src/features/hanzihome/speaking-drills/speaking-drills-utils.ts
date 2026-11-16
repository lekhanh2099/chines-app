import type { SpeakingDrillLine } from "./speaking-drills.schemas";
import type { SpeakingDrillSelection, SpeakingDrillsCatalogBook } from "./speaking-drills.types";

type CatalogTopic = SpeakingDrillsCatalogBook["lessons"][number]["topics"][number];

export function speakingDrillsHref(topicId: string): string {
 return topicId ? `/speaking-drills?topic=${encodeURIComponent(topicId)}` : "/speaking-drills";
}

/**
 * Builds the text pasted into Doubao: the book's shared prompt followed by the
 * numbered A/B script. The script carries both the `开始对话/结束对话` markers and
 * the `[01] A ｜…` numbering because the two books' prompts each rely on one.
 */
export function buildDoubaoPracticeText(
 selection: SpeakingDrillSelection,
 lines: readonly SpeakingDrillLine[],
): string {
 const header = `【第${selection.lesson.no}课 · 情景${selection.topic.no}】${selection.topic.question}`;
 const script = lines.map((line) => `[${line.n}] ${line.role} ｜${line.zh}`).join("\n");
 return `${selection.generalPrompt}\n\n————————\n${header}\n开始对话\n${script}\n结束对话`;
}

/** Scenarios immediately before and after the current one within its book, in reading order. */
export function adjacentSpeakingDrillTopics(
 book: SpeakingDrillsCatalogBook,
 topicId: string,
): { previous: CatalogTopic[]; next: CatalogTopic[] } {
 const topics = book.lessons.flatMap((lesson) => lesson.topics);
 const index = topics.findIndex((topic) => topic.id === topicId);
 return {
  previous: index > 0 ? topics.slice(index - 1, index) : [],
  next: index >= 0 ? topics.slice(index + 1, index + 2) : [],
 };
}
