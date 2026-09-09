import { ReaderCollectionWorkspace } from "@/features/reading/workspaces/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/reading/repositories/reading-content.repository";

export async function PersonalLearningPage({
 documentId = "",
 slug = "",
}: {
 documentId?: string;
 slug?: string;
}) {
 const initialDocuments = await listReaderDocuments("personal");
 const selectedId =
  documentId || initialDocuments.find((document) => document.slug === slug)?.id || "";
 const initialResource = selectedId ? await getReaderDocument(selectedId) : null;
 return (
  <ReaderCollectionWorkspace
   kind="personal"
   initialDocumentSlug={slug}
   initialDocuments={initialDocuments}
   initialResource={initialResource}
  />
 );
}
