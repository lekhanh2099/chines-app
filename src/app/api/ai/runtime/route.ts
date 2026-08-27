import { privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import { aiRuntimeWithTaskRuntimesResponseSchema } from "@/lib/ai-task-contract";
import { getUserAiRuntimeOverview } from "@/services/ai-runtime.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) {
  return privateNoStoreJson({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
 }

 try {
  const overview = await getUserAiRuntimeOverview(auth.context.supabase, auth.context.user.id);
  return privateNoStoreJson(
   aiRuntimeWithTaskRuntimesResponseSchema.parse({
    ...overview.readiness,
    taskRuntimes: overview.taskRuntimes,
   }),
  );
 } catch {
  return privateNoStoreJson(
   {
    error: "Không thể kiểm tra trạng thái AI runtime lúc này.",
    code: "AI_RUNTIME_STATUS_UNAVAILABLE",
   },
   { status: 500 },
  );
 }
}
