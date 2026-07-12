import type {
 ListeningLessonBundle,
 ListeningRuntimeItem,
 ListeningRuntimeSection,
 ListeningTranscript,
} from "./listening.types";

export function itemsForListeningSection(
 bundle: ListeningLessonBundle,
 sectionId: string,
): ListeningRuntimeItem[] {
 return bundle.items
  .filter((item) => item.sectionId === sectionId)
  .toSorted((left, right) => left.order - right.order);
}

export type ListeningTranscriptEntry = {
 id: string;
 title: string;
 transcript: ListeningTranscript;
};

export function transcriptsForListeningSection(
 section: ListeningRuntimeSection,
 items: ListeningRuntimeItem[],
): ListeningTranscriptEntry[] {
 const entries: ListeningTranscriptEntry[] = [];
 const seenText = new Set<string>();
 const add = (entry: ListeningTranscriptEntry) => {
  const text = entry.transcript.full.zh.trim();
  if (!text || seenText.has(text)) return;
  seenText.add(text);
  entries.push(entry);
 };

 if (section.transcript) {
  add({ id: `${section.id}:section`, title: section.titleZh, transcript: section.transcript });
 }
 for (const item of items) {
  if (item.transcript) {
   add({
    id: item.id,
    title: item.promptZh ?? section.titleZh,
    transcript: item.transcript,
   });
  }
 }
 return entries;
}
