import { notFound } from "next/navigation";

import { ReaderDataQualityWorkspace } from "@/features/reading/workspaces/ReaderDataQualityWorkspace";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export default async function DataQualityPage() {
 const auth = await requireAuthenticatedRoute();
 if (
  !auth.authenticated ||
  !(await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id))
 ) {
  notFound();
 }

 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderDataQualityWorkspace />
  </div>
 );
}
