import { describe, expect, it, vi } from "vitest";

const { createServiceRoleSupabaseClient } = vi.hoisted(() => ({
 createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role.server", () => ({ createServiceRoleSupabaseClient }));

import { validateReaderPronunciationOverride } from "./reader-pronunciation-override-repository.server";

const baseInput: Parameters<typeof validateReaderPronunciationOverride>[0] = {
 id: "00000000-0000-4000-8000-000000000001",
 documentId: "reader-1",
 paragraphId: "paragraph-1",
 text: "重庆",
 readings: ["chong2", "qing4"],
 scope: "sentence-instance",
 sentenceText: "😀重庆",
 startOffset: 2,
 endOffset: 4,
 expectedRevision: 0,
};

describe("Reader pronunciation override validation", () => {
 it("accepts a sentence-instance override at Intl.Segmenter offsets", () => {
  expect(() => validateReaderPronunciationOverride(baseInput, "😀重庆")).not.toThrow();
 });

 it("rejects a range whose text no longer matches the static Reader paragraph", () => {
  expect(() =>
   validateReaderPronunciationOverride({ ...baseInput, text: "北京" }, "😀重庆"),
  ).toThrow("Reader pronunciation range is invalid");
 });

 it("rejects a reading list that cannot align one reading to each selected grapheme", () => {
  expect(() =>
   validateReaderPronunciationOverride({ ...baseInput, readings: ["chong2"] }, "😀重庆"),
  ).toThrow("Reader pronunciation readings must match the selected text");
 });
});
