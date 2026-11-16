import { describe, expect, it } from "vitest";

import { userLearningStateSchema } from "./learning-state.schema";

describe("learning-state library order preferences", () => {
 it("keeps legacy state valid without adding saved library orders", () => {
  const parsed = userLearningStateSchema.parse({});

  expect(parsed.settings).toEqual({});
  expect(parsed.settings.libraryCollectionOrder).toBeUndefined();
  expect(parsed.settings.libraryResumeOrder).toBeUndefined();
 });

 it("preserves independent collection and resume sequences through parsing and serialization", () => {
  const parsed = userLearningStateSchema.parse({
   settings: {
    libraryCollectionOrder: ["static:khau-ngu", "group:hanyu", "static:nhip-cau"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu"],
   },
  });

  expect(parsed.settings.libraryCollectionOrder).toEqual([
   "static:khau-ngu",
   "group:hanyu",
   "static:nhip-cau",
  ]);
  expect(parsed.settings.libraryResumeOrder).toEqual(["catalog:book-a", "static:khau-ngu"]);
  expect(JSON.stringify(parsed.settings)).toBe(
   '{"libraryCollectionOrder":["static:khau-ngu","group:hanyu","static:nhip-cau"],"libraryResumeOrder":["catalog:book-a","static:khau-ngu"]}',
  );
 });

 it("preserves an explicit empty order while rejecting invalid collection identifiers", () => {
  expect(
   userLearningStateSchema.parse({ settings: { libraryCollectionOrder: [] } }).settings
    .libraryCollectionOrder,
  ).toEqual([]);
  expect(
   userLearningStateSchema.safeParse({ settings: { libraryCollectionOrder: [""] } }).success,
  ).toBe(false);
  expect(
   userLearningStateSchema.safeParse({ settings: { libraryCollectionOrder: "group:hanyu" } })
    .success,
  ).toBe(false);
 });

 it("preserves an empty resume order while rejecting invalid resume identifiers", () => {
  expect(
   userLearningStateSchema.parse({ settings: { libraryResumeOrder: [] } }).settings
    .libraryResumeOrder,
  ).toEqual([]);
  expect(
   userLearningStateSchema.safeParse({ settings: { libraryResumeOrder: [""] } }).success,
  ).toBe(false);
  expect(
   userLearningStateSchema.safeParse({ settings: { libraryResumeOrder: "catalog:book-a" } })
    .success,
  ).toBe(false);
 });
});

function learningStateWithFont(hanziFont: string) {
 return {
  settings: {
   lessonTextDisplayMode: {
    showPinyin: true,
    autoDetectPinyin: false,
    showMeaning: false,
    showAnswers: false,
    hanziFont,
    hanziSize: "lg",
    revealMode: "always",
   },
  },
  progress: {},
  bookmarks: {},
  reviewHistory: [],
 };
}

describe("learning-state reader font compatibility", () => {
 it("preserves the practice module in persisted navigation", () => {
  const parsed = userLearningStateSchema.parse({
   ...learningStateWithFont("system"),
   settings: {
    ...learningStateWithFont("system").settings,
    lastModule: "practice",
   },
  });

  expect(parsed.settings.lastModule).toBe("practice");
 });

 it("defaults legacy pinyin settings to the curated source", () => {
  const parsed = userLearningStateSchema.parse({
   settings: {
    lessonTextDisplayMode: {
     showPinyin: true,
     showMeaning: false,
     showAnswers: false,
     hanziFont: "system",
     hanziSize: "lg",
     revealMode: "always",
    },
   },
   progress: {},
   bookmarks: {},
   reviewHistory: [],
  });

  expect(parsed.settings.lessonTextDisplayMode?.autoDetectPinyin).toBe(false);
 });

 it.each(["kai", "mengshen"])("migrates legacy %s to system", (hanziFont) => {
  const parsed = userLearningStateSchema.parse(learningStateWithFont(hanziFont));

  expect(parsed.settings.lessonTextDisplayMode?.hanziFont).toBe("system");
 });

 it.each(["system", "songti", "noto-sans", "pinyin", "kaiti", "fangsong", "ma-shan", "xiaowei"])(
  "preserves supported %s",
  (hanziFont) => {
   const parsed = userLearningStateSchema.parse(learningStateWithFont(hanziFont));

   expect(parsed.settings.lessonTextDisplayMode?.hanziFont).toBe(hanziFont);
  },
 );
});

describe("learning-state review history compatibility", () => {
 it("preserves an activity label when a new review event provides one", () => {
  const parsed = userLearningStateSchema.parse({
   settings: {},
   progress: {},
   bookmarks: {},
   reviewHistory: [
    {
     type: "vocab",
     id: "lesson-1__word-1",
     label: "坚持",
     result: "known",
     answeredAt: "2026-08-17T01:00:00.000Z",
    },
   ],
  });

  expect(parsed.reviewHistory[0]?.label).toBe("坚持");
 });

 it("keeps legacy review events valid when they have no label", () => {
  const parsed = userLearningStateSchema.parse({
   settings: {},
   progress: {},
   bookmarks: {},
   reviewHistory: [
    {
     type: "grammar",
     id: "lesson-1__grammar-1",
     result: "hard",
     answeredAt: "2026-08-17T01:00:00.000Z",
    },
   ],
  });

  expect(parsed.reviewHistory[0]?.label).toBeUndefined();
 });
});

describe("learning-state book study recency", () => {
 it("keeps legacy state without study times valid", () => {
  const parsed = userLearningStateSchema.parse({
   settings: {
    bookResume: { "static:nhip-cau": { lessonId: "nhip-cau-lesson-02", module: "text" } },
   },
  });
  expect(parsed.settings.bookLastStudiedAt).toBeUndefined();
  expect(parsed.settings).not.toHaveProperty("bookLastStudiedAt");
 });

 it("round-trips per-book study times keyed like bookResume", () => {
  const settings = {
   bookLastStudiedAt: {
    "catalog:book-a": "2026-11-12T08:00:00.000Z",
    "static:khau-ngu": "2026-11-13T08:00:00.000Z",
   },
  };
  const parsed = userLearningStateSchema.parse({ settings });
  expect(parsed.settings.bookLastStudiedAt).toEqual(settings.bookLastStudiedAt);
  expect(userLearningStateSchema.parse(JSON.parse(JSON.stringify(parsed))).settings).toEqual(
   settings,
  );
 });

 it("rejects study times that are not ISO timestamps and empty book keys", () => {
  expect(
   userLearningStateSchema.safeParse({
    settings: { bookLastStudiedAt: { "static:khau-ngu": "yesterday" } },
   }).success,
  ).toBe(false);
  expect(
   userLearningStateSchema.safeParse({
    settings: { bookLastStudiedAt: { "": "2026-11-13T08:00:00.000Z" } },
   }).success,
  ).toBe(false);
 });
});

describe("learning-state dialogue voices", () => {
 it("persists the saved A/B dialogue voices and keeps legacy state without them", () => {
  const voices = { a: "zh-CN-XiaoyiNeural", b: "zh-CN-YunjianNeural" };

  expect(
   userLearningStateSchema.parse({ settings: { dialogueVoices: voices } }).settings,
  ).toMatchObject({ dialogueVoices: voices });
  expect(userLearningStateSchema.parse({ settings: {} }).settings.dialogueVoices).toBeUndefined();
  expect(
   userLearningStateSchema.safeParse({ settings: { dialogueVoices: { a: "", b: "x" } } }).success,
  ).toBe(false);
 });
});
