import type { ReaderContentState } from "../model/reader.schemas";

const cache = new WeakMap<ReaderContentState, ReadonlyMap<string, number>>();

/**
 * Position of each dialogue turn's speaker among the distinct speakers of its
 * section, in order of first appearance. Speech uses it to alternate voices, so
 * the same label keeps one voice and a new dialogue section starts over.
 */
export function readerSpeakerIndexes(content: ReaderContentState): ReadonlyMap<string, number> {
 const cached = cache.get(content);
 if (cached) return cached;
 const indexes = new Map<string, number>();
 const speakersBySection = new Map<string, string[]>();
 for (const id of content.segmentIds) {
  const segment = content.segmentsById[id];
  const speaker = segment?.speaker?.id || segment?.speaker?.label;
  if (!segment || segment.kind !== "dialogue-turn" || !speaker) continue;
  const sectionKey = segment.sectionId ?? "";
  const speakers = speakersBySection.get(sectionKey) ?? [];
  if (!speakers.includes(speaker)) speakers.push(speaker);
  speakersBySection.set(sectionKey, speakers);
  indexes.set(id, speakers.indexOf(speaker));
 }
 cache.set(content, indexes);
 return indexes;
}
