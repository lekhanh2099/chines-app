import { HskPage } from "@/features/hsk/HskPage";
export default async function Page({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const paramsValue = await searchParams;
 return (
  <HskPage documentId={typeof paramsValue.document === "string" ? paramsValue.document : ""} />
 );
}
