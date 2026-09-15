import {
 analyzeContextualPronunciation,
 formatContextualReadingPinyin,
 CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH,
} from "@/lib/pronunciation/contextual-pronunciation";
import {
 deriveSegmentContentCapabilities,
 createReaderContentCapabilities,
} from "./reader-capabilities";
import type { ReaderDocumentModel, ReaderSegment } from "./reader-document.types";
import {
 readerDataSchema,
 readerDocumentSchema,
 cookReaderOptionsSchema,
 type ReaderContentState,
 type CookReaderDataOptions,
} from "./reader.schemas";

function normalizeLines(text: string): string {
 return text.replace(/\r\n?/gu, "\n");
}

function fingerprint(text: string): string {
 let hash = 2166136261;
 let second = 5381;
 for (let index = 0; index < text.length; index += 1) {
  hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  second = Math.imul(second, 33) ^ text.charCodeAt(index);
 }
 return (hash >>> 0).toString(36) + "-" + (second >>> 0).toString(36);
}

function generatePinyin(text: string): string {
 const chunks: string[] = [];
 let chunk = "";
 for (const { segment } of new Intl.Segmenter("zh-CN", { granularity: "word" }).segment(
  text.normalize("NFC"),
 )) {
  if (chunk.length + segment.length > CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH && chunk) {
   chunks.push(chunk);
   chunk = "";
  }
  for (const character of segment) {
   if (chunk.length + character.length > CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH) {
    chunks.push(chunk);
    chunk = "";
   }
   chunk += character;
  }
 }
 if (chunk) chunks.push(chunk);
 let result = "";
 for (const [index, part] of chunks.entries()) {
  const previous = chunks[index - 1];
  if (previous && /\p{Script=Han}$/u.test(previous) && /^\p{Script=Han}/u.test(part)) result += " ";
  result += formatContextualReadingPinyin(analyzeContextualPronunciation({ text: part }));
 }
 return result;
}

// Input validation belongs here; callers with typed documents use the same boundary.
export function cookReaderData(
 input: unknown,
 options: CookReaderDataOptions = {},
): ReaderContentState {
 const parsed = readerDataSchema.parse(input);
 const settings = cookReaderOptionsSchema.parse(options);
 let document: ReaderDocumentModel;
 if (typeof parsed === "string" || !("segments" in parsed)) {
  const segments: ReaderSegment[] = [];
  if (typeof parsed === "string") {
   for (const paragraph of normalizeLines(parsed).split(/\n\s*\n/gu)) {
    for (const sentence of paragraph.match(/[^。！？!?]+[。！？!?]*|[。！？!?]+/gu) ?? []) {
     const zh = sentence.trim();
     if (zh) segments.push({ id: "", kind: "sentence", zh });
    }
   }
  } else {
   for (const item of parsed) {
    if (typeof item === "string") {
     const zh = normalizeLines(item).trim();
     if (zh) segments.push({ id: "", kind: "paragraph", zh });
    } else {
     segments.push({
      id: item.id ?? "",
      kind: item.kind ?? "paragraph",
      zh: normalizeLines(item.zh ?? item.hanzi ?? ""),
      sectionId: item.sectionId,
      pinyin: item.pinyin,
      vi: item.vi ?? item.translation,
      role: item.role,
      speaker: item.speaker,
      speechText: item.speechText,
     });
    }
   }
  }
  const id = "runtime:" + fingerprint(JSON.stringify(segments));
  document = readerDocumentSchema.parse({
   id,
   language: "zh-CN",
   source: { kind: "plain-text" },
   segments: segments.map((segment, index) => ({
    ...segment,
    id: segment.id || id + ":" + index + ":" + fingerprint(segment.zh),
   })),
   sections: [],
   metadata: [],
   capabilities: [],
  });
 } else {
  document = parsed;
 }
 const segments = document.segments.map((segment) => {
  if (settings.pronunciation !== "generate-missing" || segment.pinyin?.trim()) return segment;
  const pinyin = generatePinyin(segment.zh);
  return { ...segment, pinyin };
 });
 const titlePinyin =
  document.titlePinyin ||
  (settings.pronunciation === "generate-missing" && document.title
   ? generatePinyin(document.title)
   : undefined);
 return {
  id: document.id,
  language: document.language,
  source: document.source,
  title:
   document.title !== undefined || titlePinyin !== undefined || document.titleVi !== undefined
    ? { zh: document.title, pinyin: titlePinyin, vi: document.titleVi }
    : undefined,
  segmentIds: segments.map((segment) => segment.id),
  segmentsById: Object.fromEntries(segments.map((segment) => [segment.id, segment])),
  sectionIds: document.sections.map((section) => section.id),
  sectionsById: Object.fromEntries(document.sections.map((section) => [section.id, section])),
  metadata: document.metadata,
  capabilities: createReaderContentCapabilities([
   ...document.capabilities,
   ...deriveSegmentContentCapabilities(segments),
  ]),
 };
}
