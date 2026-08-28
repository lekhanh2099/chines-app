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
   "practice",
   "knowledge",
   "personal",
  ]);
  expect(
   navigationGroups.every((group) => group.sections.every((section) => section.itemIds.length > 0)),
  ).toBe(true);
 });

 it("places HTML files with the primary learning destinations", () => {
  expect(navigationGroups[0]?.sections[2]?.itemIds).toEqual(["humanities", "htmlArtifacts"]);
  expect(navigationGroups[3]?.sections.flatMap((section) => section.itemIds)).not.toContain(
   "htmlArtifacts",
  );
 });

 it("keeps high-priority notes with the primary learning destinations", () => {
  expect(navigationGroups[0]?.sections[0]?.itemIds).toEqual([
   "home",
   "lessons",
   "dailyReading",
   "reader",
   "notes",
  ]);
 });

 it("keeps reading and HSK destinations inside the learning journey", () => {
  expect(navigationGroups[0]?.sections[0]?.itemIds).toContain("reader");
  expect(navigationGroups[0]?.sections[0]?.itemIds).toContain("dailyReading");
  expect(navigationGroups[0]?.sections[1]?.itemIds).toEqual(["hskReading", "hskGrammar"]);
 });

 it("keeps personal destinations together without a separate system group", () => {
  expect(navigationGroups[3]?.sections[0]?.itemIds).toEqual(["personalLearning", "notebook"]);
  expect(navigationGroups[3]?.sections).toHaveLength(1);
  expect(navigationGroups.some((group) => group.id === "system")).toBe(false);
 });

 it("keeps Settings-owned destinations out of global navigation", () => {
  expect(Object.hasOwn(navigationItems, "dataQuality")).toBe(false);
  expect(Object.hasOwn(navigationItems, "apiDocs")).toBe(false);
  expect(Object.hasOwn(navigationItems, "tts")).toBe(false);
  expect(navigationGroups[1]?.sections[0]?.itemIds).toEqual([
   "dictation",
   "conversation",
   "translationStudio",
  ]);
  expect(navigationItems.settings.aliases).toEqual(["/tts", "/data-quality", "/api-docs"]);
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

  expect(visibleItemIds).not.toContain("htmlArtifacts");
 });

 it("keeps engineering destinations available to content editors", () => {
  const visibleItemIds = filterNavigationGroupsForContentCapability(true).flatMap((group) =>
   group.sections.flatMap((section) => section.itemIds),
  );

  expect(visibleItemIds).toContain("htmlArtifacts");
 });
});
