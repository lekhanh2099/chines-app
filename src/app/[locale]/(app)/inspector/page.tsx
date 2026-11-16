import { HanziInspectorWorkspace } from "@/features/hanzihome/inspector/HanziInspectorWorkspace";
import { VocabularyStoreWorkspace } from "@/features/hanzihome/vocabulary-index/VocabularyStoreWorkspace";
import { getVocabularyPage } from "@/features/hanzihome/vocabulary-index/vocabulary-index.server";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export default async function InspectorPage({
 searchParams,
}: Pick<PageProps<"/[locale]/inspector">, "searchParams">) {
 const params = await searchParams;
 const query = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
 const auth = await requireAuthenticatedRoute();
 const result = await getVocabularyPage({
  ownerId: auth.authenticated ? auth.context.user.id : "",
  query,
  page: typeof params.page === "string" ? Number(params.page) : 1,
 });

 return (
  <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
   <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col">
    <VocabularyStoreWorkspace
     query={query}
     items={result.items}
     total={result.total}
     storeTotal={result.storeTotal}
     page={result.page}
     pageCount={result.pageCount}
     lookup={<HanziInspectorWorkspace />}
    />
   </div>
  </div>
 );
}
