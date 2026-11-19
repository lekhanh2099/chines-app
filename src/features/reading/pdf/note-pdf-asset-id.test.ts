import { describe, expect, it } from "vitest";

import { NOTE_PDF_ASSET_ID_PATTERN, notePdfAssetId } from "./note-pdf-asset-id";

describe("note PDF ink asset ids", () => {
 it("round-trips the attachment id", () => {
  const attachmentId = "0f8fad5b-d9cb-469f-a165-70867728950e";
  expect(NOTE_PDF_ASSET_ID_PATTERN.exec(notePdfAssetId(attachmentId))?.[1]).toBe(attachmentId);
 });
 it("does not claim Reader assets or malformed ids", () => {
  for (const assetId of [
   "hanzihome-studio-asset:public/resources/hanyu-series-reading-book-1.pdf",
   "note-pdf:not-a-uuid",
   "note-pdf:0f8fad5b-d9cb-469f-a165-70867728950e/../x",
  ]) {
   expect(NOTE_PDF_ASSET_ID_PATTERN.test(assetId)).toBe(false);
  }
 });
});
