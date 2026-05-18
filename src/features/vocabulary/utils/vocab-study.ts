import type {
 AiAnalysis,
 AiExample,
 VocabCourseWithLessons,
 VocabEntryWithProgress,
 VocabLessonWithStats,
} from "@/types/database";
import type {
 FlashFrontMode,
 FlashStatus,
 ImportedEntryDraft,
} from "@/features/vocabulary/types";

export function getMeaning(entry: VocabEntryWithProgress) {
 return (
  entry.ai_analysis.meaning_detail ||
  entry.ai_analysis.definitions?.[0]?.meaning ||
  entry.meaning
 );
}

export function getPrimaryExample(entry: VocabEntryWithProgress) {
 return entry.ai_analysis.examples?.[0];
}

export function getStatusFromLevel(
 level: number,
): VocabEntryWithProgress["status"] {
 if (level >= 4) return "mastered";
 if (level >= 2) return "learning";
 return "new";
}

export function getFlashStatus(entry: VocabEntryWithProgress): FlashStatus {
 const level = entry.proficiency_level || 0;
 if (level >= 4) return "known";
 if (entry.last_answered_at && level < 2) return "again";
 if (level >= 2) return "hard";
 return "new";
}

export function getFlashLevel(entry: VocabEntryWithProgress) {
 const metadata = entry.ai_analysis.source_metadata as
  | { level?: string; hsk_level?: string }
  | undefined;
 return (
  metadata?.level || metadata?.hsk_level || entry.ai_analysis.hsk_level || "A"
 );
}

export function getLessonNumber(entry: VocabEntryWithProgress) {
 return (
  entry.source.lessonNumber ||
  entry.ai_analysis.source_metadata?.lesson_number ||
  0
 );
}

export function getCompactNote(entry: VocabEntryWithProgress) {
 return (
  entry.ai_analysis.usage_note ||
  entry.ai_analysis.cultural_note ||
  entry.ai_analysis.mnemonic_story ||
  entry.ai_analysis.examples?.[0]?.note ||
  ""
 );
}

export function getFrontText(
 entry: VocabEntryWithProgress,
 mode: FlashFrontMode,
) {
 if (mode === "meaning") return getMeaning(entry);
 if (mode === "pinyin") return entry.pinyin;
 return entry.hanzi;
}

export function normalizeAnswer(value: string) {
 return value
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "")
  .replace(/[，。！？、,.!?]/g, "");
}

export function hashForStudyOrder(value: string) {
 let hash = 0;
 for (let index = 0; index < value.length; index += 1) {
  hash = (hash << 5) - hash + value.charCodeAt(index);
  hash |= 0;
 }
 return Math.abs(hash);
}

export function getStudyCharacters(entry: VocabEntryWithProgress) {
 return Array.from(entry.hanzi).filter((character) =>
  /[\u3400-\u9fff]/.test(character),
 );
}

export function entryHasMissingData(entry: VocabEntryWithProgress) {
 const analysis = entry.ai_analysis;
 return (
  !analysis.decomposition ||
  !analysis.examples?.length ||
  !analysis.collocations?.length ||
  !analysis.usage_note
 );
}

export function matchesEntry(entry: VocabEntryWithProgress, query: string) {
 if (!query.trim()) return true;
 const normalized = query.trim().toLowerCase();
 return (
  entry.hanzi.toLowerCase().includes(normalized) ||
  entry.pinyin.toLowerCase().includes(normalized) ||
  entry.meaning.toLowerCase().includes(normalized) ||
  entry.category?.toLowerCase().includes(normalized) ||
  entry.source.lessonKey.toLowerCase().includes(normalized)
 );
}

export function examplesToText(examples?: AiExample[]) {
 return (examples || [])
  .map((example) =>
   [example.zh, example.pinyin, example.vi, example.note || ""].join(" | "),
  )
  .join("\n");
}

export function textToExamples(value: string): AiExample[] {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
   const [zh = "", pinyin = "", vi = "", note = ""] = line
    .split("|")
    .map((part) => part.trim());
   return { zh, pinyin, vi, note: note || undefined };
  })
  .filter((example) => example.zh || example.pinyin || example.vi);
}

export function lineText(value?: string[]) {
 return (value || []).join("\n");
}

export function parseLines(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
}

export function stripMarkdown(value: string) {
 return value
  .replace(/\*\*/g, "")
  .replace(/^\s*[-*]\s+/gm, "")
  .replace(/^\s*\d+\.\s+/gm, "")
  .trim();
}

function getMarkdownSection(block: string, sectionNumber: number) {
 const pattern = new RegExp(
  `\\*\\*${sectionNumber}\\.\\s*[^*]+\\*\\*([\\s\\S]*?)(?=\\n\\*\\*\\d+\\.|\\n---|$)`,
  "i",
 );
 return block.match(pattern)?.[1]?.trim() || "";
}

function parseWordType(value: string) {
 return value.match(/\*([^*【]+(?:【[^】]+】)?)\*/)?.[1]?.trim();
}

function parseHanViet(section: string, fallback?: string) {
 return section.match(/Âm Hán Việt:\s*([^\n]+)/i)?.[1]?.trim() || fallback;
}

function parseMeaningDetail(section: string, fallback: string) {
 return section.match(/Nghĩa:\s*([^\n]+)/i)?.[1]?.trim() || fallback;
}

function parseMarkdownList(section: string) {
 return section
  .split("\n")
  .map((line) => stripMarkdown(line.replace(/^\s*\d+\.\s*/, "")))
  .filter(Boolean);
}

function parseMarkdownExamples(section: string): AiExample[] {
 const chunks = section
  .split(/\n(?=\d+\.\s)/)
  .map((chunk) => chunk.trim())
  .filter(Boolean);
 return chunks
  .map((chunk) => {
   const lines = chunk
    .split("\n")
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
   const first = lines[0] || "";
   const sentenceMatch =
    first.match(/^\d+\.\s*(.+?)\(([^)]+)\)\s*$/) ||
    first.match(/^(.+?)\(([^)]+)\)\s*$/);
   const zh =
    sentenceMatch?.[1]?.replace(/^\d+\.\s*/, "").trim() ||
    first.replace(/^\d+\.\s*/, "");
   const pinyin = sentenceMatch?.[2]?.trim() || "";
   const vi =
    lines.find((line) => !line.startsWith("→") && line !== first) || "";
   const note = lines
    .find((line) => line.startsWith("→"))
    ?.replace(/^→\s*/, "");
   return { zh, pinyin, vi, note };
  })
  .filter((example) => example.zh || example.vi);
}

export function parseMarkdownVocabEntries(
 value: string,
 lesson: VocabLessonWithStats,
): ImportedEntryDraft[] {
 const blocks = value
  .split(/\n---+\n|(?=\n##\s+)/g)
  .map((block) => block.trim())
  .filter((block) => block.startsWith("## "));

 return blocks
  .map((block, index) => {
   const header = block.match(
    /^##\s*(.+?)\s+[–-]\s+(.+?)\s+[–-]\s+(.+?)\s+[–-]\s+(.+)$/m,
   );
   const hanzi = header?.[1]?.trim() || "";
   const pinyin = header?.[2]?.trim() || "";
   const sino = header?.[3]?.trim() || "";
   const meaning = header?.[4]?.trim() || "";
   const hanVietSection = getMarkdownSection(block, 1);
   const decomposition = stripMarkdown(getMarkdownSection(block, 2));
   const comparisons = parseMarkdownList(getMarkdownSection(block, 3));
   const collocations = parseMarkdownList(getMarkdownSection(block, 4));
   const examples = parseMarkdownExamples(getMarkdownSection(block, 5));
   const culturalNote = stripMarkdown(getMarkdownSection(block, 6));
   const usageNote = stripMarkdown(getMarkdownSection(block, 7));
   const category = lesson.categories[0]?.name || "Bổ sung";
   const rowNumber = lesson.entries.length + index + 1;
   const analysis: AiAnalysis = {
    hanzi,
    pinyin,
    sino_vietnamese: parseHanViet(hanVietSection, sino),
    han_viet: parseHanViet(hanVietSection, sino),
    meaning_summary: meaning,
    meaning_detail: parseMeaningDetail(hanVietSection, meaning),
    word_type: parseWordType(block),
    decomposition,
    comparisons,
    collocations,
    examples,
    cultural_note: culturalNote,
    usage_note: usageNote,
    source_metadata: {
     lesson_key: lesson.lesson_key,
     lesson_number: lesson.lesson_number,
     lesson_title: lesson.title,
     row_number: rowNumber,
     category,
    },
   };
   return {
    hanzi,
    pinyin,
    sino_vietnamese: analysis.sino_vietnamese,
    meaning,
    word_type: analysis.word_type,
    category,
    row_number: rowNumber,
    ai_analysis: analysis,
   };
  })
  .filter((entry) => entry.hanzi);
}

export function applyProgress(
 course: VocabCourseWithLessons,
 entryId: string,
 nextLevel: number,
 answeredAt: string,
): VocabCourseWithLessons {
 const updateEntry = (entry: VocabEntryWithProgress): VocabEntryWithProgress =>
  entry.id === entryId
   ? {
      ...entry,
      proficiency_level: nextLevel,
      last_answered_at: answeredAt,
      status: getStatusFromLevel(nextLevel),
     }
   : entry;

 const lessons = course.lessons.map((lesson) => {
  const entries = lesson.entries.map(updateEntry);
  const mastered = entries.filter(
   (entry) => entry.status === "mastered",
  ).length;
  const studied = entries.filter(
   (entry) => entry.last_answered_at || entry.proficiency_level > 0,
  ).length;
  const learning = entries.filter(
   (entry) =>
    (entry.last_answered_at || entry.proficiency_level > 0) &&
    entry.status !== "mastered",
  ).length;
  const fresh = Math.max(entries.length - studied, 0);
  return {
   ...lesson,
   entries,
   studied,
   mastered,
   learning,
   fresh,
   progress: entries.length ? Math.round((studied / entries.length) * 100) : 0,
  };
 });

 return {
  ...course,
  lessons,
  entries: course.entries.map(updateEntry),
 };
}

export function isCoursePayload(
 data:
  | VocabCourseWithLessons
  | { course: null; lessons: []; entries: [] }
  | undefined,
): data is VocabCourseWithLessons {
 return Boolean(data && "id" in data);
}
