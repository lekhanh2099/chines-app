import bundle from "../../../data/hanzihome/hanzihome_bundle_clean.json";
import type {
 AiAnalysis,
 AiExample,
 GrammarCourseWithLessons,
 GrammarExerciseType,
 GrammarPointContent,
 GrammarPointWithProgress,
 VocabCourseWithLessons,
 VocabEntryWithProgress,
} from "@/types/database";

type StaticLesson = (typeof bundle.lessons)[number];
type StaticVocab = (typeof bundle.vocab)[number];
type StaticGrammar = (typeof bundle.grammarPoints)[number];
export type HanziHomeRadical = (typeof bundle.radicals)[number];

export type HanziHomeStaticBundle = typeof bundle;

const COURSE_ID = "static-hanzihome-hanyu2";
const COURSE_KEY = "hanzihome-hanyu2-static";

function statusFromLevel(level: number): "new" | "learning" | "mastered" {
 if (level >= 4) return "mastered";
 if (level >= 2) return "learning";
 return "new";
}

function categoryForWord(lesson: StaticLesson | undefined, word: string) {
 return (
  lesson?.vocabCategories.find((category) => category.words.includes(word))
   ?.nameVi || "Từ vựng"
 );
}

function firstMeaningLine(lines?: string[]) {
 return (
  lines
   ?.map((line) => line.trim())
   .find((line) => line && !/^Âm Hán Việt:?/i.test(line) && !/^Nghĩa:?$/i.test(line)) ||
  ""
 );
}

function parseExamples(lines?: string[]): AiExample[] {
 if (!lines?.length) return [];
 const examples: AiExample[] = [];
 for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index]?.trim() || "";
  if (!line.startsWith("中文:")) continue;
  const zh = line.replace(/^中文:\s*/, "").trim();
  const pinyin = (lines[index + 1] || "")
   .replace(/^Pinyin:\s*/i, "")
   .trim();
  const vi = (lines[index + 2] || "").replace(/^Dịch:\s*/i, "").trim();
  const note = (lines[index + 3] || "")
   .replace(/^Phân tích:\s*/i, "")
   .trim();
  examples.push({ zh, pinyin, vi, note });
 }
 return examples;
}

function normalizeLines(value?: string[]) {
 return (value || []).map((item) => item.trim()).filter(Boolean);
}

function toAiAnalysis(
 entry: StaticVocab,
 lesson: StaticLesson | undefined,
 category: string,
): AiAnalysis {
 const raw = entry.rawSections || {};
 const examples = parseExamples(raw.examplesBlock);
 const meaningDetail =
  firstMeaningLine(raw.meaningBlock) || entry.meaning || entry.tone || "";
 return {
  hanzi: entry.word,
  pinyin: entry.pinyin,
  han_viet: entry.hanViet,
  sino_vietnamese: entry.hanViet,
  meaning_summary: entry.meaning,
  meaning_detail: meaningDetail,
  word_type: `${entry.pos?.vi || ""}${entry.pos?.zh ? ` 【${entry.pos.zh}】` : ""}`.trim(),
  decomposition: normalizeLines(raw.etymologyBlock || entry.etymology).join("\n"),
  comparisons: normalizeLines(raw.comparisonBlock || entry.comparisons),
  collocations: normalizeLines(raw.collocationsBlock || entry.collocations),
  examples,
  cultural_note: normalizeLines(raw.cultureBlock || entry.culture).join("\n"),
  usage_note: normalizeLines(raw.notesBlock || entry.notes).join("\n"),
  hsk_level: entry.level || undefined,
  definitions: entry.meaning
   ? [{ pos: entry.pos?.vi || entry.pos?.zh, meaning: entry.meaning }]
   : [],
  source_metadata: {
   course_key: COURSE_KEY,
   lesson_key: lesson?.id || entry.lessonId,
   lesson_number: entry.lessonNumber,
   lesson_title: lesson
    ? `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`
    : `Bài ${entry.lessonNumber}`,
   row_number: 0,
   category,
   source_file: entry.sourceFile,
  },
 };
}

export function getHanziHomeVocabCourse(): VocabCourseWithLessons {
 const lessonsById = new Map(bundle.lessons.map((lesson) => [lesson.id, lesson]));
 const entries: VocabEntryWithProgress[] = bundle.vocab.map((entry, index) => {
  const lesson = lessonsById.get(entry.lessonId);
  const category = categoryForWord(lesson, entry.word);
  const analysis = toAiAnalysis(entry, lesson, category);
  return {
   id: entry.id,
   course_id: COURSE_ID,
   lesson_id: entry.lessonId,
   hanzi: entry.word,
   pinyin: entry.pinyin,
   sino_vietnamese: entry.hanViet,
   meaning: entry.meaning,
   word_type: entry.pos?.vi || entry.pos?.zh || "",
   category,
   row_number: index + 1,
   ai_analysis: analysis,
   proficiency_level: 0,
   is_favorited: false,
   last_answered_at: null,
   status: "new",
   type: "word",
   source: {
    courseKey: COURSE_KEY,
    lessonKey: lesson?.id || entry.lessonId,
    lessonNumber: entry.lessonNumber,
    lessonTitle: lesson
     ? `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`
     : `Bài ${entry.lessonNumber}`,
    rowNumber: index + 1,
    category,
    sourceFile: entry.sourceFile,
   },
  };
 });

 const entriesByLesson = new Map<string, VocabEntryWithProgress[]>();
 entries.forEach((entry) => {
  const bucket = entriesByLesson.get(entry.lesson_id) || [];
  bucket.push(entry);
  entriesByLesson.set(entry.lesson_id, bucket);
 });

 const lessons = bundle.lessons.map((lesson, index) => {
  const lessonEntries = entriesByLesson.get(lesson.id) || [];
  return {
   id: lesson.id,
   course_id: COURSE_ID,
   lesson_key: lesson.id,
   lesson_number: lesson.lessonNumber,
   title: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
   lesson_order: index + 1,
   item_count: lessonEntries.length,
   entries: lessonEntries,
   studied: 0,
   mastered: 0,
   learning: 0,
   fresh: lessonEntries.length,
   progress: 0,
   categories: lesson.vocabCategories.map((category) => ({
    name: category.nameVi,
    count: category.words.length,
   })),
  };
 });

 return {
  id: COURSE_ID,
  course_key: COURSE_KEY,
  title: "HanziHome Hán ngữ 2",
  source_file: "hanzihome_bundle_clean.json",
  source_path: "data/hanzihome/hanzihome_bundle_clean.json",
  generated_at: bundle.meta.generatedAt,
  imported_at: bundle.meta.generatedAt,
  lessons,
  entries,
 };
}

function cleanGrammarTitle(title: string) {
 return title.replace(/\\\./g, ".").replace(/^(\d+\.)\s*/, "").trim();
}

function splitMarkdownBullets(content: string) {
 return content
  .split("\n")
  .map((line) => line.replace(/^\*\s*/, "").trim())
  .filter(Boolean);
}

function buildGrammarContent(point: StaticGrammar): GrammarPointContent {
 const lines = splitMarkdownBullets(point.contentMd || "");
 const usage = lines.find((line) => /^Công dụng:/i.test(line));
 const examples = point.examplesRaw
  .filter((line) => /[\u3400-\u9fff]/.test(line))
  .map((line) => {
   const match = line.match(/^(.+?)[（(](.+?)[）)]$/);
   return {
    zh: match?.[1]?.trim() || line,
    pinyin: "",
    vi: match?.[2]?.trim() || "",
   };
  });
 const quickExample = examples[0];
 const structures = point.structures?.length
  ? point.structures.map((item) => item.replace(/\\\+/g, "+"))
  : lines
     .filter((line) => /^Cấu trúc:/i.test(line))
     .map((line) => line.replace(/^Cấu trúc:\s*/i, ""));
 return {
  core: usage?.replace(/^Công dụng:\s*/i, "") || lines[0] || "",
  explanation: lines.join("\n"),
  structures,
  formulas: structures,
  usage_notes: lines.filter((line) => /^Lưu ý:/i.test(line)),
  examples,
  quick_example: quickExample,
  traps: lines.filter((line) => /không|chú ý|lưu ý|sai/i.test(line)),
  comparisons: [],
  source_metadata: {
   course_key: COURSE_KEY,
   lesson_key: point.lessonId,
   lesson_number: point.lessonNumber,
   lesson_title: `Bài ${point.lessonNumber}`,
   source: "hanzihome_bundle_clean.json",
  },
 };
}

export function getHanziHomeGrammarCourse(): GrammarCourseWithLessons {
 const points: GrammarPointWithProgress[] = bundle.grammarPoints.map((point, index) => {
  const content = buildGrammarContent(point);
  return {
   id: point.id,
   course_id: COURSE_ID,
   lesson_id: point.lessonId,
   title: cleanGrammarTitle(point.title),
   hanzi: null,
   pinyin: null,
   vietnamese_title: null,
   level: "Hán ngữ 2",
   category: "Ngữ pháp giáo trình",
   tags: ["hanzihome", `bai-${point.lessonNumber}`, "hanyu2"],
   row_number: index + 1,
   content,
   created_at: bundle.meta.generatedAt,
   updated_at: bundle.meta.generatedAt,
   proficiency_level: 0,
   status: statusFromLevel(0),
   exercises: [
    {
     id: `${point.id}-quiz`,
     course_id: COURSE_ID,
     lesson_id: point.lessonId,
     point_id: point.id,
     exercise_type: "multiple_choice" as GrammarExerciseType,
     prompt: content.quick_example?.zh
      ? `Câu này đang luyện điểm nào: ${content.quick_example.zh}`
      : `Chọn công thức đúng cho ${cleanGrammarTitle(point.title)}`,
     content: {
      choices: [
       { id: "a", text: content.structures?.[0] || cleanGrammarTitle(point.title) },
       { id: "b", text: "S + V + O" },
       { id: "c", text: "因为...所以..." },
      ],
     },
     answer: { choiceId: "a", answerIndex: 0 },
     explanation: content.core || content.explanation,
     exercise_order: 1,
     created_at: bundle.meta.generatedAt,
     updated_at: bundle.meta.generatedAt,
    },
   ],
  };
 });

 const pointsByLesson = new Map<string, GrammarPointWithProgress[]>();
 points.forEach((point) => {
  const bucket = pointsByLesson.get(point.lesson_id || "") || [];
  bucket.push(point);
  pointsByLesson.set(point.lesson_id || "", bucket);
 });

 const lessons = bundle.lessons.map((lesson, index) => {
  const lessonPoints = pointsByLesson.get(lesson.id) || [];
  return {
   id: lesson.id,
   course_id: COURSE_ID,
   lesson_key: lesson.id,
   lesson_number: lesson.lessonNumber,
   title: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
   lesson_order: index + 1,
   description: null,
   created_at: bundle.meta.generatedAt,
   updated_at: bundle.meta.generatedAt,
   points: lessonPoints,
   exercises: lessonPoints.flatMap((point) => point.exercises),
   fresh: lessonPoints.length,
   learning: 0,
   mastered: 0,
   progress: 0,
   categories: [{ name: "Ngữ pháp giáo trình", count: lessonPoints.length }],
  };
 });

 return {
  id: COURSE_ID,
  owner_id: "static",
  course_key: COURSE_KEY,
  title: "HanziHome Hán ngữ 2",
  source_type: "static-json",
  source_file: "hanzihome_bundle_clean.json",
  created_at: bundle.meta.generatedAt,
  updated_at: bundle.meta.generatedAt,
  lessons,
  points,
  exercises: lessons.flatMap((lesson) => lesson.exercises),
 };
}

export const hanzihomeMeta = bundle.meta;

export function getHanziHomeRadicals(): HanziHomeRadical[] {
 return [...bundle.radicals].sort((a, b) => a.index - b.index);
}
