import { beforeEach, describe, expect, it, vi } from "vitest";

type RecordedQuery = { table: string; filters: string[] };

const { queries } = vi.hoisted(() => {
 const queries: RecordedQuery[] = [];
 return { queries };
});

// Chainable PostgREST stand-in: records every `.is(column, value)` filter per
// table and resolves each query with an empty page.
function recordingClient() {
 return {
  from(table: string) {
   const query: RecordedQuery = { table, filters: [] };
   queries.push(query);
   const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    range: () => builder,
    limit: () => builder,
    is: (column: string, value: null) => {
     query.filters.push(`${column} is ${String(value)}`);
     return builder;
    },
    then: (resolve: (value: { data: never[]; error: null }) => void) =>
     resolve({ data: [], error: null }),
   };
   return builder;
  },
 };
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => recordingClient()) }));

import { supabaseHanziHomeContentRepository } from "./supabase-hanzihome-content-repository";

function filtersFor(table: string) {
 return queries.filter((query) => query.table === table).map((query) => query.filters);
}

describe("supabaseHanziHomeContentRepository soft-delete filtering", () => {
 beforeEach(() => {
  queries.length = 0;
 });

 it("excludes soft-deleted rows from the search index even when RLS exposes them to editors", async () => {
  // Empty fixture radicals make the search build reject after every query has
  // been issued; only the issued filters are under test here.
  await supabaseHanziHomeContentRepository.getSearchData().catch(() => undefined);

  for (const table of [
   "hanzihome_lesson_sections",
   "hanzihome_lesson_texts",
   "hanzihome_vocab_items",
   "hanzihome_grammar_points",
  ]) {
   expect(filtersFor(table), table).toEqual([expect.arrayContaining(["deleted_at is null"])]);
  }
 });

 it("excludes soft-deleted sections, texts and grammar children from lesson detail", async () => {
  await supabaseHanziHomeContentRepository.getLessonDetail("lesson-1");

  expect(filtersFor("hanzihome_lessons")).toEqual([
   expect.arrayContaining(["deleted_at is null", "texts.deleted_at is null"]),
  ]);
  expect(filtersFor("hanzihome_lesson_sections")).toEqual([
   expect.arrayContaining(["deleted_at is null"]),
  ]);
  expect(filtersFor("hanzihome_grammar_points")).toEqual([
   expect.arrayContaining([
    "deleted_at is null",
    "examples.deleted_at is null",
    "details.deleted_at is null",
   ]),
  ]);
 });
});
