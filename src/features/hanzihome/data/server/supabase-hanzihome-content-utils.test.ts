import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { matchesTextQuery, radicalRowToViewModel } from "./supabase-hanzihome-content-utils";

describe("supabase HanziHome content utils", () => {
 it("matches a case-insensitive text query and treats a blank query as a match", () => {
  expect(matchesTextQuery(["Xin Chào"], "chào")).toBe(true);
  expect(matchesTextQuery(["你好"], "再见")).toBe(false);
  expect(matchesTextQuery([], "  ")).toBe(true);
 });

 it("maps a radical row to its view model with the write target used by radical editing", () => {
  const radical = radicalRowToViewModel({
   id: "radical-9",
   radical_index: 9,
   radical: "人",
   name_vi: "Nhân",
   strokes: 2,
   core_meaning: { modern: "người" },
   recognition: null,
   variants: [{ form: "亻", note: "" }],
   related_components: [],
   distinguish: [],
   groups: [],
   updated_at: "2026-11-16T00:00:00.000Z",
  });

  expect(radical).toMatchObject({ id: "radical-9", index: 9, nameVi: "Nhân", strokes: 2 });
  expect(radical.recognition).toBeUndefined();
  expect(radical.editMeta).toMatchObject({
   entityType: "radical",
   dbId: "radical-9",
   updatedAt: "2026-11-16T00:00:00.000Z",
  });
 });
});
