import { beforeEach, describe, expect, it, vi } from "vitest";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";
import { readerResourceToDocument } from "../adapters/reading-resource.adapter";
import { cookReaderData } from "@/features/reader/model/cook-reader-data";

vi.mock("server-only", () => ({}));

import {
 getReaderDocument,
 getStaticReaderDataQualityReport,
 listReaderDocuments,
 listReaderPdfAssets,
} from "@/features/reading/repositories/reading-content.repository";

describe("static Reader content repository", () => {
 beforeEach(() => {
  vi.restoreAllMocks();
 });

 it("loads the reviewed Studio catalog without Supabase", async () => {
  const documents = await listReaderDocuments();

  expect(documents).toHaveLength(170);
  expect(documents.filter((document) => document.kind === "core")).toHaveLength(12);
  expect(documents.filter((document) => document.kind === "hsk")).toHaveLength(50);
 });

 it("loads one static collection at a time for the Reader library", async () => {
  expect(await listReaderDocuments("core")).toHaveLength(12);
  expect(await listReaderDocuments("hsk")).toHaveLength(50);
  expect(await listReaderDocuments("daily")).toHaveLength(1);
 });

 it("preserves Studio source order when a collection has no reading number", async () => {
  const mockSlugs = (await listReaderDocuments("mock")).map((document) => document.slug);

  expect(mockSlugs.slice(0, 4)).toEqual([
   "thi-thu-vi-sao-pho-co-ngay-cang-duoc-yeu-thich",
   "thi-thu-mot-toa-tho-lau-biet-tho",
   "thi-thu-cho-sang-truyen-thong-trong-thanh-pho",
   "thi-thu-tui-thom-trong-tet-doan-ngo",
  ]);
 });

 it("preserves reinforcement PDF order and metadata", async () => {
  const documents = await listReaderDocuments("reinforcement");

  expect(documents).toHaveLength(24);
  expect(documents.slice(0, 8).map((document) => document.slug)).toEqual([
   "luyen-tet-nguyen-dan",
   "luyen-nguoi-tho-may-suon-xam",
   "luyen-mon-an-trung-quoc",
   "luyen-dai-vien-son-tay",
   "luyen-huong-dan-vien-tay-tang",
   "luyen-ghi-chep-chuyen-an-uong-o-quang-chau",
   "luyen-tra-thiet-quan-am",
   "luyen-truyen-thuyet-an-sui-cao-ngay-dong-chi",
  ]);
  expect(documents[0]?.source_metadata).toMatchObject({
   pdf_page: 21,
   printed_page: 11,
   resource_file: "hanyu-series-reading-book-1.pdf",
  });
 });

 it("resolves the checked-in PDF assets without a content API", async () => {
  const assets = await listReaderPdfAssets();

  expect(assets).toHaveLength(24);
  expect(assets[0]).toMatchObject({
   id: "book-1-21",
   resourceFile: "hanyu-series-reading-book-1.pdf",
   pdfPage: 21,
   printedPage: 11,
   imageSrc: "/resources/pages/hanyu-series-reading-book-1-page-21.webp",
  });
  expect(assets.at(-1)?.id).toBe("book-2-254");
 });

 it("loads a document and resolves its static vocabulary and exercises", async () => {
  const resource = await getReaderDocument("hanzihome-studio-reading:U3-R1");

  expect(resource?.document.title_zh).toBe("绍兴自古是水乡");
  expect(resource?.paragraphs.length).toBeGreaterThan(0);
  expect(resource?.vocabulary.length).toBeGreaterThan(0);
  expect(resource?.exerciseItems.length).toBeGreaterThan(0);
 });

 it("resolves every published static document without a document-load fallback", async () => {
  const documents = await listReaderDocuments();
  let exerciseCount = 0;

  for (const document of documents) {
   const resource = await getReaderDocument(document.id);

   expect(resource?.document.id).toBe(document.id);
   expect(resource?.paragraphs.every((paragraph) => paragraph.document_id === document.id)).toBe(
    true,
   );
   expect(resource?.vocabularyLinks.every((link) => link.document_id === document.id)).toBe(true);
   expect(resource?.exerciseGroups.every((group) => group.document_id === document.id)).toBe(true);
   if (resource === null) throw new Error(`Missing published resource: ${document.id}`);
   const model = readerResourceToDocument(resource);
   const content = cookReaderData(model);
   expect(content.id).toBe(document.id);
   expect(content.segmentIds).toEqual(resource.paragraphs.map((paragraph) => paragraph.id));
   for (const paragraph of resource.paragraphs) {
    expect(content.segmentsById[paragraph.id]).toMatchObject({
     id: paragraph.id,
     zh: paragraph.zh,
     speechText: paragraph.zh,
    });
   }
   for (const item of resource.exerciseItems) {
    expect(item).toEqual(studioSeed.reader.exerciseItems.find((source) => source.id === item.id));
    exerciseCount += 1;
   }
  }
  expect(exerciseCount).toBe(studioSeed.reader.exerciseItems.length);
 });

 it("audits the bundled Reader graph without querying Supabase", async () => {
  const report = await getStaticReaderDataQualityReport();

  expect(report).toMatchObject({
   documents: 170,
   paragraphs: 365,
   vocabularyLinks: 354,
   exerciseGroups: 141,
   exerciseItems: 756,
   assets: 26,
   orphanParagraphs: 0,
   orphanVocabularyLinks: 0,
   orphanExerciseGroups: 0,
   orphanExerciseItems: 0,
   orphanAssets: 0,
   issues: ["11 canonical vocab thiếu pinyin trong static source."],
  });
 });
});
