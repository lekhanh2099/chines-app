import { describe, expect, it } from "vitest";

import {
 filterNavigationGroupsForContentCapability,
 compatibilityNavigationItemIds,
 navigationGroups,
 navigationItems,
} from "./navigation-config";

describe("navigation configuration", () => {
 it("groups every primary destination exactly once", () => {
  const groupedItemIds = navigationGroups.flatMap((group) =>
   group.sections.flatMap((section) => section.itemIds),
  );
  const compatibilityItemIds = new Set<string>(compatibilityNavigationItemIds);
  const primaryItemIds = Object.keys(navigationItems).filter(
   (itemId) => itemId !== "settings" && !compatibilityItemIds.has(itemId),
  );

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
  expect(
   navigationGroups.every((group) => group.sections.every((section) => section.itemIds.length > 0)),
  ).toBe(true);
 });

 it("uses canonical Reader and HSK destinations while retaining the legacy HSK path", () => {
  expect(navigationItems.reader.href).toBe("/reader");
  expect(navigationItems.readerCourse.href).toBe("/reader/course");
  expect(navigationItems.readerPractice.href).toBe("/reader/practice");
  expect(navigationItems.readerMock.href).toBe("/reader/mock");
  expect(navigationItems.hskReading.href).toBe("/hsk");
  expect(navigationItems.hskReading.aliases).toContain("/reader/hsk");
  expect(navigationItems.hskGrammar.href).toBe("/hsk/grammar");
 });

 it("hides engineering destinations without the HanziHome content capability", () => {
  const visibleItemIds = filterNavigationGroupsForContentCapability(false).flatMap((group) =>
   group.sections.flatMap((section) => section.itemIds),
  );

  expect(visibleItemIds).not.toContain("dataQuality");
  expect(visibleItemIds).not.toContain("htmlArtifacts");
  expect(visibleItemIds).not.toContain("apiDocs");
 });

 it("keeps engineering destinations available to content editors", () => {
  const visibleItemIds = filterNavigationGroupsForContentCapability(true).flatMap((group) =>
   group.sections.flatMap((section) => section.itemIds),
  );

  expect(visibleItemIds).toContain("dataQuality");
  expect(visibleItemIds).toContain("htmlArtifacts");
  expect(visibleItemIds).toContain("apiDocs");
 });
});
