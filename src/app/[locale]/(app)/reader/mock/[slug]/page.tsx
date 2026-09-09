import { ReadingCollectionPage } from "@/features/reading/workspaces/ReadingCollectionPage";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
 const paramsValue = await params;
 return <ReadingCollectionPage kind="mock" slug={paramsValue.slug} />;
}
