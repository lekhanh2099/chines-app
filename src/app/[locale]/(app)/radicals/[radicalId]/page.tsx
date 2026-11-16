import { RadicalDetailWorkspace } from "@/features/hanzihome/radical-characters/RadicalDetailWorkspace";

export default async function RadicalDetailPage({
 params,
}: Pick<PageProps<"/[locale]/radicals/[radicalId]">, "params">) {
 const { radicalId } = await params;
 return <RadicalDetailWorkspace radicalId={decodeURIComponent(radicalId)} />;
}
