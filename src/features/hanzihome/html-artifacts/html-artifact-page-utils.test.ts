import { describe, expect, it } from "vitest";

import type { HtmlArtifactFolder } from "./html-artifact.schema";
import {
 buildFolderTree,
 getArtifactFormSaveKey,
 hasFolderDescendant,
 parseTags,
 toArtifactFormState,
} from "./html-artifact-page-utils";

function folder(id: string, parentFolderId: string | null): HtmlArtifactFolder {
 return {
  id,
  ownerId: "user-1",
  parentFolderId,
  name: id,
  color: "blue",
  position: 0,
  createdAt: "2026-07-14T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
 };
}

describe("HTML artifact page utilities", () => {
 it("normalizes and deduplicates tags without reordering them", () => {
  expect(parseTags(" grammar, hsk, grammar, , review ")).toEqual(["grammar", "hsk", "review"]);
 });

 it("uses normalized fields for dirty-state comparison", () => {
  const first = getArtifactFormSaveKey({
   title: " Lesson ",
   folderId: null,
   artifactType: "practice_page",
   tagsInput: "grammar, review",
   html: " <main /> ",
  });
  const second = getArtifactFormSaveKey({
   title: "Lesson",
   folderId: null,
   artifactType: "practice_page",
   tagsInput: " grammar, review, grammar ",
   html: "<main />",
  });

  expect(first).toBe(second);
 });

 it("creates a valid default form in the selected folder", () => {
  expect(toArtifactFormState(null, "folder-1")).toMatchObject({
   title: "Tệp HTML mới",
   folderId: "folder-1",
  });
 });

 it("builds nested folders and detects descendants", () => {
  const folders = [folder("root", null), folder("child", "root"), folder("leaf", "child")];

  expect(buildFolderTree(folders)[0]?.children[0]?.children[0]?.id).toBe("leaf");
  expect(hasFolderDescendant(folders, "root", "leaf")).toBe(true);
  expect(hasFolderDescendant(folders, "leaf", "root")).toBe(false);
 });
});
