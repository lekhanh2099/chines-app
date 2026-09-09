import { HumanitiesPage as HumanitiesContent } from "@/features/humanities/HumanitiesPage";

export default async function HumanitiesPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 return (
  <HumanitiesContent documentId={typeof params.document === "string" ? params.document : ""} />
 );
}
