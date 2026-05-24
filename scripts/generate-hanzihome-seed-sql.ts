import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { z } from "zod";

const DEFAULT_COURSE_ID = "hanyu-jiaocheng";
const DEFAULT_BOOK_ID = "hanyu-2";
const GENERATED_AT_SQL = "now()";
const ROWS_PER_INSERT = 100;

const detailSectionMeta = [
  { sourceKey: "meaningBlock", key: "meaning", title: "Nghĩa" },
  { sourceKey: "etymologyBlock", key: "etymology", title: "Chiết tự / logic" },
  { sourceKey: "comparisonBlock", key: "comparisons", title: "So sánh" },
  { sourceKey: "collocationsBlock", key: "collocations", title: "Kết hợp thường gặp" },
  { sourceKey: "cultureBlock", key: "culture", title: "Văn hóa" },
  { sourceKey: "notesBlock", key: "notes", title: "Lưu ý lỗi sai" },
] as const;

const vocabRawSectionsSchema = z
  .object({
    meaningBlock: z.array(z.string()).optional(),
    etymologyBlock: z.array(z.string()).optional(),
    comparisonBlock: z.array(z.string()).optional(),
    collocationsBlock: z.array(z.string()).optional(),
    examplesBlock: z.array(z.string()).optional(),
    cultureBlock: z.array(z.string()).optional(),
    notesBlock: z.array(z.string()).optional(),
  })
  .passthrough();

const vocabItemSchema = z.object({
  id: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
  lessonNumber: z.number().int().positive(),
  word: z.string().trim().min(1),
  pinyin: z.string().trim().min(1),
  hanViet: z.string().trim().min(1),
  meaning: z.string().trim().min(1),
  pos: z
    .object({ vi: z.string().optional(), zh: z.string().optional() })
    .nullable()
    .optional(),
  level: z.string().nullable().optional(),
  tone: z.string().optional(),
  examples: z.array(z.string()).optional(),
  rawSections: vocabRawSectionsSchema.optional(),
  sourceFile: z.string().optional(),
});

const lessonSchema = z.object({
  id: z.string().trim().min(1),
  lessonNumber: z.number().int().positive(),
  titleZh: z.string().trim().min(1),
  sourceFile: z.string().optional(),
  vocabCategories: z.array(
    z.object({
      nameVi: z.string().trim().min(1),
      words: z.array(z.string().trim().min(1)),
    }),
  ),
  vocabCount: z.number().int().nonnegative(),
  vocabIds: z.array(z.string().trim().min(1)),
  grammarPointIds: z.array(z.string().trim().min(1)),
});

const grammarPointSchema = z.object({
  id: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
  lessonNumber: z.number().int().positive(),
  title: z.string().trim().min(1),
  contentMd: z.string().optional(),
  structures: z.array(z.string()).optional(),
  examplesRaw: z.array(z.string()).optional(),
});

const bundleSchema = z.object({
  meta: z.object({
    counts: z.object({
      lessons: z.number().int(),
      vocab: z.number().int(),
      grammarPoints: z.number().int(),
    }),
  }),
  lessons: z.array(lessonSchema).min(1),
  vocab: z.array(vocabItemSchema).min(1),
  grammarPoints: z.array(grammarPointSchema),
});

type Lesson = z.infer<typeof lessonSchema>;
type VocabItem = z.infer<typeof vocabItemSchema>;
type GrammarPoint = z.infer<typeof grammarPointSchema>;
type SqlValue = string | number | string[] | null;
type SqlRow = Record<string, SqlValue>;

type VocabExample = {
  zh: string;
  pinyin?: string;
  vi?: string;
  note?: string;
};

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlValue(value: SqlValue) {
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return `array[${value.map(sqlString).join(", ")}]::text[]`;
  }
  return sqlString(value);
}

function sqlTimestamp() {
  return GENERATED_AT_SQL;
}

function lines(value?: string[]) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

function cleanTitle(title: string) {
  return title.replace(/\\\./g, ".").replace(/^(\d+\.)\s*/, "").trim();
}

function splitGrammarLines(content: string) {
  return content
    .split("\n")
    .map((line) => line.replace(/^\*\s*/, "").trim())
    .filter(Boolean);
}

function parseVocabExamples(rawLines?: string[]): VocabExample[] {
  const source = lines(rawLines);
  const examples: VocabExample[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const line = source[index];
    if (!line?.startsWith("中文:")) continue;

    examples.push({
      zh: line.replace(/^中文:\s*/, ""),
      pinyin: source[index + 1]?.replace(/^Pinyin:\s*/i, ""),
      vi: source[index + 2]?.replace(/^Dịch:\s*/i, ""),
      note: source[index + 3]?.replace(/^Phân tích:\s*/i, ""),
    });
  }

  return examples;
}

function parseGrammarExamples(linesToParse: string[]): VocabExample[] {
  return linesToParse
    .filter((line) => /[\u3400-\u9fff]/.test(line))
    .map((line) => {
      const match = line.match(/^(.+?)[（(](.+?)[）)]$/);
      return {
        zh: match?.[1]?.trim() || line,
        vi: match?.[2]?.trim() || "",
      };
    });
}

function findCategory(lesson: Lesson, word: string) {
  return (
    lesson.vocabCategories.find((category) => category.words.includes(word))
      ?.nameVi ?? "Từ vựng"
  );
}

function ensureCriticalReferences({
  lessons,
  vocab,
  grammarPoints,
}: {
  lessons: Lesson[];
  vocab: VocabItem[];
  grammarPoints: GrammarPoint[];
}) {
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const vocabIds = new Set(vocab.map((item) => item.id));
  const grammarIds = new Set(grammarPoints.map((point) => point.id));

  for (const lesson of lessons) {
    for (const vocabId of lesson.vocabIds) {
      if (!vocabIds.has(vocabId)) {
        throw new Error(`Lesson ${lesson.id} references missing vocab ${vocabId}`);
      }
    }

    for (const grammarId of lesson.grammarPointIds) {
      if (!grammarIds.has(grammarId)) {
        throw new Error(`Lesson ${lesson.id} references missing grammar ${grammarId}`);
      }
    }
  }

  for (const item of vocab) {
    if (!lessonIds.has(item.lessonId)) {
      throw new Error(`Vocab ${item.id} references missing lesson ${item.lessonId}`);
    }
  }

  for (const point of grammarPoints) {
    if (!lessonIds.has(point.lessonId)) {
      throw new Error(`Grammar ${point.id} references missing lesson ${point.lessonId}`);
    }
  }
}

async function readBundle() {
  const scriptPath = fileURLToPath(import.meta.url);
  const bundlePath = path.join(
    path.dirname(scriptPath),
    "..",
    "data",
    "hanzihome",
    "hanzihome_bundle_clean.json",
  );
  const raw = await readFile(bundlePath, "utf8");
  const parsedJson: unknown = JSON.parse(raw);
  const bundle = bundleSchema.parse(parsedJson);

  if (bundle.meta.counts.lessons !== bundle.lessons.length) {
    throw new Error("Lesson count mismatch");
  }
  if (bundle.meta.counts.vocab !== bundle.vocab.length) {
    throw new Error("Vocab count mismatch");
  }
  if (bundle.meta.counts.grammarPoints !== bundle.grammarPoints.length) {
    throw new Error("Grammar count mismatch");
  }

  ensureCriticalReferences(bundle);
  return bundle;
}

function insertSql(table: string, columns: string[], rows: SqlRow[]) {
  if (rows.length === 0) return "";

  const updateColumns = columns.filter((column) => column !== "id" && column !== "created_at");
  const statements: string[] = [];

  for (let index = 0; index < rows.length; index += ROWS_PER_INSERT) {
    const chunk = rows.slice(index, index + ROWS_PER_INSERT);
    const values = chunk
      .map(
        (row) =>
          `(${columns
            .map((column) =>
              column === "imported_at" || column === "updated_at"
                ? sqlTimestamp()
                : sqlValue(row[column] ?? null),
            )
            .join(", ")})`,
      )
      .join(",\n");
    const updates = updateColumns
      .map((column) => `${column} = excluded.${column}`)
      .join(", ");

    statements.push(`insert into public.${table} (${columns.join(", ")})
values
${values}
on conflict (id) do update set ${updates};`);
  }

  return statements.join("\n\n");
}

async function main() {
  const bundle = await readBundle();
  const lessonsById = new Map(bundle.lessons.map((lesson) => [lesson.id, lesson]));

  const sections = [
    "begin;",
    insertSql(
      "hanzihome_courses",
      [
        "id",
        "user_id",
        "slug",
        "title",
        "subtitle",
        "type",
        "course_order",
        "source",
        "imported_at",
        "updated_at",
      ],
      [
        {
          id: DEFAULT_COURSE_ID,
          user_id: null,
          slug: "giao-trinh-han-ngu",
          title: "Giáo trình Hán ngữ",
          subtitle: "Seed import từ hanzihome_bundle_clean.json",
          type: "hanyu",
          course_order: 1,
          source: "seed",
          imported_at: null,
          updated_at: null,
        },
      ],
    ),
    insertSql(
      "hanzihome_course_books",
      [
        "id",
        "course_id",
        "user_id",
        "source",
        "title",
        "short_title",
        "book_order",
        "imported_at",
        "updated_at",
      ],
      [
        {
          id: DEFAULT_BOOK_ID,
          course_id: DEFAULT_COURSE_ID,
          user_id: null,
          source: "seed",
          title: "Giáo trình Hán ngữ 2",
          short_title: "Hán ngữ 2",
          book_order: 2,
          imported_at: null,
          updated_at: null,
        },
      ],
    ),
    insertSql(
      "hanzihome_lessons",
      [
        "id",
        "course_id",
        "book_id",
        "owner_id",
        "source",
        "lesson_number",
        "lesson_order",
        "title_zh",
        "title_vi",
        "source_file",
        "imported_at",
        "updated_at",
      ],
      bundle.lessons.map((lesson) => ({
        id: lesson.id,
        course_id: DEFAULT_COURSE_ID,
        book_id: DEFAULT_BOOK_ID,
        owner_id: null,
        source: "seed",
        lesson_number: lesson.lessonNumber,
        lesson_order: lesson.lessonNumber,
        title_zh: lesson.titleZh,
        title_vi: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
        source_file: lesson.sourceFile ?? null,
        imported_at: null,
        updated_at: null,
      })),
    ),
    insertSql(
      "hanzihome_lesson_texts",
      [
        "id",
        "lesson_id",
        "owner_id",
        "source",
        "text_key",
        "title",
        "content",
        "content_format",
        "imported_at",
        "updated_at",
      ],
      bundle.lessons.map((lesson) => ({
        id: `${lesson.id}-main-text`,
        lesson_id: lesson.id,
        owner_id: null,
        source: "seed",
        text_key: "main",
        title: `Bài khóa ${lesson.lessonNumber}`,
        content: "",
        content_format: "markdown",
        imported_at: null,
        updated_at: null,
      })),
    ),
  ];

  sections.push(
    insertSql(
      "hanzihome_vocab_items",
      [
        "id",
        "lesson_id",
        "course_id",
        "book_id",
        "owner_id",
        "source",
        "item_order",
        "word",
        "pinyin",
        "han_viet",
        "meaning",
        "category",
        "level",
        "pos_vi",
        "pos_zh",
        "tone",
        "source_file",
        "imported_at",
        "updated_at",
      ],
      bundle.vocab.map((item, index) => {
        const lesson = lessonsById.get(item.lessonId);
        if (!lesson) throw new Error(`Missing lesson ${item.lessonId}`);

        return {
          id: item.id,
          lesson_id: item.lessonId,
          course_id: DEFAULT_COURSE_ID,
          book_id: DEFAULT_BOOK_ID,
          owner_id: null,
          source: "seed",
          item_order: index + 1,
          word: item.word,
          pinyin: item.pinyin,
          han_viet: item.hanViet,
          meaning: item.meaning,
          category: findCategory(lesson, item.word),
          level: item.level ?? null,
          pos_vi: item.pos?.vi ?? null,
          pos_zh: item.pos?.zh ?? null,
          tone: item.tone ?? null,
          source_file: item.sourceFile ?? null,
          imported_at: null,
          updated_at: null,
        };
      }),
    ),
  );

  sections.push(
    insertSql(
      "hanzihome_vocab_examples",
      [
        "id",
        "vocab_item_id",
        "lesson_id",
        "owner_id",
        "source",
        "example_order",
        "zh",
        "pinyin",
        "vi",
        "note",
        "imported_at",
        "updated_at",
      ],
      bundle.vocab.flatMap((item) =>
        parseVocabExamples(item.rawSections?.examplesBlock ?? item.examples).map(
          (example, index) => ({
            id: `${item.id}-example-${index + 1}`,
            vocab_item_id: item.id,
            lesson_id: item.lessonId,
            owner_id: null,
            source: "seed",
            example_order: index + 1,
            zh: example.zh,
            pinyin: example.pinyin ?? null,
            vi: example.vi ?? null,
            note: example.note ?? null,
            imported_at: null,
            updated_at: null,
          }),
        ),
      ),
    ),
  );

  sections.push(
    insertSql(
      "hanzihome_vocab_detail_sections",
      [
        "id",
        "vocab_item_id",
        "lesson_id",
        "owner_id",
        "source",
        "section_key",
        "title",
        "lines",
        "section_order",
        "imported_at",
        "updated_at",
      ],
      bundle.vocab.flatMap((item) =>
        detailSectionMeta.flatMap((section, index) => {
          const sectionLines = lines(item.rawSections?.[section.sourceKey]);
          if (sectionLines.length === 0) return [];

          return {
            id: `${item.id}-section-${section.key}`,
            vocab_item_id: item.id,
            lesson_id: item.lessonId,
            owner_id: null,
            source: "seed",
            section_key: section.key,
            title: section.title,
            lines: sectionLines,
            section_order: index + 1,
            imported_at: null,
            updated_at: null,
          };
        }),
      ),
    ),
  );

  sections.push(
    insertSql(
      "hanzihome_grammar_points",
      [
        "id",
        "lesson_id",
        "course_id",
        "book_id",
        "owner_id",
        "source",
        "point_order",
        "title",
        "clean_title",
        "core",
        "content_md",
        "structures_view",
        "notes",
        "imported_at",
        "updated_at",
      ],
      bundle.grammarPoints.map((point, index) => {
        const contentLines = splitGrammarLines(point.contentMd ?? "");
        const structuresView =
          point.structures?.map((item) => item.replace(/\\\+/g, "+")) ??
          contentLines
            .filter((line) => /^Cấu trúc:/i.test(line))
            .map((line) => line.replace(/^Cấu trúc:\s*/i, ""));
        const core =
          contentLines
            .find((line) => /^Công dụng:/i.test(line))
            ?.replace(/^Công dụng:\s*/i, "") ??
          contentLines[0] ??
          "";

        return {
          id: point.id,
          lesson_id: point.lessonId,
          course_id: DEFAULT_COURSE_ID,
          book_id: DEFAULT_BOOK_ID,
          owner_id: null,
          source: "seed",
          point_order: index + 1,
          title: point.title,
          clean_title: cleanTitle(point.title),
          core,
          content_md: point.contentMd ?? null,
          structures_view: structuresView,
          notes: contentLines.filter((line) => /lưu ý|chú ý|không|sai|bẫy/i.test(line)),
          imported_at: null,
          updated_at: null,
        };
      }),
    ),
  );

  sections.push(
    insertSql(
      "hanzihome_grammar_examples",
      [
        "id",
        "grammar_point_id",
        "lesson_id",
        "owner_id",
        "source",
        "example_order",
        "zh",
        "pinyin",
        "vi",
        "note",
        "imported_at",
        "updated_at",
      ],
      bundle.grammarPoints.flatMap((point) => {
        const contentLines = splitGrammarLines(point.contentMd ?? "");
        return parseGrammarExamples(point.examplesRaw ?? contentLines).map(
          (example, index) => ({
            id: `${point.id}-example-${index + 1}`,
            grammar_point_id: point.id,
            lesson_id: point.lessonId,
            owner_id: null,
            source: "seed",
            example_order: index + 1,
            zh: example.zh,
            pinyin: example.pinyin ?? null,
            vi: example.vi ?? null,
            note: example.note ?? null,
            imported_at: null,
            updated_at: null,
          }),
        );
      }),
    ),
  );

  sections.push(
    insertSql(
      "hanzihome_grammar_detail_sections",
      [
        "id",
        "grammar_point_id",
        "lesson_id",
        "owner_id",
        "source",
        "section_key",
        "title",
        "lines",
        "section_order",
        "imported_at",
        "updated_at",
      ],
      bundle.grammarPoints.flatMap((point) => {
        const contentLines = splitGrammarLines(point.contentMd ?? "");
        const sectionsForPoint = [
          { key: "content", title: "Giải thích", lines: contentLines },
          { key: "structures", title: "Cấu trúc", lines: lines(point.structures) },
        ].filter((section) => section.lines.length > 0);

        return sectionsForPoint.map((section, index) => ({
          id: `${point.id}-section-${section.key}`,
          grammar_point_id: point.id,
          lesson_id: point.lessonId,
          owner_id: null,
          source: "seed",
          section_key: section.key,
          title: section.title,
          lines: section.lines,
          section_order: index + 1,
          imported_at: null,
          updated_at: null,
        }));
      }),
    ),
  );

  sections.push("commit;");
  sections.push(`select
  (select count(*) from public.hanzihome_courses where source = 'seed') as courses,
  (select count(*) from public.hanzihome_course_books where source = 'seed') as books,
  (select count(*) from public.hanzihome_lessons where source = 'seed') as lessons,
  (select count(*) from public.hanzihome_vocab_items where source = 'seed') as vocab_items,
  (select count(*) from public.hanzihome_grammar_points where source = 'seed') as grammar_points,
  (select count(*) from public.hanzihome_vocab_examples where source = 'seed') as vocab_examples,
  (select count(*) from public.hanzihome_grammar_examples where source = 'seed') as grammar_examples,
  (select count(*) from public.hanzihome_vocab_detail_sections where source = 'seed') +
  (select count(*) from public.hanzihome_grammar_detail_sections where source = 'seed') as detail_sections;`);

  const outputPath = process.argv[2] ?? "/private/tmp/hanzihome-seed.sql";
  await writeFile(outputPath, `${sections.filter(Boolean).join("\n\n")}\n`);
  console.log(outputPath);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
