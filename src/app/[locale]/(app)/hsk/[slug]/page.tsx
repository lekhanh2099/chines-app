import { HskPage } from "@/features/hsk/HskPage";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
 const paramsValue = await params;
 return <HskPage slug={paramsValue.slug} />;
}
