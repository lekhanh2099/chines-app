import { z } from "zod";

import { ApiKeyProviderSchema } from "@/lib/api-key-providers";
import {
 aiActivityCursorSchema,
 aiActivityStatusSchema,
 aiTaskIdSchema,
} from "@/lib/ai-task-contract";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import {
 AiTaskStorageNotReadyError,
 clearUserAiActivityEvents,
 listUserAiActivityEvents,
} from "@/services/ai-task-routing.service";

const activityQuerySchema = z.strictObject({
 taskId: aiTaskIdSchema.optional(),
 provider: ApiKeyProviderSchema.optional(),
 status: aiActivityStatusSchema.optional(),
 cursorCreatedAt: z.iso.datetime({ offset: true }).optional(),
 cursorId: z.uuid().optional(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const url = new URL(request.url);
 const parsed = activityQuerySchema.safeParse({
  taskId: url.searchParams.get("taskId") ?? undefined,
  provider: url.searchParams.get("provider") ?? undefined,
  status: url.searchParams.get("status") ?? undefined,
  cursorCreatedAt: url.searchParams.get("cursorCreatedAt") ?? undefined,
  cursorId: url.searchParams.get("cursorId") ?? undefined,
 });
 if (!parsed.success || Boolean(parsed.data.cursorCreatedAt) !== Boolean(parsed.data.cursorId)) {
  return apiError("Invalid AI activity filters", 400, "AI_ACTIVITY_FILTER_INVALID");
 }

 try {
  const result = await listUserAiActivityEvents({
   userId: auth.context.user.id,
   ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
   ...(parsed.data.provider ? { provider: parsed.data.provider } : {}),
   ...(parsed.data.status ? { status: parsed.data.status } : {}),
   ...(parsed.data.cursorCreatedAt && parsed.data.cursorId
    ? {
       cursor: aiActivityCursorSchema.parse({
        createdAt: parsed.data.cursorCreatedAt,
        id: parsed.data.cursorId,
       }),
      }
    : {}),
  });
  return privateNoStoreJson(result);
 } catch (error) {
  if (error instanceof AiTaskStorageNotReadyError) {
   return apiError("AI activity storage is not ready", 503, "AI_ACTIVITY_SCHEMA_UNAVAILABLE");
  }
  return apiError("Unable to load AI activity", 500, "AI_ACTIVITY_LOAD_FAILED");
 }
}

export async function DELETE() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  await clearUserAiActivityEvents(auth.context.user.id);
  return privateNoStoreJson({ success: true });
 } catch (error) {
  if (error instanceof AiTaskStorageNotReadyError) {
   return apiError("AI activity storage is not ready", 503, "AI_ACTIVITY_SCHEMA_UNAVAILABLE");
  }
  return apiError("Unable to clear AI activity", 500, "AI_ACTIVITY_CLEAR_FAILED");
 }
}
