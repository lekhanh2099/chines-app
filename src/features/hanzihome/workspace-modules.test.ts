import { describe, expect, it } from "vitest";

import { parseHanziHomeModule, resolveLessonModule } from "./workspace-modules";

describe("HanziHome workspace module routing", () => {
 it("rejects unknown URL module values", () => {
  expect(parseHanziHomeModule("unknown")).toBeNull();
  expect(parseHanziHomeModule("grammar")).toBe("grammar");
  expect(parseHanziHomeModule("practice")).toBe("practice");
 });

 it("keeps standard lessons out of listening-only modules", () => {
  expect(resolveLessonModule({ requestedModule: "dictation", isListeningLesson: false })).toBe(
   "overview",
  );
 });

 it("defaults listening lessons to their listening workspace", () => {
  expect(resolveLessonModule({ requestedModule: "grammar", isListeningLesson: true })).toBe(
   "listening",
  );
 });
});
