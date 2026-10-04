import { JsonObjectSchema } from "@/types/json";
import type { ReaderDocumentRow } from "../model/reading-resource.schemas";
import type { ReaderPdfAsset } from "../model/reading-assets.schemas";
import { pdfAssetIdForDocument } from "../pdf/pdf-viewer-utils";

type ReaderDocumentGroup = {
 id: string;
 title: string;
 subtitle: string;
 description: string;
 documents: ReaderDocumentRow[];
};

export function metadataText(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

export function metadataNumber(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 if (typeof value === "number") return value;
 const counts = JsonObjectSchema.safeParse(document.source_metadata.counts);
 const nestedValue = counts.success ? counts.data[key] : undefined;
 return typeof nestedValue === "number" ? nestedValue : null;
}

function sourceOrder(document: ReaderDocumentRow) {
 const sourceId = metadataText(document, "source_id");
 if (sourceId === null) return Number.MAX_SAFE_INTEGER;
 const match = /(?:mock|reinforcement)-0*(\d+)$/u.exec(sourceId);
 return match === null ? Number.MAX_SAFE_INTEGER : Number(match[1]);
}

export function reinforcementPdfAssetId(
 document: ReaderDocumentRow,
 assets: ReadonlyArray<ReaderPdfAsset>,
) {
 const resourceFile = metadataText(document, "resource_file");
 const pdfPage = metadataNumber(document, "pdf_page");
 return resourceFile !== null && pdfPage !== null
  ? pdfAssetIdForDocument(resourceFile, pdfPage, assets)
  : null;
}

export function groupReaderCollectionDocuments(
 kind: Exclude<ReaderDocumentRow["kind"], "hsk">,
 documents: readonly ReaderDocumentRow[],
 unitReferenceDocuments: readonly ReaderDocumentRow[],
 otherTitle: string,
 unitTitle: (id: string, title: string) => string,
) {
 const groups = new Map<string, ReaderDocumentGroup>();
 for (const document of documents) {
  const id = document.unit_id ?? "other";
  const firstDocument = (kind === "reinforcement" ? unitReferenceDocuments : documents)?.find(
   (candidate) =>
    candidate.unit_id === id && (kind !== "reinforcement" || candidate.kind === "core"),
  );
  const groupTitle =
   id === "other"
    ? otherTitle
    : unitTitle(
       id.replace(/^U/u, ""),
       metadataText(firstDocument ?? document, "unit_title_zh") ?? "Reader",
      );
  const subtitle = metadataText(firstDocument ?? document, "unit_title_vi") ?? "";
  const groupDescription = metadataText(firstDocument ?? document, "unit_focus_vi") ?? "";
  const group = groups.get(id) ?? {
   id,
   title: groupTitle,
   subtitle,
   description: groupDescription,
   documents: [],
  };
  group.documents.push(document);
  groups.set(id, group);
 }
 return [...groups.values()]
  .sort((left, right) => {
   if (left.id === "other") return 1;
   if (right.id === "other") return -1;
   return left.id.localeCompare(right.id, undefined, { numeric: true });
  })
  .map((group) => ({
   ...group,
   documents:
    kind === "reinforcement"
     ? group.documents.toSorted((left, right) => sourceOrder(left) - sourceOrder(right))
     : group.documents.toSorted(
        (left, right) =>
         (left.reading_number ?? Number.MAX_SAFE_INTEGER) -
         (right.reading_number ?? Number.MAX_SAFE_INTEGER),
       ),
  }));
}
