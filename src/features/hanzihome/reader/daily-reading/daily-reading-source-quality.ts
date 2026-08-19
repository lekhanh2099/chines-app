import type {
 DailyReadingExtractionMethod,
 ParsedDailyReadingSourceDocument,
} from "./daily-reading-source-parsers.server";
import type { DailyReadingV2LengthPreference } from "./daily-reading-v2.schemas";

const hanPattern = /[\u3400-\u9fff]/gu;
const sentencePunctuationPattern = /[，。！？；：]/u;

export type DailyReadingSourceQualityRejection =
 | "too-short"
 | "too-few-paragraphs"
 | "low-chinese-density"
 | "incoherent-paragraphs"
 | "truncated"
 | "title-body-mismatch"
 | "date-mismatch"
 | "stale"
 | "future-date";

export type DailyReadingSourceQuality = {
 accepted: boolean;
 rejection: DailyReadingSourceQualityRejection | null;
 score: number;
 hanCharacters: number;
 paragraphCount: number;
 chineseDensity: number;
 coherentParagraphRatio: number;
 titleBodyCoverage: number;
 pageTitleSimilarity: number;
 ageDays: number;
 extractionMethod: DailyReadingExtractionMethod;
};

function distinctHanCharacters(value: string) {
 return [...new Set(value.match(hanPattern) ?? [])];
}

function characterCoverage(reference: string, candidate: string) {
 const characters = distinctHanCharacters(reference);
 if (characters.length === 0) return 0;
 const matched = characters.filter((character) => candidate.includes(character)).length;
 return matched / characters.length;
}

function paragraphLooksCoherent(paragraph: string) {
 const hanCharacters = paragraph.match(hanPattern)?.length ?? 0;
 if (hanCharacters < 18) return false;
 const nonSpaceCharacters = paragraph.replace(/\s+/gu, "").length;
 const chineseDensity = nonSpaceCharacters === 0 ? 0 : hanCharacters / nonSpaceCharacters;
 if (chineseDensity < 0.5) return false;

 // Real Chinese news sites often split copy into short <p> blocks. Treat a short
 // sentence-like paragraph as coherent instead of requiring one fixed Han count.
 return hanCharacters >= 28 || sentencePunctuationPattern.test(paragraph);
}

function coherentParagraphRatio(paragraphs: readonly string[]) {
 if (paragraphs.length === 0) return 0;
 const coherent = paragraphs.filter(paragraphLooksCoherent).length;
 return coherent / paragraphs.length;
}

function extractionMethodScore(method: DailyReadingExtractionMethod) {
 switch (method) {
  case "json-ld":
   return 24;
  case "article-body":
   return 23;
  case "article":
   return 21;
  case "content-container":
   return 15;
  case "main":
   return 12;
  case "paragraph-fallback":
   return 4;
 }
}

function preferredLengthScore(hanCharacters: number, preference: DailyReadingV2LengthPreference) {
 if (preference === "any") return 14;
 const target = preference === "short" ? 550 : preference === "medium" ? 1_100 : 2_200;
 const distanceRatio = Math.abs(hanCharacters - target) / target;
 return Math.max(0, 18 - distanceRatio * 12);
}

function resolveAgeDays(publishedAt: string, now: Date) {
 const time = new Date(publishedAt).getTime();
 if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
 return (now.getTime() - time) / 86_400_000;
}

export function assessDailyReadingSourceQuality(input: {
 document: ParsedDailyReadingSourceDocument;
 metadataTitleZh: string;
 metadataPublishedAt: string;
 preferredLength: DailyReadingV2LengthPreference;
 maximumFreshnessDays: number;
 now?: Date;
}): DailyReadingSourceQuality {
 const now = input.now ?? new Date();
 const effectivePublishedAt = input.document.pagePublishedAt || input.metadataPublishedAt;
 const ageDays = resolveAgeDays(effectivePublishedAt, now);
 const paragraphCount = input.document.paragraphsZh.length;
 const coherence = coherentParagraphRatio(input.document.paragraphsZh);
 const titleBodyCoverage = characterCoverage(input.metadataTitleZh, input.document.extractedTextZh);
 const pageTitleSimilarity =
  input.document.pageTitleZh.length === 0
   ? 0
   : characterCoverage(input.metadataTitleZh, input.document.pageTitleZh);
 const pageDateMismatch =
  input.document.pagePublishedAt.length > 0 &&
  Math.abs(
   new Date(input.document.pagePublishedAt).getTime() -
    new Date(input.metadataPublishedAt).getTime(),
  ) >
   72 * 3_600_000;

 let rejection: DailyReadingSourceQualityRejection | null = null;
 if (input.document.hanCharacters < 240) rejection = "too-short";
 else if (paragraphCount < 3) rejection = "too-few-paragraphs";
 else if (input.document.chineseDensity < 0.45) rejection = "low-chinese-density";
 else if (coherence < 0.35) rejection = "incoherent-paragraphs";
 else if (input.document.truncated) rejection = "truncated";
 else if (titleBodyCoverage < 0.2 && pageTitleSimilarity < 0.35) rejection = "title-body-mismatch";
 else if (pageDateMismatch) rejection = "date-mismatch";
 else if (ageDays < -1) rejection = "future-date";
 else if (ageDays > input.maximumFreshnessDays) rejection = "stale";

 const densityScore = Math.min(22, Math.max(0, input.document.chineseDensity * 22));
 const paragraphScore = Math.min(14, paragraphCount * 1.8);
 const coherenceScore = coherence * 16;
 const titleScore = Math.min(18, titleBodyCoverage * 14 + pageTitleSimilarity * 8);
 const freshnessScore = Math.max(
  0,
  16 - Math.max(0, ageDays) * (16 / Math.max(1, input.maximumFreshnessDays)),
 );
 const score =
  extractionMethodScore(input.document.extractionMethod) +
  preferredLengthScore(input.document.hanCharacters, input.preferredLength) +
  densityScore +
  paragraphScore +
  coherenceScore +
  titleScore +
  freshnessScore;

 return {
  accepted: rejection === null,
  rejection,
  score,
  hanCharacters: input.document.hanCharacters,
  paragraphCount,
  chineseDensity: input.document.chineseDensity,
  coherentParagraphRatio: coherence,
  titleBodyCoverage,
  pageTitleSimilarity,
  ageDays,
  extractionMethod: input.document.extractionMethod,
 };
}

export function dailyReadingFinalSelectionScore(metadataScore: number, contentScore: number) {
 return metadataScore * 0.42 + contentScore * 0.58;
}
