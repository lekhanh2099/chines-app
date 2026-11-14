import { describe, expect, it } from "vitest";

import type { ArtifactFormState } from "./html-artifact-page-utils";
import type { HtmlArtifact, HtmlArtifactFolder, HtmlArtifactSummary } from "./html-artifact.schema";
import {
 buildHtmlArtifactPreview,
 filterHtmlArtifactSummaries,
 getConcreteFolderId,
 reorderHtmlArtifactFolderSiblings,
} from "./html-artifacts-page-model";

const timestamp = "2026-07-14T00:00:00.000Z";

function summary(
 id: string,
 folderId: HtmlArtifactSummary["folderId"],
 title: string,
 tags: string[] = [],
): HtmlArtifactSummary {
 return {
  id,
  ownerId: "user-1",
  folderId,
  title,
  artifactType: "practice_page",
  tags,
  createdAt: timestamp,
  updatedAt: timestamp,
 };
}

function folder(
 id: string,
 parentFolderId: HtmlArtifactFolder["parentFolderId"],
 position: number,
): HtmlArtifactFolder {
 return {
  id,
  ownerId: "user-1",
  parentFolderId,
  name: id,
  color: "blue",
  position,
  createdAt: timestamp,
  updatedAt: timestamp,
 };
}

describe("HTML artifacts page model", () => {
 it("treats only real folder ids as concrete folders", () => {
  expect(getConcreteFolderId("all")).toBeNull();
  expect(getConcreteFolderId("unfiled")).toBeNull();
  expect(getConcreteFolderId("folder-1")).toBe("folder-1");
 });

 it("filters summaries by folder and search text", () => {
  const artifacts = [
   summary("a", null, "Bài một"),
   summary("b", "folder-1", "Grammar drill", ["hsk"]),
   summary("c", "folder-2", "Mock exam"),
  ];

  expect(filterHtmlArtifactSummaries(artifacts, "all", "").map((item) => item.id)).toEqual([
   "a",
   "b",
   "c",
  ]);
  expect(filterHtmlArtifactSummaries(artifacts, "unfiled", "").map((item) => item.id)).toEqual([
   "a",
  ]);
  expect(filterHtmlArtifactSummaries(artifacts, "folder-1", "").map((item) => item.id)).toEqual([
   "b",
  ]);
  expect(filterHtmlArtifactSummaries(artifacts, "all", " HSK ").map((item) => item.id)).toEqual([
   "b",
  ]);
  expect(
   filterHtmlArtifactSummaries(artifacts, "all", "practice_page").map((item) => item.id),
  ).toEqual(["a", "b", "c"]);
 });

 it("builds a draft preview over the selected artifact", () => {
  const selected: HtmlArtifact = { ...summary("a", null, "Old"), html: "<p>old</p>" };
  const form: ArtifactFormState = {
   title: "New",
   folderId: "folder-1",
   artifactType: "reference",
   html: "<p>new</p>",
   tagsInput: "x, y, x",
  };

  expect(buildHtmlArtifactPreview(selected, null)).toBe(selected);
  expect(buildHtmlArtifactPreview(selected, form)).toEqual({
   ...selected,
   folderId: "folder-1",
   title: "New",
   artifactType: "reference",
   tags: ["x", "y"],
   html: "<p>new</p>",
  });
  expect(buildHtmlArtifactPreview(null, { ...form, html: "   " })).toBeNull();
  expect(buildHtmlArtifactPreview(null, form)).toMatchObject({
   id: "draft-preview",
   ownerId: "draft",
  });
 });

 it("reorders folder siblings and rejects out-of-range moves", () => {
  const folders = [folder("b", null, 2), folder("a", null, 1), folder("child", "a", 1)];

  expect(
   reorderHtmlArtifactFolderSiblings(folders, folders[0], "up")?.map((item) => item.id),
  ).toEqual(["b", "a"]);
  expect(reorderHtmlArtifactFolderSiblings(folders, folders[0], "down")).toBeNull();
  expect(reorderHtmlArtifactFolderSiblings(folders, folders[2], "up")).toBeNull();
 });
});
