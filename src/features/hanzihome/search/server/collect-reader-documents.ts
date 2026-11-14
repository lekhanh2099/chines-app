import "server-only";

import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import { resolveReadingDocumentHref } from "@/features/reading/navigation/reading-route-registry";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/reading/repositories/reading-content.repository";

import type { SearchDocument } from "./search-engine";

function readerDocumentDocuments(
 resource: Pick<ReaderDocumentResource, "document" | "paragraphs">,
): SearchDocument[] {
 const { document, paragraphs } = resource;
 const href = resolveReadingDocumentHref(document);
 const metadata = { source: "reader", readerKind: document.kind, documentId: document.id };
 const subtitle = document.title_vi || undefined;
 return [
  {
   item: {
    id: `reader-document:${document.id}`,
    kind: "reader_document",
    title: document.title_zh,
    subtitle,
    pinyin: document.title_pinyin || undefined,
    href,
    metadata,
   },
   title: `${document.title_zh} ${document.title_vi}`,
   pinyin: document.title_pinyin,
   subtitle: document.genre_vi,
   body: document.objectives_vi.join("\n"),
  },
  ...paragraphs.map((paragraph): SearchDocument => ({
   item: {
    id: `reader-paragraph:${paragraph.id}`,
    kind: "reader_document",
    title: document.title_zh,
    subtitle,
    href,
    metadata: { ...metadata, paragraphId: paragraph.id },
   },
   title: "",
   pinyin: paragraph.pinyin,
   subtitle: "",
   body: [paragraph.zh, paragraph.vi].filter(Boolean).join("\n"),
  })),
 ];
}

/** Every published Studio Reader document and its paragraphs from the static corpus. */
export async function collectReaderDocuments() {
 const documents = await listReaderDocuments();
 const resources = await Promise.all(documents.map((document) => getReaderDocument(document.id)));
 return resources.flatMap((resource) => (resource ? readerDocumentDocuments(resource) : []));
}
