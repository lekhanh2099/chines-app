import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readerDocumentSchema } from "@/features/reader/model/reader.schemas";

import {
 getSpeakingDrillSelection,
 getSpeakingDrillsCatalog,
} from "./speaking-drills-content.server";
import { buildSpeakingDrillReaderDocument } from "./speaking-drills-reader.adapter";
import { adjacentSpeakingDrillTopics, buildDoubaoPracticeText } from "./speaking-drills-utils";

describe("Doubao speaking drills content", () => {
 it("lists both imported books with every scenario", () => {
  const catalog = getSpeakingDrillsCatalog();

  expect(catalog.map((book) => book.id)).toEqual(["giao-trinh", "trung-cap"]);
  expect(catalog.map((book) => book.lessons.flatMap((lesson) => lesson.topics).length)).toEqual([
   13, 24,
  ]);
 });

 it("resolves a requested scenario with its lesson materials", () => {
  const selection = getSpeakingDrillSelection("b2-c1");

  expect(selection.bookId).toBe("trung-cap");
  expect(selection.lesson).toMatchObject({ id: "b2", no: 2, title: "健康第一" });
  expect(selection.lesson.vocab.length).toBeGreaterThan(0);
  expect(selection.topic.v1Lines).toHaveLength(selection.topic.v2Lines.length);
  expect(selection.topic.changes.length).toBeGreaterThan(0);
 });

 it("falls back to the first scenario for an unknown id", () => {
  expect(getSpeakingDrillSelection("missing").topic.id).toBe("gt-b3-c1");
 });

 it("pages through scenarios within one book only", () => {
  const [firstBook, secondBook] = getSpeakingDrillsCatalog();
  const lastTopic = firstBook.lessons.at(-1)?.topics.at(-1)?.id ?? "";

  expect(adjacentSpeakingDrillTopics(firstBook, "gt-b3-c1").previous).toEqual([]);
  expect(adjacentSpeakingDrillTopics(firstBook, "gt-b3-c1").next[0]?.id).toBe("gt-b3-c2");
  expect(adjacentSpeakingDrillTopics(firstBook, lastTopic).next).toEqual([]);
  expect(adjacentSpeakingDrillTopics(secondBook, "b2-c2").previous[0]?.id).toBe("b2-c1");
 });

 it("maps the chosen version onto valid Reader dialogue turns", () => {
  const selection = getSpeakingDrillSelection("b2-c1");
  const v1 = buildSpeakingDrillReaderDocument(selection, "v1");
  const v2 = buildSpeakingDrillReaderDocument(selection, "v2");

  expect(readerDocumentSchema.safeParse(v1).success).toBe(true);
  expect(v1.segments.map((segment) => segment.zh)).toEqual(
   selection.topic.v1Lines.map((line) => line.zh),
  );
  expect(v2.segments[1]).toMatchObject({
   kind: "dialogue-turn",
   zh: selection.topic.v2Lines[1]?.zh,
   speaker: { label: "B" },
  });
  expect(v2.segments.map((segment) => segment.speaker?.id)).toEqual(
   selection.topic.v2Lines.map((line) => line.role),
  );
 });

 it("builds the Doubao payload from the shared prompt and the chosen version", () => {
  const selection = getSpeakingDrillSelection("b2-c1");
  const text = buildDoubaoPracticeText(selection, selection.topic.v1Lines);

  expect(text.startsWith(selection.generalPrompt)).toBe(true);
  expect(text).toContain(`【第2课 · 情景1】${selection.topic.question}\n开始对话\n[01] A ｜`);
  expect(text).toContain(`[02] B ｜${selection.topic.v1Lines[1]?.zh}`);
  expect(text.endsWith("\n结束对话")).toBe(true);
 });
});
