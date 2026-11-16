import { notFound } from "next/navigation";

import { VocabularyWordWorkspace } from "@/features/hanzihome/vocabulary-index/VocabularyWordWorkspace";
import { getVocabularyEntries } from "@/features/hanzihome/vocabulary-index/vocabulary-index.server";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export default async function VocabularyWordPage({
 params,
}: Pick<PageProps<"/[locale]/inspector/[hanzi]">, "params">) {
 const hanzi = decodeURIComponent((await params).hanzi);
 const auth = await requireAuthenticatedRoute();
 const entries = await getVocabularyEntries({
  ownerId: auth.authenticated ? auth.context.user.id : "",
  hanzi,
 });
 if (entries.length === 0) notFound();

 return <VocabularyWordWorkspace entries={entries} />;
}
