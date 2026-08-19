import "server-only";

import { z } from "zod";

import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";

import {
 parseReaderExerciseItemRow,
 readerAssetRowSchema,
 readerDocumentRowSchema,
 readerExerciseGroupRowSchema,
 readerExerciseItemRowSchema,
 readerParagraphRowSchema,
 readerVocabularyRowSchema,
 readerVocabularyLinkRowSchema,
 type ReaderDocumentRow,
 type ReaderAssetRow,
 type ReaderPdfAsset,
} from "./reader.schemas";

const staticVocabularyRowSchema = z.object({
 id: z.string().min(1),
 word: z.string().min(1),
 pinyin: z.string(),
 meaning: z.string(),
});

const staticReaderSeedSchema = z.object({
 sourceChecksum: z.string().regex(/^[0-9a-f]{64}$/u),
 canonical: z.object({ vocabItems: z.array(staticVocabularyRowSchema) }),
 reader: z.object({
  documents: z.array(readerDocumentRowSchema),
  paragraphs: z.array(readerParagraphRowSchema),
  vocabularyLinks: z.array(readerVocabularyLinkRowSchema),
  exerciseGroups: z.array(readerExerciseGroupRowSchema),
  exerciseItems: z.array(readerExerciseItemRowSchema),
  assets: z.array(readerAssetRowSchema),
 }),
});

const staticReaderSeed = staticReaderSeedSchema.parse(studioSeed);

function sourceOrder(document: ReaderDocumentRow) {
 const sourceId = document.source_metadata.source_id;
 if (typeof sourceId !== "string") return Number.MAX_SAFE_INTEGER;
 const match = /(?:mock|reinforcement)-0*(\d+)$/u.exec(sourceId);
 return match === null ? Number.MAX_SAFE_INTEGER : Number(match[1]);
}

function staticReaderDocuments(kind?: ReaderDocumentRow["kind"]) {
 return staticReaderSeed.reader.documents
  .filter((document) => document.publication_status === "published")
  .filter((document) => document.deleted_at === null)
  .filter((document) => kind === undefined || document.kind === kind)
  .sort((left, right) => {
   const kindOrder = left.kind.localeCompare(right.kind);
   if (kindOrder !== 0) return kindOrder;
   const unitOrder = (left.unit_id ?? "other").localeCompare(right.unit_id ?? "other", undefined, {
    numeric: true,
   });
   if (unitOrder !== 0) return unitOrder;
   const leftSourceOrder = sourceOrder(left);
   const rightSourceOrder = sourceOrder(right);
   if (
    leftSourceOrder !== Number.MAX_SAFE_INTEGER ||
    rightSourceOrder !== Number.MAX_SAFE_INTEGER
   ) {
    if (leftSourceOrder !== rightSourceOrder) return leftSourceOrder - rightSourceOrder;
   }
   const leftNumber = left.reading_number ?? Number.MAX_SAFE_INTEGER;
   const rightNumber = right.reading_number ?? Number.MAX_SAFE_INTEGER;
   if (leftNumber !== rightNumber) return leftNumber - rightNumber;
   return left.slug.localeCompare(right.slug);
  });
}

export async function getStaticReaderDataQualityReport() {
 const documents = staticReaderDocuments();
 const documentIds = new Set(documents.map((document) => document.id));
 const groupIds = new Set(staticReaderSeed.reader.exerciseGroups.map((group) => group.id));
 const vocabIds = new Set(staticReaderSeed.canonical.vocabItems.map((vocabulary) => vocabulary.id));
 const orphanParagraphs = staticReaderSeed.reader.paragraphs.filter(
  (paragraph) => !documentIds.has(paragraph.document_id),
 ).length;
 const orphanVocabularyLinks = staticReaderSeed.reader.vocabularyLinks.filter(
  (link) => !documentIds.has(link.document_id) || !vocabIds.has(link.vocab_item_id),
 ).length;
 const orphanExerciseGroups = staticReaderSeed.reader.exerciseGroups.filter(
  (group) => !documentIds.has(group.document_id),
 ).length;
 const orphanExerciseItems = staticReaderSeed.reader.exerciseItems.filter(
  (item) => !groupIds.has(item.group_id),
 ).length;
 const orphanAssets = staticReaderSeed.reader.assets.filter(
  (asset) => asset.document_id !== null && !documentIds.has(asset.document_id),
 ).length;
 const missingVocabularyPinyin = staticReaderSeed.canonical.vocabItems.filter(
  (vocabulary) => vocabulary.pinyin.trim().length === 0,
 ).length;
 const kindCounts = new Map<string, number>();
 for (const document of documents) {
  kindCounts.set(document.kind, (kindCounts.get(document.kind) ?? 0) + 1);
 }
 const issues: string[] = [];
 if (orphanParagraphs > 0)
  issues.push(`${orphanParagraphs} paragraph không có document published.`);
 if (orphanVocabularyLinks > 0) issues.push(`${orphanVocabularyLinks} vocab link không resolve.`);
 if (orphanExerciseGroups > 0) issues.push(`${orphanExerciseGroups} exercise group không resolve.`);
 if (orphanExerciseItems > 0) issues.push(`${orphanExerciseItems} exercise item không resolve.`);
 if (orphanAssets > 0) issues.push(`${orphanAssets} asset không có document published.`);
 if (missingVocabularyPinyin > 0) {
  issues.push(`${missingVocabularyPinyin} canonical vocab thiếu pinyin trong static source.`);
 }

 return {
  documents: documents.length,
  paragraphs: staticReaderSeed.reader.paragraphs.length,
  vocabularyLinks: staticReaderSeed.reader.vocabularyLinks.length,
  exerciseGroups: staticReaderSeed.reader.exerciseGroups.length,
  exerciseItems: staticReaderSeed.reader.exerciseItems.length,
  assets: staticReaderSeed.reader.assets.length,
  orphanParagraphs,
  orphanVocabularyLinks,
  orphanExerciseGroups,
  orphanExerciseItems,
  orphanAssets,
  publishedKinds: Array.from(kindCounts.entries()).map(([kind, count]) => ({ kind, count })),
  issues,
 };
}

export async function listReaderDocuments(kind?: ReaderDocumentRow["kind"]) {
 return staticReaderDocuments(kind);
}

export async function listReaderAssets(assetType?: ReaderAssetRow["asset_type"]) {
 return staticReaderSeed.reader.assets
  .filter((asset) => assetType === undefined || asset.asset_type === assetType)
  .toSorted((left, right) => left.source_path.localeCompare(right.source_path));
}

export async function getReaderAsset(assetId: string) {
 return staticReaderSeed.reader.assets.find((asset) => asset.id === assetId) ?? null;
}

export async function listReaderPdfAssets(): Promise<ReaderPdfAsset[]> {
 const reinforcementDocuments = staticReaderDocuments("reinforcement");
 const reinforcementEntries: Array<readonly [string, ReaderDocumentRow]> = [];
 for (const document of reinforcementDocuments) {
  const resourceFile = document.source_metadata.resource_file;
  const pdfPage = document.source_metadata.pdf_page;
  if (typeof resourceFile === "string" && typeof pdfPage === "number") {
   reinforcementEntries.push([`${resourceFile}:${pdfPage}`, document]);
  }
 }
 const reinforcementByPage = new Map(reinforcementEntries);
 return staticReaderSeed.reader.assets
  .filter((asset) => asset.asset_type === "image")
  .flatMap((asset) => {
   const match = /^public\/resources\/pages\/(.+)-page-(\d+)\.webp$/u.exec(asset.source_path);
   if (match === null) return [];
   const [, resourceStem, pageText] = match;
   const pdfPage = Number(pageText);
   const resourceFile = `${resourceStem}.pdf`;
   const document = reinforcementByPage.get(`${resourceFile}:${pdfPage}`);
   const bookNumber = /^hanyu-series-reading-book-(\d+)$/u.exec(resourceStem)?.[1];
   const id =
    bookNumber === undefined ? `${resourceStem}-${pdfPage}` : `book-${bookNumber}-${pdfPage}`;
   return [
    {
     id,
     title: `Hán ngữ · Quyển ${bookNumber ?? ""} · trang ${pdfPage}`,
     resourceFile,
     pdfPage,
     printedPage:
      typeof document?.source_metadata.printed_page === "number"
       ? document.source_metadata.printed_page
       : pdfPage,
     imageSrc: asset.external_url ?? `/${asset.source_path.replace(/^public\//u, "")}`,
    },
   ];
  })
  .sort(
   (left, right) =>
    left.resourceFile.localeCompare(right.resourceFile) || left.pdfPage - right.pdfPage,
  );
}

export async function getReaderDocument(documentId: string) {
 const document = staticReaderSeed.reader.documents.find(
  (candidate) =>
   candidate.id === documentId &&
   candidate.publication_status === "published" &&
   candidate.deleted_at === null,
 );
 if (document === undefined) return null;

 const paragraphs = staticReaderSeed.reader.paragraphs
  .filter((paragraph) => paragraph.document_id === documentId)
  .sort((left, right) => left.paragraph_order - right.paragraph_order);
 const vocabularyLinks = staticReaderSeed.reader.vocabularyLinks
  .filter((link) => link.document_id === documentId)
  .sort((left, right) => left.item_order - right.item_order);
 const groups = staticReaderSeed.reader.exerciseGroups
  .filter((group) => group.document_id === documentId)
  .sort((left, right) => left.exercise_order - right.exercise_order);
 const assets = staticReaderSeed.reader.assets
  .filter((asset) => asset.document_id === documentId)
  .sort((left, right) => left.created_at.localeCompare(right.created_at));
 const vocabularyById = new Map(
  staticReaderSeed.canonical.vocabItems.map((vocabulary) => [vocabulary.id, vocabulary]),
 );
 const vocabulary = vocabularyLinks.map((link) => {
  const vocabularyItem = vocabularyById.get(link.vocab_item_id);
  if (vocabularyItem === undefined) {
   throw new Error(`Static Reader vocabulary reference is missing: ${link.vocab_item_id}`);
  }
  return vocabularyItem;
 });
 const groupIds = groups.map((group) => group.id);
 const itemsResult = staticReaderSeed.reader.exerciseItems
  .filter((item) => groupIds.includes(item.group_id))
  .sort((left, right) => left.item_order - right.item_order);

 return {
  document,
  paragraphs,
  vocabularyLinks,
  vocabulary: readerVocabularyRowSchema.array().parse(vocabulary),
  exerciseGroups: groups,
  exerciseItems: readerExerciseItemRowSchema
   .array()
   .parse(itemsResult)
   .map(parseReaderExerciseItemRow),
  assets,
 };
}
