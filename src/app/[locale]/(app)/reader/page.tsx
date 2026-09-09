import { ReadingPage } from "@/features/reading/workspaces/ReadingPage";
export default async function ReaderPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 return (
  <ReadingPage
   collection={typeof params.collection === "string" ? params.collection : undefined}
   documentId={typeof params.document === "string" ? params.document : ""}
   surface={params.surface === "pdf" ? "pdf" : "text"}
  />
 );
}
