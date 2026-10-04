import { expect, it } from "vitest";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";
import { readerDocumentRowSchema } from "../model/reading-resource.schemas";
import type { ReaderDocumentRow } from "../model/reading-resource.schemas";
import {
 groupReaderCollectionDocuments,
 metadataNumber,
 reinforcementPdfAssetId,
} from "./reader-collection-utils";

const base = readerDocumentRowSchema.array().parse(studioSeed.reader.documents)[0];
if (!base) throw new Error("Missing Reader corpus");
function document(
 id: string,
 unit: ReaderDocumentRow["unit_id"],
 number: ReaderDocumentRow["reading_number"],
): ReaderDocumentRow {
 return { ...base, id, unit_id: unit, reading_number: number };
}
it("orders units naturally, keeps unassigned documents last and sorts without mutating input", () => {
 const documents = [
  document("ten", "U10", 1),
  document("other", null, 1),
  document("later", "U2", 2),
  document("first", "U2", 1),
 ];
 const groups = groupReaderCollectionDocuments(
  "core",
  documents,
  [],
  "Other",
  (id, title) => `${id}: ${title}`,
 );
 expect(groups.map((group) => group.id)).toEqual(["U2", "U10", "other"]);
 expect(groups[0]?.documents.map((item) => item.id)).toEqual(["first", "later"]);
 expect(groups[2]?.title).toBe("Other");
 expect(documents.map((item) => item.id)).toEqual(["ten", "other", "later", "first"]);
});
it("uses core unit metadata and source order for reinforcement documents", () => {
 const later = {
  ...document("later", "U2", 1),
  source_metadata: { source_id: "reinforcement-02" },
 };
 const earlier = {
  ...document("earlier", "U2", 2),
  source_metadata: { source_id: "reinforcement-01" },
 };
 const reference: ReaderDocumentRow = {
  ...document("reference", "U2", 1),
  kind: "core",
  source_metadata: { unit_title_zh: "你好", unit_title_vi: "Chào", unit_focus_vi: "Greeting" },
 };
 const groups = groupReaderCollectionDocuments(
  "reinforcement",
  [later, earlier],
  [reference],
  "Other",
  (id, title) => `${id}: ${title}`,
 );
 expect(groups[0]).toMatchObject({ title: "2: 你好", subtitle: "Chào", description: "Greeting" });
 expect(groups[0]?.documents.map((item) => item.id)).toEqual(["earlier", "later"]);
});
it("resolves nested metadata counts and requires the exact resource/page PDF pair", () => {
 const source: ReaderDocumentRow = {
  ...base,
  source_metadata: { resource_file: "book.pdf", counts: { pdf_page: 21 }, estimated_minutes: 3 },
 };
 expect(metadataNumber(source, "estimated_minutes")).toBe(3);
 expect(metadataNumber(source, "pdf_page")).toBe(21);
 expect(
  metadataNumber({ ...source, source_metadata: { counts: "invalid" } }, "pdf_page"),
 ).toBeNull();
 const asset = {
  id: "asset",
  title: "Page",
  resourceFile: "book.pdf",
  pdfPage: 21,
  printedPage: 19,
  imageSrc: "/page.jpg",
 };
 expect(reinforcementPdfAssetId(source, [asset])).toBe("asset");
 expect(reinforcementPdfAssetId(source, [{ ...asset, pdfPage: 22 }])).toBeNull();
});
