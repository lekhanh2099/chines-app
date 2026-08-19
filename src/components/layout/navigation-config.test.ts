import { describe, expect, it } from "vitest";

import { navigationGroups, navigationItems } from "./navigation-config";

describe("navigation configuration", () => {
 it("groups every primary destination exactly once", () => {
  const groupedItemIds = navigationGroups.flatMap((group) =>
   group.sections.flatMap((section) => section.itemIds),
  );
  const primaryItemIds = Object.keys(navigationItems).filter((itemId) => itemId !== "settings");

  expect(new Set(groupedItemIds).size).toBe(groupedItemIds.length);
  expect(groupedItemIds.toSorted()).toEqual(primaryItemIds.toSorted());
 });

 it("keeps the approved top-level information architecture", () => {
  expect(navigationGroups.map((group) => group.id)).toEqual([
   "learning",
   "reading",
   "hsk",
   "practice",
   "knowledge",
   "system",
  ]);
  expect(navigationGroups.every((group) => group.sections.every((section) => section.itemIds.length > 0))).toBe(
   true,
  );
 });

 it("uses canonical Reader and HSK destinations while retaining legacy active aliases", () => {
  expect(navigationItems.reader.href).toBe("/reader");
  expect(navigationItems.readerCourse.href).toBe("/reader/course");
  expect(navigationItems.readerPractice.href).toBe("/reader/practice");
  expect(navigationItems.readerMock.href).toBe("/reader/mock");
  expect(navigationItems.hskReading.href).toBe("/hsk");
  expect(navigationItems.hskReading.aliases).toContain("/reader/hsk");
  expect(navigationItems.hskReading.aliases).toContain("/reader?collection=hsk");
 });
});
