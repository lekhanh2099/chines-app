import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
 throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY.");
}

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
type Row = Record<string, unknown> & {
 id: string;
 lesson_id?: string;
 course_id?: string;
 book_id?: string;
 vocab_item_id?: string;
 owner_id?: string | null;
 source?: string;
 deleted_at?: string | null;
};

async function allRows(
 table: "hanzihome_vocab_items" | "hanzihome_vocab_examples" | "hanzihome_vocab_detail_sections",
 select: string,
) {
 const rows: Row[] = [];
 for (let from = 0; ; from += 1000) {
  const { data, error } = await client
   .from(table)
   .select(select)
   .range(from, from + 999);
  if (error) throw new Error(`${table}: ${error.message}`);
  rows.push(...((data ?? []) as unknown as Row[]));
  if (!data || data.length < 1000) return rows;
 }
}

function grouped(rows: Row[], key: string) {
 return Object.fromEntries(
  [
   ...rows.reduce(
    (map, row) =>
     map.set(String(row[key] ?? "(none)"), (map.get(String(row[key] ?? "(none)")) ?? 0) + 1),
    new Map<string, number>(),
   ),
  ].sort((left, right) => right[1] - left[1]),
 );
}

function groupedStorage(rows: Row[], key: string) {
 const groups = rows.reduce((map, row) => {
  const value = String(row[key] ?? "(none)");
  const current = map.get(value) ?? { rows: 0, approximateJsonBytes: 0 };
  current.rows += 1;
  current.approximateJsonBytes += Buffer.byteLength(JSON.stringify(row));
  map.set(value, current);
  return map;
 }, new Map<string, { rows: number; approximateJsonBytes: number }>());
 return Object.fromEntries([...groups].sort((left, right) => right[1].rows - left[1].rows));
}

function duplicateNaturalKeys(rows: Row[], keyFor: (row: Row) => string) {
 const counts = rows.reduce((map, row) => {
  const key = keyFor(row);
  map.set(key, (map.get(key) ?? 0) + 1);
  return map;
 }, new Map<string, number>());
 return [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function normalized(value: unknown) {
 return String(value ?? "")
  .normalize("NFKC")
  .trim()
  .replaceAll(/\s+/g, " ")
  .toLocaleLowerCase("vi-VN");
}

const [items, examples, details] = await Promise.all([
 allRows(
  "hanzihome_vocab_items",
  "id,lesson_id,course_id,book_id,owner_id,source,word,pinyin,meaning,deleted_at",
 ),
 allRows(
  "hanzihome_vocab_examples",
  "id,vocab_item_id,lesson_id,owner_id,source,zh,pinyin,vi,note,deleted_at",
 ),
 allRows(
  "hanzihome_vocab_detail_sections",
  "id,vocab_item_id,lesson_id,owner_id,source,section_key,title,lines,deleted_at",
 ),
]);
const itemIds = new Set(items.map((row) => row.id));
const itemById = new Map(items.map((row) => [row.id, row]));
const withParentScope = (rows: Row[]) =>
 rows.map((row) => {
  const parent = itemById.get(String(row.vocab_item_id));
  return {
   ...row,
   lesson_id: row.lesson_id ?? parent?.lesson_id,
   book_id: parent?.book_id,
   course_id: parent?.course_id,
  };
 });
const scopedExamples = withParentScope(examples);
const scopedDetails = withParentScope(details);
const active = (rows: Row[]) => rows.filter((row) => !row.deleted_at);
const duplicateIds = (rows: Row[]) => rows.length - new Set(rows.map((row) => row.id)).size;
const boilerplate = active(details).filter((row) => {
 const text = JSON.stringify([row.title, row.lines]).toLocaleLowerCase("vi-VN");
 return text.includes("không dùng thuật toán") || text.includes("không phải suy đoán");
});
const renderedSectionKeys = new Set([
 "meaning",
 "word_formation",
 "comparison",
 "collocations",
 "warnings",
 "culture",
 "notes",
]);
const unrenderedSectionKeys = Object.fromEntries(
 Object.entries(grouped(active(details), "section_key")).filter(
  ([key]) => !renderedSectionKeys.has(key) && !key.startsWith("custom:"),
 ),
);

console.log(
 JSON.stringify(
  {
   generatedAt: new Date().toISOString(),
   counts: {
    vocabItems: { active: active(items).length, deleted: items.length - active(items).length },
    examples: {
     active: active(examples).length,
     deleted: examples.length - active(examples).length,
    },
    detailSections: {
     active: active(details).length,
     deleted: details.length - active(details).length,
    },
   },
   approximateJsonBytes: {
    examples: Buffer.byteLength(JSON.stringify(examples)),
    detailSections: Buffer.byteLength(JSON.stringify(details)),
   },
   storageBreakdown: {
    examples: {
     byCourse: groupedStorage(scopedExamples, "course_id"),
     byBook: groupedStorage(scopedExamples, "book_id"),
     byLesson: groupedStorage(scopedExamples, "lesson_id"),
    },
    detailSections: {
     byCourse: groupedStorage(scopedDetails, "course_id"),
     byBook: groupedStorage(scopedDetails, "book_id"),
     byLesson: groupedStorage(scopedDetails, "lesson_id"),
     bySectionKey: groupedStorage(scopedDetails, "section_key"),
    },
   },
   source: { examples: grouped(examples, "source"), detailSections: grouped(details, "source") },
   ownership: {
    examples: grouped(examples, "owner_id"),
    detailSections: grouped(details, "owner_id"),
   },
   sectionKeys: grouped(active(details), "section_key"),
   integrity: {
    duplicateIds: {
     items: duplicateIds(items),
     examples: duplicateIds(examples),
     details: duplicateIds(details),
    },
    duplicateNaturalKeys: {
     examplesWithinSameWord: duplicateNaturalKeys(active(examples), (row) =>
      [row.vocab_item_id, normalized(row.zh), normalized(row.pinyin), normalized(row.vi)].join("|"),
     ),
     sectionsWithinSameWord: duplicateNaturalKeys(active(details), (row) =>
      [row.vocab_item_id, row.section_key].join("|"),
     ),
    },
    repeatedContentAcrossDifferentWords: {
     examples: duplicateNaturalKeys(active(examples), (row) =>
      [normalized(row.zh), normalized(row.pinyin), normalized(row.vi)].join("|"),
     ),
     detailSections: duplicateNaturalKeys(active(details), (row) =>
      [row.section_key, normalized(row.title), normalized(row.lines)].join("|"),
     ),
     classification:
      "Reported separately; repeated content under different vocabulary items is not automatically a duplicate.",
    },
    orphanExamples: examples.filter((row) => !itemIds.has(String(row.vocab_item_id))).length,
    orphanDetails: details.filter((row) => !itemIds.has(String(row.vocab_item_id))).length,
    emptyDetails: active(details).filter(
     (row) => !Array.isArray(row.lines) || row.lines.length === 0,
    ).length,
    boilerplateDetails: boilerplate.length,
    unrenderedSectionKeys,
   },
  },
  null,
  2,
 ),
);
