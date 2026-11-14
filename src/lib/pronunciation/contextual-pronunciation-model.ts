import { convert } from "pinyin-pro";
import { z } from "zod";

const readingKeySchema = z.string().regex(/^[a-zv]+[1-5]$/u);
const tokenTypeSchema = z.enum(["hanzi", "latin", "number", "punctuation", "whitespace", "other"]);
const evidenceSchema = z.enum([
 "manual-override",
 "dictionary-exact",
 "source-pinyin",
 "context-library",
 "fallback",
]);

export const CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH = 2_000;

export const requestSchema = z.strictObject({
 text: z.string().min(1).max(CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH),
 sourcePinyin: z.string().max(8_000).nullable().default(null),
 overrides: z
  .array(
   z.strictObject({
    id: z.string().min(1),
    text: z.string().min(1),
    readings: z.array(readingKeySchema).min(1),
    scope: z.enum(["character-global", "phrase", "sentence-instance"]),
    sentenceText: z.string().nullable().default(null),
    start: z.number().int().nonnegative().nullable().default(null),
    end: z.number().int().positive().nullable().default(null),
    updatedAt: z.string(),
   }),
  )
  .readonly()
  .default([]),
});

export type ContextualPronunciationRequest = z.input<typeof requestSchema>;
export type PronunciationEvidence = z.infer<typeof evidenceSchema>;
export type PronunciationTokenType = z.infer<typeof tokenTypeSchema>;

export type PronunciationDictionaryEntry = {
 id: string;
 text: string;
 pinyin: string;
 priority: number;
};

export type PronunciationOverride = z.output<typeof requestSchema>["overrides"][number];

export type ContextualPronunciationGlyph = {
 text: string;
 start: number;
 end: number;
 lexicalPinyin: string | null;
 spokenPinyin: string | null;
 lexicalReadingKey: string | null;
 spokenReadingKey: string | null;
 isPolyphonic: boolean;
 alternatives: string[];
 confidence: number;
 evidence: PronunciationEvidence[];
};

export type ContextualPronunciationToken = {
 id: string;
 text: string;
 start: number;
 end: number;
 type: PronunciationTokenType;
 source: "dictionary-exact" | "intl-segmenter" | "grapheme";
 pinyin: string;
};

export type ContextualReadingUnit = Pick<
 ContextualPronunciationToken,
 "id" | "text" | "start" | "end" | "type"
>;

export type ContextualPronunciationAnalysis = {
 originalText: string;
 normalizedText: string;
 tokens: ContextualPronunciationToken[];
 glyphs: ContextualPronunciationGlyph[];
 unresolved: Array<{
  start: number;
  end: number;
  text: string;
  reason: "pronunciation-unavailable";
 }>;
 sourcePinyinStatus: "not-provided" | "aligned" | "rejected";
};

const hanziPattern = /\p{Script=Han}/u;
const latinPattern = /^\p{Script=Latin}+$/u;
const numberPattern = /^\p{Number}+$/u;
const punctuationPattern = /^[\p{Punctuation}\p{Symbol}]+$/u;

export function classify(value: string): PronunciationTokenType {
 if (/^\s+$/u.test(value)) return "whitespace";
 if (hanziPattern.test(value)) return "hanzi";
 if (latinPattern.test(value)) return "latin";
 if (numberPattern.test(value)) return "number";
 if (punctuationPattern.test(value)) return "punctuation";
 return "other";
}

export function normalizeReading(value: string): string | null {
 const direct = /^([a-zv]+)([0-5])$/u.exec(
  value.normalize("NFC").toLocaleLowerCase().replaceAll("u:", "v").replaceAll("ü", "v"),
 );
 if (direct !== null) return `${direct[1]}${direct[2] === "0" ? "5" : direct[2]}`;
 const converted = convert(value, { format: "symbolToNum" });
 const compact = converted
  .normalize("NFC")
  .toLocaleLowerCase()
  .replaceAll("u:", "v")
  .replaceAll("ü", "v")
  .replace(/[^a-zv0-5]/gu, "");
 const match = /^([a-zv]+)([0-5])$/u.exec(compact);
 return match === null ? null : `${match[1]}${match[2] === "0" ? "5" : match[2]}`;
}

export function displayPinyin(key: string | null): string | null {
 if (key === null) return null;
 return convert(key, { format: "numToSymbol" })
  .replace(/([a-zv]+)5$/u, "$1")
  .replaceAll("v", "ü");
}

export function formatContextualReading(readingKey: string): string {
 return displayPinyin(readingKey) ?? readingKey;
}

export function readingKeys(value: string[] | undefined): string[] {
 if (value === undefined) return [];
 return value.flatMap((item) => {
  const key = normalizeReading(item);
  return key === null ? [] : [key];
 });
}

export function normalizeSourcePinyin(value: string): string {
 const toneMarks = new Set([
  "ā",
  "á",
  "ǎ",
  "à",
  "ē",
  "é",
  "ě",
  "è",
  "ī",
  "í",
  "ǐ",
  "ì",
  "ō",
  "ó",
  "ǒ",
  "ò",
  "ū",
  "ú",
  "ǔ",
  "ù",
  "ǖ",
  "ǘ",
  "ǚ",
  "ǜ",
  "ü",
  "ń",
  "ň",
  "ǹ",
  "ḿ",
  "\u0300",
  "\u0304",
  "\u030c",
 ]);
 const normalized = value.normalize("NFC").toLocaleLowerCase().replaceAll("u:", "v");
 let compact = "";
 for (const character of normalized) {
  if (toneMarks.has(character) || /[a-zv0-5]/u.test(character)) compact += character;
 }
 return compact.replaceAll("ü", "v");
}

export function sourcePinyinForms(key: string): string[] {
 const display = displayPinyin(key);
 const forms = [key, display === null ? null : normalizeSourcePinyin(display)];
 if (key.endsWith("5")) forms.push(key.slice(0, -1));
 if (key === "er2") forms.push("er");
 if (key === "er2" || key === "er5") forms.push("r");
 return [...new Set(forms)].filter((value): value is string => value !== null);
}
