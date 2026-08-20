import { notFound } from "next/navigation";

import { DeveloperApiPage } from "@/features/developer-api/DeveloperApiPage";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export default async function ApiDocsPage() {
 const auth = await requireAuthenticatedRoute();
 if (
  !auth.authenticated ||
  !(await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id))
 ) {
  notFound();
 }

 return <DeveloperApiPage />;
}
