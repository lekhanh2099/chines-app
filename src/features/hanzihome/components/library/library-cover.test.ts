import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTextbookCatalog } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { HanziHomeMutationError } from "@/features/hanzihome/editing/mutation-error";
import { LibraryCourseGroupKeySchema } from "./library-course-groups";
import { getLibraryCovers, resetLibraryCover, saveLibraryCover } from "./library-cover-api";
import {
 libraryCollectionIdSchema,
 resetLibraryCoverPayloadSchema,
 saveLibraryCoverPayloadSchema,
 type LibraryCover,
} from "./library-cover.schema";

const timestamp = "2026-10-20T09:00:00.000Z";
const cover: LibraryCover = {
 collectionId: "group:hanyu",
 coverUrl: "https://images.example.test/cover.png",
 createdAt: timestamp,
 updatedAt: timestamp,
};
const request = vi.fn<typeof fetch>();

beforeEach(() => {
 request.mockReset();
 vi.stubGlobal("fetch", request);
});
afterEach(() => vi.unstubAllGlobals());

describe("shared library cover contract", () => {
 it("accepts the actual family and static collection identities only", () => {
  for (const key of LibraryCourseGroupKeySchema.options)
   expect(libraryCollectionIdSchema.safeParse(`group:${key}`).success).toBe(true);
  for (const book of getTextbookCatalog())
   expect(libraryCollectionIdSchema.safeParse(`static:${book.id}`).success).toBe(true);
  for (const id of ["course-a", "group:missing", "static:tm3", "static:removed-book"])
   expect(libraryCollectionIdSchema.safeParse(id).success).toBe(false);
 });

 it("allows observed absence for creation and requires a revision for reset", () => {
  expect(saveLibraryCoverPayloadSchema.parse({ coverUrl: cover.coverUrl }).expectedUpdatedAt).toBe(
   undefined,
  );
  expect(resetLibraryCoverPayloadSchema.safeParse({}).success).toBe(false);
  expect(
   saveLibraryCoverPayloadSchema.safeParse({
    coverUrl: cover.coverUrl,
    ownerId: "forged-owner",
   }).success,
  ).toBe(false);
 });

 it.each(["javascript:alert(1)", "data:image/png;base64,abc", "file:///cover.png", "/cover.png"])(
  "rejects unsupported cover URL %s before sending a request",
  async (coverUrl) => {
   await expect(
    saveLibraryCover({ collectionId: cover.collectionId, input: { coverUrl } }),
   ).rejects.toThrow();
   expect(request).not.toHaveBeenCalled();
  },
 );

 it("reads missing overrides as an empty list", async () => {
  request.mockResolvedValue(Response.json({ items: [] }));
  await expect(getLibraryCovers()).resolves.toEqual([]);
  expect(request).toHaveBeenCalledWith("/api/hanzihome/library-covers", {
   headers: { Accept: "application/json" },
  });
 });

 it("sends only the cover and observed revision and accepts the acknowledged identity", async () => {
  request.mockResolvedValue(Response.json({ item: cover }));
  await expect(
   saveLibraryCover({
    collectionId: cover.collectionId,
    input: { coverUrl: ` ${cover.coverUrl} `, expectedUpdatedAt: timestamp },
   }),
  ).resolves.toEqual(cover);
  expect(request).toHaveBeenCalledWith("/api/hanzihome/library-covers/group%3Ahanyu", {
   method: "PUT",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({
    coverUrl: cover.coverUrl,
    expectedUpdatedAt: timestamp,
    reason: "Update HanziHome library cover",
   }),
  });
 });

 it("resets only the named override with its observed revision", async () => {
  request.mockResolvedValue(Response.json({ collectionId: cover.collectionId, reset: true }));
  await resetLibraryCover({
   collectionId: cover.collectionId,
   input: { expectedUpdatedAt: timestamp },
  });
  expect(request).toHaveBeenCalledWith("/api/hanzihome/library-covers/group%3Ahanyu", {
   method: "DELETE",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({ expectedUpdatedAt: timestamp, reason: "Reset HanziHome library cover" }),
  });
 });

 it("rejects acknowledgements for a different collection", async () => {
  request.mockResolvedValue(Response.json({ item: { ...cover, collectionId: "group:other" } }));
  await expect(
   saveLibraryCover({ collectionId: cover.collectionId, input: { coverUrl: cover.coverUrl } }),
  ).rejects.toThrow("Library cover acknowledgement identity does not match");
 });

 it("preserves the server conflict status for cache refresh and editor error handling", async () => {
  request.mockResolvedValue(
   Response.json(
    { error: "Library cover changed since it was loaded", details: "40001" },
    { status: 409 },
   ),
  );
  await expect(
   saveLibraryCover({
    collectionId: cover.collectionId,
    input: { coverUrl: cover.coverUrl, expectedUpdatedAt: timestamp },
   }),
  ).rejects.toEqual(
   new HanziHomeMutationError("Library cover changed since it was loaded", 409, "40001"),
  );
 });
});
