import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local" });

const DEFAULT_COURSE_ID = "hanyu-jiaocheng";
const DEFAULT_BOOK_ID = "hanyu-2";
const IMPORTED_AT = new Date().toISOString();

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
    .object({
      vi: z.string().optional(),
      zh: z.string().optional(),
    })
    .nullable()
    .optional(),
  level: z.string().nullable().optional(),
  definitions: z.array(z.string()).optional(),
  tone: z.string().optional(),
  etymology: z.array(z.string()).optional(),
  comparisons: z.array(z.string()).optional(),
  collocations: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  culture: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
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
    app: z.string(),
    dataset: z.string(),
    version: z.string(),
    generatedAt: z.string(),
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

type CountableTable =
  | "hanzihome_courses"
  | "hanzihome_course_books"
  | "hanzihome_lessons"
  | "hanzihome_vocab_items"
  | "hanzihome_grammar_points"
  | "hanzihome_vocab_examples"
  | "hanzihome_grammar_examples"
  | "hanzihome_vocab_detail_sections"
  | "hanzihome_grammar_detail_sections";

type SeedColumnValue = string | number | null | string[];
type SeedRow = {
  id: string;
  [column: string]: SeedColumnValue;
};

type SeedTable = {
  Row: { id: string };
  Insert: SeedRow;
  Update: Partial<SeedRow>;
  Relationships: [];
};

type EmptySchemaSection = Record<never, never>;

type SeedDatabase = {
  public: {
    Tables: {
      hanzihome_courses: SeedTable;
      hanzihome_course_books: SeedTable;
      hanzihome_lessons: SeedTable;
      hanzihome_lesson_texts: SeedTable;
      hanzihome_vocab_items: SeedTable;
      hanzihome_vocab_examples: SeedTable;
      hanzihome_vocab_detail_sections: SeedTable;
      hanzihome_grammar_points: SeedTable;
      hanzihome_grammar_examples: SeedTable;
      hanzihome_grammar_detail_sections: SeedTable;
    };
    Views: EmptySchemaSection;
    Functions: EmptySchemaSection;
    Enums: EmptySchemaSection;
    CompositeTypes: EmptySchemaSection;
  };
};

type SeedSupabaseClient = SupabaseClient<SeedDatabase>;

type VocabExample = {
  zh: string;
  pinyin?: string;
  vi?: string;
  note?: string;
};

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
        throw new Error(
          `Lesson ${lesson.id} references missing grammar point ${grammarId}`,
        );
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
      throw new Error(
        `Grammar point ${point.id} references missing lesson ${point.lessonId}`,
      );
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
    throw new Error(
      `Lesson count mismatch: meta=${bundle.meta.counts.lessons}, actual=${bundle.lessons.length}`,
    );
  }

  if (bundle.meta.counts.vocab !== bundle.vocab.length) {
    throw new Error(
      `Vocab count mismatch: meta=${bundle.meta.counts.vocab}, actual=${bundle.vocab.length}`,
    );
  }

  if (bundle.meta.counts.grammarPoints !== bundle.grammarPoints.length) {
    throw new Error(
      `Grammar count mismatch: meta=${bundle.meta.counts.grammarPoints}, actual=${bundle.grammarPoints.length}`,
    );
  }

  ensureCriticalReferences(bundle);
  return bundle;
}

async function countRows(supabase: SeedSupabaseClient, table: CountableTable) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(`Could not count ${table}: ${error.message}`);

  return count ?? 0;
}

async function getCounts(supabase: SeedSupabaseClient) {
  const [
    courses,
    books,
    lessons,
    vocabItems,
    grammarPoints,
    vocabExamples,
    grammarExamples,
    vocabDetailSections,
    grammarDetailSections,
  ] = await Promise.all([
    countRows(supabase, "hanzihome_courses"),
    countRows(supabase, "hanzihome_course_books"),
    countRows(supabase, "hanzihome_lessons"),
    countRows(supabase, "hanzihome_vocab_items"),
    countRows(supabase, "hanzihome_grammar_points"),
    countRows(supabase, "hanzihome_vocab_examples"),
    countRows(supabase, "hanzihome_grammar_examples"),
    countRows(supabase, "hanzihome_vocab_detail_sections"),
    countRows(supabase, "hanzihome_grammar_detail_sections"),
  ]);

  return {
    hanzihome_courses: courses,
    hanzihome_course_books: books,
    hanzihome_lessons: lessons,
    hanzihome_vocab_items: vocabItems,
    hanzihome_grammar_points: grammarPoints,
    hanzihome_vocab_examples: vocabExamples,
    hanzihome_grammar_examples: grammarExamples,
    hanzihome_vocab_detail_sections: vocabDetailSections,
    hanzihome_grammar_detail_sections: grammarDetailSections,
  };
}

async function upsertRows(
  supabase: SeedSupabaseClient,
  table: CountableTable | "hanzihome_lesson_texts",
  rows: SeedRow[],
  onConflict = "id",
) {
  if (rows.length === 0) return;

  const { error } = await supabase.from(table).upsert(rows, { onConflict });

  if (error) {
    throw new Error(`Could not upsert ${table}: ${error.message}`);
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. The seed importer needs server/admin credentials and must not run in browser code.",
    );
  }

  const bundle = await readBundle();
  const supabase = createClient<SeedDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  const lessonsById = new Map(bundle.lessons.map((lesson) => [lesson.id, lesson]));
  const before = await getCounts(supabase);

  await upsertRows(supabase, "hanzihome_courses", [
    {
      id: DEFAULT_COURSE_ID,
      user_id: null,
      slug: "giao-trinh-han-ngu",
      title: "Giáo trình Hán ngữ",
      subtitle: "Seed import từ hanzihome_bundle_clean.json",
      type: "hanyu",
      course_order: 1,
      source: "seed",
      imported_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    },
  ]);

  await upsertRows(supabase, "hanzihome_course_books", [
    {
      id: DEFAULT_BOOK_ID,
      course_id: DEFAULT_COURSE_ID,
      user_id: null,
      source: "seed",
      title: "Giáo trình Hán ngữ 2",
      short_title: "Hán ngữ 2",
      book_order: 2,
      imported_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    },
  ]);

  await upsertRows(
    supabase,
    "hanzihome_lessons",
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
      imported_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    })),
  );

  await upsertRows(
    supabase,
    "hanzihome_lesson_texts",
    bundle.lessons.map((lesson) => ({
      id: `${lesson.id}-main-text`,
      lesson_id: lesson.id,
      owner_id: null,
      source: "seed",
      text_key: "main",
      title: `Bài khóa ${lesson.lessonNumber}`,
      content: "",
      content_format: "markdown",
      imported_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    })),
  );

  await upsertRows(
    supabase,
    "hanzihome_vocab_items",
    bundle.vocab.map((item, index) => {
      const lesson = lessonsById.get(item.lessonId);
      if (!lesson) {
        throw new Error(`Vocab ${item.id} references missing lesson ${item.lessonId}`);
      }

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
        imported_at: IMPORTED_AT,
        updated_at: IMPORTED_AT,
      };
    }),
  );

  const vocabExamples = bundle.vocab.flatMap((item) =>
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
        imported_at: IMPORTED_AT,
        updated_at: IMPORTED_AT,
      }),
    ),
  );

  await upsertRows(supabase, "hanzihome_vocab_examples", vocabExamples);

  const vocabDetailSections = bundle.vocab.flatMap((item) =>
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
        imported_at: IMPORTED_AT,
        updated_at: IMPORTED_AT,
      };
    }),
  );

  await upsertRows(
    supabase,
    "hanzihome_vocab_detail_sections",
    vocabDetailSections,
  );

  await upsertRows(
    supabase,
    "hanzihome_grammar_points",
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
        imported_at: IMPORTED_AT,
        updated_at: IMPORTED_AT,
      };
    }),
  );

  const grammarExamples = bundle.grammarPoints.flatMap((point) => {
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
        imported_at: IMPORTED_AT,
        updated_at: IMPORTED_AT,
      }),
    );
  });

  await upsertRows(supabase, "hanzihome_grammar_examples", grammarExamples);

  const grammarDetailSections = bundle.grammarPoints.flatMap((point) => {
    const contentLines = splitGrammarLines(point.contentMd ?? "");
    const structures = lines(point.structures);
    const sections = [
      {
        key: "content",
        title: "Giải thích",
        lines: contentLines,
      },
      {
        key: "structures",
        title: "Cấu trúc",
        lines: structures,
      },
    ].filter((section) => section.lines.length > 0);

    return sections.map((section, index) => ({
      id: `${point.id}-section-${section.key}`,
      grammar_point_id: point.id,
      lesson_id: point.lessonId,
      owner_id: null,
      source: "seed",
      section_key: section.key,
      title: section.title,
      lines: section.lines,
      section_order: index + 1,
      imported_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    }));
  });

  await upsertRows(
    supabase,
    "hanzihome_grammar_detail_sections",
    grammarDetailSections,
  );

  const after = await getCounts(supabase);

  console.log("HanziHome seed import complete");
  console.table({
    courses: {
      before: before.hanzihome_courses,
      after: after.hanzihome_courses,
    },
    books: {
      before: before.hanzihome_course_books,
      after: after.hanzihome_course_books,
    },
    lessons: {
      before: before.hanzihome_lessons,
      after: after.hanzihome_lessons,
    },
    vocabItems: {
      before: before.hanzihome_vocab_items,
      after: after.hanzihome_vocab_items,
    },
    grammarPoints: {
      before: before.hanzihome_grammar_points,
      after: after.hanzihome_grammar_points,
    },
    vocabExamples: {
      before: before.hanzihome_vocab_examples,
      after: after.hanzihome_vocab_examples,
    },
    grammarExamples: {
      before: before.hanzihome_grammar_examples,
      after: after.hanzihome_grammar_examples,
    },
    detailSections: {
      before:
        before.hanzihome_vocab_detail_sections +
        before.hanzihome_grammar_detail_sections,
      after:
        after.hanzihome_vocab_detail_sections +
        after.hanzihome_grammar_detail_sections,
    },
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
