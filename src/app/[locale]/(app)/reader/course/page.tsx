import { ReadingCollectionPage } from "@/features/reading/workspaces/ReadingCollectionPage";
export default async function Page({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const paramsValue = await searchParams;
 return (
  <ReadingCollectionPage
   kind="core"
   documentId={typeof paramsValue.document === "string" ? paramsValue.document : ""}
  />
 );
}
