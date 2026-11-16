import { notFound } from "next/navigation";

import { RadicalCharacterWorkspace } from "@/features/hanzihome/radical-characters/RadicalCharacterWorkspace";
import { getRadicalCharacterSets } from "@/features/hanzihome/radical-characters/radical-characters.server";

export default async function RadicalCharacterPage({
 params,
}: Pick<PageProps<"/[locale]/radicals/characters/[hanzi]">, "params">) {
 const hanzi = decodeURIComponent((await params).hanzi);
 const [set] = getRadicalCharacterSets(hanzi);
 if (!set) notFound();

 return <RadicalCharacterWorkspace set={set} hanzi={hanzi} />;
}
