import { describe, expect, it } from "vitest";
import type { ReaderPdfAsset } from "../model/reading-assets.schemas";
import { importedPdfAssetId, pdfAssetIdForDocument, pdfHref } from "./pdf-viewer-utils";

const asset: ReaderPdfAsset = {
 id: "book-1-page-21",
 title: "Quyển 1 · trang 21",
 resourceFile: "book-1.pdf",
 pdfPage: 21,
 printedPage: 11,
 imageSrc: "/resources/pages/book-1-page-21.webp",
};

describe("PDF asset identity and navigation", () => {
 it("matches both resource file and PDF page, preserving asset order", () => {
  const assets = [asset, { ...asset, id: "book-2-page-21", resourceFile: "book-2.pdf" }];
  expect(pdfAssetIdForDocument("book-1.pdf", 21, assets)).toBe("book-1-page-21");
  expect(pdfAssetIdForDocument("book-2.pdf", 21, assets)).toBe("book-2-page-21");
  expect(pdfAssetIdForDocument("book-1.pdf", 11, assets)).toBeNull();
  expect(pdfAssetIdForDocument("book-1.pdf", 21, [])).toBeNull();
  expect(assets[0]).toBe(asset);
 });

 it("uses the PDF page in the link and the canonical resource identity for persistence", () => {
  expect(pdfHref(asset)).toBe("/resources/book-1.pdf#page=21");
  expect(importedPdfAssetId(asset)).toBe("hanzihome-studio-asset:public/resources/book-1.pdf");
 });
});
