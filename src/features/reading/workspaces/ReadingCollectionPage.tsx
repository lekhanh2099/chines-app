import type { ComponentProps } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ReaderCollectionWorkspace } from "./ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
 listReaderPdfAssets,
} from "../repositories/reading-content.repository";

export async function ReadingCollectionPage({
 kind,
 documentId = "",
 slug = "",
}: {
 kind: ComponentProps<typeof ReaderCollectionWorkspace>["kind"];
 documentId?: string;
 slug?: string;
}) {
 const initialDocuments = await listReaderDocuments(kind);
 const selectedId =
  documentId || initialDocuments.find((document) => document.slug === slug)?.id || "";
 const initialResource = selectedId ? await getReaderDocument(selectedId) : null;
 const initialUnitReferenceDocuments =
  kind === "reinforcement" ? await listReaderDocuments("core") : [];
 const initialPdfAssets = kind === "reinforcement" ? await listReaderPdfAssets() : [];
 return (
  <PageContainer>
   <ReaderCollectionWorkspace
    kind={kind}
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    initialDocumentSlug={slug}
    initialUnitReferenceDocuments={initialUnitReferenceDocuments}
    initialPdfAssets={initialPdfAssets}
   />
  </PageContainer>
 );
}
