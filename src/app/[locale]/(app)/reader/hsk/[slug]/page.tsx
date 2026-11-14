import { redirect } from "next/navigation";

export default async function ReaderHskDocumentCompatibilityPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 redirect(`/hsk/${encodeURIComponent(slug)}`);
}
