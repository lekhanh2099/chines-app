import { redirect } from "next/navigation";

export default async function ReaderHskCompatibilityPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 redirect(documentId.length > 0 ? `/hsk?document=${encodeURIComponent(documentId)}` : "/hsk");
}
