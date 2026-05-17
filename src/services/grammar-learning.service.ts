import type {
 DbGrammarExercise,
 DbGrammarLesson,
 DbGrammarPoint,
 DbUserGrammarPointProgress,
 GrammarCourseWithLessons,
 GrammarExerciseContent,
 GrammarExerciseType,
 GrammarLessonWithStats,
 GrammarPointContent,
 GrammarPointWithProgress,
} from "@/types/database";

const EXERCISE_GENERATOR = "grammar-rule-v1";

export function isMissingGrammarTableError(error: { code?: string; message?: string } | null | undefined) {
 return error?.code === "PGRST205" || error?.message?.includes("Could not find the table");
}

export function grammarStatusFromLevel(level: number): GrammarPointWithProgress["status"] {
 if (level >= 4) return "mastered";
 if (level >= 2) return "learning";
 return "new";
}

export function buildGrammarPayload({
 course,
 lessons,
 points,
 exercises,
 progressRows,
}: {
 course: GrammarCourseWithLessons;
 lessons: DbGrammarLesson[];
 points: DbGrammarPoint[];
 exercises: DbGrammarExercise[];
 progressRows: DbUserGrammarPointProgress[];
}): GrammarCourseWithLessons {
 const progressByPoint = new Map(progressRows.map((row) => [row.point_id, row]));
 const exercisesByPoint = exercises.reduce((map, exercise) => {
  if (!exercise.point_id) return map;
  const current = map.get(exercise.point_id) || [];
  current.push(exercise);
  map.set(exercise.point_id, current);
  return map;
 }, new Map<string, DbGrammarExercise[]>());

 const pointsWithProgress: GrammarPointWithProgress[] = points.map((point) => {
  const level = progressByPoint.get(point.id)?.proficiency_level ?? 0;
  return {
   ...point,
   tags: point.tags || [],
   content: point.content || {},
   proficiency_level: level,
   status: grammarStatusFromLevel(level),
   exercises: (exercisesByPoint.get(point.id) || []).sort((a, b) => a.exercise_order - b.exercise_order),
  };
 });

 const pointsByLesson = pointsWithProgress.reduce((map, point) => {
  const key = point.lesson_id || "unassigned";
  const current = map.get(key) || [];
  current.push(point);
  map.set(key, current);
  return map;
 }, new Map<string, GrammarPointWithProgress[]>());
 const exercisesByLesson = exercises.reduce((map, exercise) => {
  const key = exercise.lesson_id || "unassigned";
  const current = map.get(key) || [];
  current.push(exercise);
  map.set(key, current);
  return map;
 }, new Map<string, DbGrammarExercise[]>());

 const lessonPayload: GrammarLessonWithStats[] = lessons.map((lesson) => {
  const lessonPoints = (pointsByLesson.get(lesson.id) || []).sort((a, b) => a.row_number - b.row_number);
  const fresh = lessonPoints.filter((point) => point.status === "new").length;
  const learning = lessonPoints.filter((point) => point.status === "learning").length;
  const mastered = lessonPoints.filter((point) => point.status === "mastered").length;
  const categories = Array.from(
   lessonPoints.reduce((map, point) => {
    const name = point.category || point.level || "Ngữ pháp";
    map.set(name, (map.get(name) || 0) + 1);
    return map;
   }, new Map<string, number>()),
  )
   .map(([name, count]) => ({ name, count }))
   .sort((a, b) => b.count - a.count);

  return {
   ...lesson,
   points: lessonPoints,
   exercises: (exercisesByLesson.get(lesson.id) || []).sort((a, b) => a.exercise_order - b.exercise_order),
   fresh,
   learning,
   mastered,
   progress: lessonPoints.length ? Math.round((mastered / lessonPoints.length) * 100) : 0,
   categories,
  };
 });

 return {
  ...course,
  lessons: lessonPayload,
  points: pointsWithProgress,
  exercises,
 };
}

function stripMarkdown(value: string) {
 return value
  .replace(/\*\*/g, "")
  .replace(/^\s*[-*]\s+/gm, "")
  .replace(/^\s*\d+\.\s+/gm, "")
  .trim();
}

function section(block: string, title: string) {
 const pattern = new RegExp(`\\*\\*\\d*\\.?\\s*${title}[^*]*\\*\\*([\\s\\S]*?)(?=\\n\\*\\*\\d*\\.?\\s*[^*]+\\*\\*|\\n---|$)`, "i");
 return block.match(pattern)?.[1]?.trim() || "";
}

function parseList(value: string) {
 return value
  .split("\n")
  .map((line) => stripMarkdown(line))
  .filter(Boolean);
}

function parseQuickExample(value: string): GrammarPointContent["quick_example"] {
 const lines = parseList(value);
 const first = lines[0] || "";
 const match = first.match(/^(.+?)\(([^)]+)\)$/);
 return {
  zh: match?.[1]?.trim() || first,
  pinyin: match?.[2]?.trim() || lines[1] || "",
  vi: lines.find((line) => !line.includes("(") && line !== first && line !== lines[1]) || lines[2] || "",
 };
}

function parseExamples(value: string) {
 return parseList(value).map((line) => {
  const match = line.match(/^(.+?)\(([^)]+)\)\s*[–-]\s*(.+)$/);
  return {
   zh: match?.[1]?.trim() || line,
   pinyin: match?.[2]?.trim() || "",
   vi: match?.[3]?.trim() || "",
  };
 });
}

function cleanHeading(value: string) {
 return stripMarkdown(value)
  .replace(/^#+\s*/, "")
  .replace(/^BÀI\s+\d+\s*:\s*/i, "")
  .trim();
}

function extractLessonTitle(rawTitle: string) {
 const normalized = cleanHeading(rawTitle);
 const match = normalized.match(/^(.+?)\s*\((.+)\)$/);
 return {
  title: match?.[1]?.trim() || normalized,
  description: match?.[2]?.trim() || "",
 };
}

function extractField(block: string, label: string) {
 const pattern = new RegExp(`\\*\\s*${label}\\s*:\\s*([^\\n]+(?:\\n\\s{2,}\\*\\s+[^\\n]+)*)`, "i");
 return block.match(pattern)?.[1]?.trim() || "";
}

function extractBulletSection(block: string, label: string) {
 const pattern = new RegExp(`\\*\\s*${label}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\s*[\\p{L}\\d /+()\\-]+\\s*:|\\n###|\\n##|$)`, "iu");
 return block.match(pattern)?.[1]?.trim() || "";
}

function extractPointTitle(rawTitle: string) {
 return cleanHeading(rawTitle).replace(/^\d+\.\s*/, "").trim();
}

function collectExamplesFromBlock(block: string) {
 const examplesRaw = extractBulletSection(block, "Ví dụ");
 const examples = parseExamples(examplesRaw);
 if (examples.length) return examples;
 return Array.from(block.matchAll(/[\s*]*([\u3400-\u9fff][^。\n]*。)(?:\(([^)]+)\))?(?:\s*[–-]\s*([^\n]+))?/g)).map((match) => ({
  zh: match[1]?.trim() || "",
  pinyin: match[2]?.trim() || "",
  vi: match[3]?.trim() || "",
 })).filter((example) => example.zh);
}

function firstExampleForQuickExample(examples: GrammarPointContent["examples"], fallbackTitle: string): GrammarPointContent["quick_example"] {
 const first = examples?.[0];
 if (first?.zh) return { zh: first.zh, pinyin: first.pinyin, vi: first.vi };
 return { zh: fallbackTitle, pinyin: "", vi: "" };
}

export type ParsedGrammarLesson = {
 lesson_key: string;
 lesson_number: number;
 title: string;
 description: string;
 lesson_order: number;
 points: ParsedGrammarPoint[];
};

type CoachGrammarExample = {
 zh?: string;
 py?: string;
 vi?: string;
 an?: string;
};

type CoachGrammarCard = {
 id?: string;
 lesson: number;
 point: string;
 tags?: string[];
 core?: string;
 formulas?: string[];
 examples?: CoachGrammarExample[];
 traps?: string[];
 quiz?: {
  q?: string;
  choices?: string[];
  a?: number;
 };
};

type CoachGrammarData = {
 cards?: CoachGrammarCard[];
 lessons?: Record<string, { title?: string; grammar?: string }>;
 contrasts?: { title?: string; body?: string }[];
};

export function parseHanyuGrammarMarkdown(value: string, courseId: string): ParsedGrammarLesson[] {
 const blocks = Array.from(value.matchAll(/##\s+\*\*BÀI\s+(\d+)\s*:\s*([^*]+)\*\*([\s\S]*?)(?=\n##\s+\*\*BÀI\s+\d+\s*:|$)/gi));
 return blocks.map((lessonMatch) => {
  const lessonNumber = Number(lessonMatch[1]);
  const lessonTitle = extractLessonTitle(lessonMatch[2] || `Bài ${lessonNumber}`);
  const body = lessonMatch[3] || "";
  const pointBlocks = Array.from(body.matchAll(/###\s+\*\*([^*]+)\*\*([\s\S]*?)(?=\n###\s+\*\*|$)/g));
  const lessonShell: DbGrammarLesson = {
   id: `preview-L${lessonNumber}`,
   course_id: courseId,
   lesson_key: `L${String(lessonNumber).padStart(2, "0")}`,
   lesson_number: lessonNumber,
   title: `Bài ${lessonNumber}: ${lessonTitle.title}`,
   lesson_order: lessonNumber,
   description: lessonTitle.description,
  };

  return {
   lesson_key: lessonShell.lesson_key,
   lesson_number: lessonNumber,
   title: lessonShell.title,
   description: lessonShell.description || "",
   lesson_order: lessonNumber,
   points: pointBlocks.map((pointMatch, index) => {
    const pointTitle = extractPointTitle(pointMatch[1] || `Ngữ pháp ${index + 1}`);
    const pointBlock = pointMatch[2] || "";
    const examples = collectExamplesFromBlock(pointBlock);
    const structures = [
     ...parseList(extractBulletSection(pointBlock, "Cấu trúc")),
     ...parseList(extractField(pointBlock, "Cấu trúc")),
    ].filter(Boolean);
    const explanation = [
     extractField(pointBlock, "Công dụng"),
     extractField(pointBlock, "Khái niệm"),
     extractField(pointBlock, "Ý nghĩa"),
     extractField(pointBlock, "Bản chất"),
    ].filter(Boolean).map(stripMarkdown).join("\n\n") || stripMarkdown(pointBlock.split("\n").slice(0, 3).join("\n"));
    const usageNotes = [
     ...parseList(extractBulletSection(pointBlock, "Lưu ý")),
     ...parseList(extractBulletSection(pointBlock, "Phủ định")),
     ...parseList(extractBulletSection(pointBlock, "Đặc điểm")),
    ];
    const comparisons = pointBlock.includes("|") ? parseList(pointBlock.split("\n").filter((line) => line.includes("|")).join("\n")) : [];

    return {
     title: pointTitle,
     hanzi: /[\u3400-\u9fff]/.test(pointTitle) ? pointTitle.match(/[\u3400-\u9fff][\u3400-\u9fff\s+/.·…、“”]+/)?.[0]?.trim() : undefined,
     pinyin: undefined,
     vietnamese_title: undefined,
     level: "Hán ngữ 2",
     category: "Ngữ pháp giáo trình",
     tags: [`Bài ${lessonNumber}`, "Hán ngữ 2"],
     row_number: index + 1,
     content: {
      quick_example: firstExampleForQuickExample(examples, pointTitle),
      explanation,
      structures,
      usage_notes: usageNotes,
      common_mistakes: [],
      comparisons,
      examples,
      source_metadata: {
       course_key: "hanyu-2-grammar",
       lesson_key: lessonShell.lesson_key,
       lesson_number: lessonNumber,
       lesson_title: lessonShell.title,
       row_number: index + 1,
       source: "Np.md",
      },
     },
     exerciseDrafts: [],
    };
   }),
  };
 });
}

export function parseHanyuGrammarCoachJson(data: CoachGrammarData, courseId: string): ParsedGrammarLesson[] {
 const cards = Array.isArray(data.cards) ? data.cards : [];
 const lessonMeta = data.lessons || {};
 const contrasts = Array.isArray(data.contrasts)
  ? data.contrasts
    .map((item) => ({ title: item.title?.trim() || "", body: item.body?.trim() || "" }))
    .filter((item) => item.title && item.body)
  : [];
 const cardsByLesson = cards.reduce((map, card) => {
  const lessonNumber = Number(card.lesson);
  if (!Number.isFinite(lessonNumber)) return map;
  const current = map.get(lessonNumber) || [];
  current.push(card);
  map.set(lessonNumber, current);
  return map;
 }, new Map<number, CoachGrammarCard[]>());

 return Array.from(cardsByLesson.entries())
  .sort(([a], [b]) => a - b)
  .map(([lessonNumber, lessonCards]) => {
   const meta = lessonMeta[String(lessonNumber)] || {};
   const lessonKey = `L${String(lessonNumber).padStart(2, "0")}`;
   const title = `Bài ${lessonNumber}: ${meta.title || lessonCards[0]?.point || "Ngữ pháp"}`;
   return {
    lesson_key: lessonKey,
    lesson_number: lessonNumber,
    title,
    description: meta.grammar || "",
    lesson_order: lessonNumber,
    points: lessonCards.map((card, index) => {
     const examples = (card.examples || []).map((example) => ({
      zh: example.zh || "",
      pinyin: example.py || "",
      vi: example.vi || "",
      note: example.an || "",
     })).filter((example) => example.zh || example.vi);
     const quickExample = examples[0]
      ? { zh: examples[0].zh, pinyin: examples[0].pinyin, vi: examples[0].vi }
      : { zh: card.point, pinyin: "", vi: card.core || "" };
     const quiz = card.quiz?.q && card.quiz?.choices?.length
      ? {
       q: card.quiz.q,
       choices: card.quiz.choices,
       a: Number.isFinite(card.quiz.a) ? card.quiz.a : 0,
      }
      : undefined;
     const exerciseDrafts = quiz
      ? [{
       course_id: courseId,
       lesson_id: null,
       point_id: null,
       exercise_type: "multiple_choice" as GrammarExerciseType,
       prompt: quiz.q || `Chọn đáp án đúng cho ${card.point}`,
       content: {
        choices: (quiz.choices || []).map((choice, choiceIndex) => ({
         id: String.fromCharCode(65 + choiceIndex),
         text: choice,
        })),
        generated_by: "coach-json",
        source_point_title: card.point,
       },
       answer: {
        choice: String.fromCharCode(65 + (quiz.a || 0)),
        text: quiz.choices?.[quiz.a || 0] || "",
       },
       explanation: card.core || "",
       exercise_order: 1,
      }]
      : [];

     return {
      title: card.point || `Ngữ pháp ${index + 1}`,
      hanzi: /[\u3400-\u9fff]/.test(card.point) ? card.point.match(/[\u3400-\u9fff][\u3400-\u9fff\s+/.·…、“”]+/)?.[0]?.trim() : undefined,
      pinyin: undefined,
      vietnamese_title: card.core?.split(/[.。]/)[0]?.trim(),
      level: "Hán ngữ 2",
      category: meta.grammar || "Ngữ pháp giáo trình",
      tags: Array.from(new Set([`Bài ${lessonNumber}`, "Hán ngữ 2", ...(card.tags || [])])),
      row_number: index + 1,
      content: {
       quick_example: quickExample,
       core: card.core || "",
       explanation: card.core || "",
       formulas: card.formulas || [],
       structures: card.formulas || [],
       usage_notes: [],
       traps: card.traps || [],
       common_mistakes: card.traps || [],
       comparisons: [],
       quiz,
       coach_contrasts: index === 0 ? contrasts : undefined,
       examples,
       source_metadata: {
        course_key: "hanyu-2-grammar",
        lesson_key: lessonKey,
        lesson_number: lessonNumber,
        lesson_title: title,
        row_number: index + 1,
        source: "han_ngu_grammar_11_25_data.json",
       },
      },
      exerciseDrafts,
     };
    }),
   };
  });
}

function inferExerciseType(prompt: string): GrammarExerciseType {
 if (prompt.includes("sắp xếp") || prompt.includes("xếp")) return "reorder_sentence";
 if (prompt.includes("dịch")) return "translate_zh";
 if (prompt.includes("lỗi")) return "identify_error";
 if (prompt.includes("chọn") || /A\.|B\.|C\./.test(prompt)) return "multiple_choice";
 return "fill_blank";
}

function parseExerciseLines(value: string, courseId: string, lessonId: string | null, pointId: string | null) {
 return parseList(value).map((line, index) => {
  const type = inferExerciseType(line);
  const choices = Array.from(line.matchAll(/([A-D])[\).]\s*([^A-D]+)/g)).map((match) => ({
   id: match[1],
   text: match[2].trim(),
  }));
  const content: GrammarExerciseContent = {
   ...(choices.length ? { choices } : {}),
   ...(type === "reorder_sentence" ? { tokens: line.replace(/^.*?:/, "").trim().split(/\s+/).filter(Boolean) } : {}),
   ...(type === "fill_blank" ? { accepted_answers: [] } : {}),
  };
  return {
   course_id: courseId,
   lesson_id: lessonId,
   point_id: pointId,
   exercise_type: type,
   prompt: line,
   content,
   answer: {},
   explanation: "",
   exercise_order: index + 1,
  };
 });
}

export type ParsedGrammarPoint = {
 title: string;
 hanzi?: string;
 pinyin?: string;
 vietnamese_title?: string;
 level?: string;
 category?: string;
 tags: string[];
 row_number: number;
 content: GrammarPointContent;
 exerciseDrafts: ReturnType<typeof parseExerciseLines>;
};

export function parseGrammarMarkdown(value: string, lesson: DbGrammarLesson, courseId: string): ParsedGrammarPoint[] {
 const blocks = value
  .split(/\n---+\n|(?=\n##\s+)/g)
  .map((block) => block.trim())
  .filter((block) => block.startsWith("## "));

 return blocks.map((block, index) => {
  const header = block.match(/^##\s*(.+?)(?:\s+[–-]\s+(.+?))?(?:\s+[–-]\s+(.+))?$/m);
  const title = header?.[1]?.trim() || `Ngữ pháp ${index + 1}`;
  const pinyin = header?.[2]?.trim();
  const vietnameseTitle = header?.[3]?.trim();
  const meta = block.match(/\*([^*\n]+)\*/)?.[1] || "";
  const tags = meta.split(/[·,]/).map((item) => item.trim()).filter(Boolean);
  const content: GrammarPointContent = {
   quick_example: parseQuickExample(section(block, "Ví dụ nhanh")),
   explanation: stripMarkdown(section(block, "Giải thích")),
   structures: parseList(section(block, "Cấu trúc")),
   usage_notes: parseList(section(block, "Cách dùng|Lưu ý")),
   common_mistakes: parseList(section(block, "Lỗi thường gặp")),
   comparisons: parseList(section(block, "So sánh")),
   examples: parseExamples(section(block, "Ví dụ thêm|Ví dụ")),
   source_metadata: {
    lesson_key: lesson.lesson_key,
    lesson_number: lesson.lesson_number,
    lesson_title: lesson.title,
    row_number: index + 1,
    source: "paste",
   },
  };

  return {
   title,
   hanzi: /^[\u3400-\u9fff]+$/.test(title) ? title : undefined,
   pinyin,
   vietnamese_title: vietnameseTitle,
   level: tags.find((tag) => /^HSK/i.test(tag)),
   category: tags.find((tag) => !/^HSK/i.test(tag)) || "Ngữ pháp",
   tags,
   row_number: index + 1,
   content,
   exerciseDrafts: parseExerciseLines(section(block, "Bài tập|Luyện tập"), courseId, lesson.id, null),
  };
 });
}

function rotate<T>(items: T[], index: number) {
 if (!items.length) return items;
 const offset = index % items.length;
 return [...items.slice(offset), ...items.slice(0, offset)];
}

function optionSet(answer: string, pool: string[], index: number) {
 const distractors = rotate(pool.filter((item) => normalizePlain(item) !== normalizePlain(answer)), index).slice(0, 3);
 return rotate([answer, ...distractors].slice(0, 4), index).map((text, optionIndex) => ({
  id: String.fromCharCode(65 + optionIndex),
  text,
 }));
}

function normalizePlain(value: string) {
 return value.trim().toLowerCase().replace(/\s+/g, "");
}

function getPointAnswer(point: GrammarPointWithProgress) {
 return point.content.quick_example?.zh || point.content.examples?.[0]?.zh || point.title;
}

function getPointPrompt(point: GrammarPointWithProgress) {
 return point.vietnamese_title || point.content.quick_example?.vi || point.content.core || point.content.explanation?.split(/[.\n]/)[0] || point.title;
}

function getRequiredTerms(point: GrammarPointWithProgress) {
 const source = [point.title, point.hanzi, ...(point.content.formulas || []), ...(point.content.structures || [])].filter(Boolean).join(" ");
 return Array.from(source.matchAll(/[\u3400-\u9fff]+/g)).map((match) => match[0]).slice(0, 4);
}

function exerciseBase(point: GrammarPointWithProgress, type: GrammarExerciseType, exerciseSetId: string, index: number): Pick<DbGrammarExercise, "course_id" | "lesson_id" | "point_id" | "exercise_type" | "content" | "explanation" | "exercise_order"> {
 return {
  course_id: point.course_id,
  lesson_id: point.lesson_id,
  point_id: point.id,
  exercise_type: type,
  content: {
   exercise_set_id: exerciseSetId,
   generated_by: EXERCISE_GENERATOR,
   generated_at: new Date().toISOString(),
   source_point_title: point.title,
  },
  explanation: point.content.explanation || point.content.core || point.content.usage_notes?.[0] || `Ôn lại cấu trúc ${point.title}.`,
  exercise_order: index + 1,
 };
}

export function generateGrammarExercisesForPoint({
 point,
 type,
 count,
 pool,
 exerciseSetId,
}: {
 point: GrammarPointWithProgress;
 type: GrammarExerciseType;
 count: number;
 pool: GrammarPointWithProgress[];
 exerciseSetId: string;
}): Omit<DbGrammarExercise, "id" | "created_at" | "updated_at">[] {
 const answer = getPointAnswer(point);
 const prompt = getPointPrompt(point);
 const examples = point.content.examples?.length ? point.content.examples : [point.content.quick_example].filter(Boolean);
 const structures = point.content.formulas?.length ? point.content.formulas : point.content.structures || [];
 const traps = point.content.traps?.length ? point.content.traps : point.content.common_mistakes || [];
 const structure = structures[0] || point.title;
 const requiredTerms = getRequiredTerms(point);
 const answerPool = pool.map(getPointAnswer).filter(Boolean);
 const promptVariants = [
  `Chọn câu/cấu trúc tiếng Trung đúng cho "${point.title}".`,
  `Chọn cách diễn đạt tự nhiên nhất theo công thức: ${indexSafe(structures, 0) || point.title}.`,
  `Chọn câu phù hợp với nghĩa tiếng Việt và tránh lỗi: ${indexSafe(traps, 0) || "không dùng sai ngữ cảnh"}.`,
  `Chọn mẫu câu đúng theo logic: ${point.content.core || point.content.explanation || point.title}.`,
 ];
 return Array.from({ length: Math.max(1, count) }).map((_, index) => {
  const base = exerciseBase(point, type, exerciseSetId, index);
  const example = examples[index % Math.max(1, examples.length)] || point.content.quick_example;
  if (type === "multiple_choice") {
   const choices = optionSet(answer, answerPool, index);
   const correct = choices.find((choice) => normalizePlain(choice.text) === normalizePlain(answer))?.id || "A";
   return {
    ...base,
    prompt: `${prompt}\n\n${promptVariants[index % promptVariants.length]}`,
    content: { ...(base.content || {}), choices },
    answer: { choice: correct, text: answer },
   };
  }
  if (type === "reorder_sentence") {
   const sample = example?.zh || answer;
   const tokens = sample.replace(/[。！？,.!?]/g, "").split(/\s+/).filter(Boolean);
   const safeTokens = tokens.length > 1 ? tokens : sample.replace(/[。！？,.!?]/g, "").split("");
   return {
    ...base,
    prompt: `Sắp xếp thành câu đúng (${index + 1}): ${example?.vi || prompt}`,
    content: { ...(base.content || {}), tokens: rotate(safeTokens, index) },
    answer: { text: sample },
   };
  }
  if (type === "translate_zh") {
   return {
    ...base,
    prompt: `Dịch sang tiếng Trung (${index + 1}): ${example?.vi || prompt}`,
    content: { ...(base.content || {}), sample_answer: example?.zh || answer, required_terms: requiredTerms },
    answer: { text: example?.zh || answer },
   };
  }
  if (type === "identify_error") {
   return {
    ...base,
    prompt: `Tìm lỗi sai hoặc điểm cần sửa (${index + 1}) theo cấu trúc "${point.title}": ${example?.zh || answer}`,
    content: { ...(base.content || {}), accepted_answers: [point.title, structure].filter(Boolean) },
    answer: { text: point.title },
   };
  }
  const blankAnswer = requiredTerms[index % Math.max(1, requiredTerms.length)] || point.title;
  return {
   ...base,
   prompt: `${(example?.zh || answer).replace(blankAnswer, "___")}\nĐiền phần còn thiếu (${index + 1}) theo "${structures[index % Math.max(1, structures.length)] || point.title}".`,
   content: { ...(base.content || {}), accepted_answers: [blankAnswer] },
   answer: { text: blankAnswer },
  };
 });
}

function indexSafe(items: string[], index: number) {
 return items.length ? items[index % items.length] : "";
}
