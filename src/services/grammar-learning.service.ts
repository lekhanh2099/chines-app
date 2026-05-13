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
