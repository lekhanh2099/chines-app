import { PageContainer } from "@/components/layout/page-container";
import { HskWorkspace } from "./HskWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/reading/repositories/reading-content.repository";

export async function HskPage({
 documentId = "",
 slug = "",
}: {
 documentId?: string;
 slug?: string;
}) {
 const initialDocuments = await listReaderDocuments("hsk");
 const selectedId =
  documentId ||
  initialDocuments.find(
   (document) => document.slug === slug || document.slug.replace(/^hsk-/u, "") === slug,
  )?.id ||
  "";
 const initialResource = selectedId ? await getReaderDocument(selectedId) : null;
 return (
  <PageContainer>
   <HskWorkspace
    initialDocumentSlug={slug}
    initialDocuments={initialDocuments}
    initialResource={initialResource}
   />
  </PageContainer>
 );
}
