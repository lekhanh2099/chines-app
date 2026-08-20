import { notFound } from "next/navigation";

import { HanziHomeHtmlArtifactsPage } from "@/features/hanzihome/html-artifacts/HanziHomeHtmlArtifactsPage";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export default async function HtmlArtifactsPage() {
 const auth = await requireAuthenticatedRoute();
 if (
  !auth.authenticated ||
  !(await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id))
 ) {
  notFound();
 }

 return <HanziHomeHtmlArtifactsPage />;
}
