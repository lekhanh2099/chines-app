import { afterEach, describe, expect, it } from "vitest";

import { readingFocusStore, selectReadingFocusActive } from "./reading-focus-store";

const { setEnabled, claim, release } = readingFocusStore.actions;

afterEach(() => {
 setEnabled(false);
 release(readingFocusStore.get().ownerId);
});

describe("readingFocusStore", () => {
 it("keeps the choice when the next lesson workspace replaces the current one", () => {
  claim("lesson-1");
  setEnabled(true);

  release("lesson-1");
  expect(selectReadingFocusActive(readingFocusStore.get())).toBe(false);

  claim("lesson-2");
  expect(selectReadingFocusActive(readingFocusStore.get())).toBe(true);
 });

 it("ignores the cleanup of a workspace that was already replaced", () => {
  setEnabled(true);
  claim("lesson-1");
  claim("lesson-2");

  release("lesson-1");

  expect(selectReadingFocusActive(readingFocusStore.get())).toBe(true);
 });
});
