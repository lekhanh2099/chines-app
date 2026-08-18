import type { JsonFieldValue } from "@/types/json";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
 editAiConversationManagedMemory,
 forgetAiConversationManagedMemory,
 listAiConversationManagedMemories,
 loadAiConversationSettingsOverview,
 resolveAiConversationManagedOpenLoop,
 updateAiConversationAccountPreferences,
 AiConversationSettingsPersistenceConfigurationError,
 AiConversationSettingsPersistenceNotReadyError,
 AiConversationSettingsPersistenceRequestError,
} from "@/features/settings/ai-conversation-settings-persistence.server";
import {
 aiConversationAccountPreferencesSchema,
 aiConversationManagedMemoryListSchema,
 aiConversationManagedMemorySchema,
 aiConversationMemoryEditSchema,
 aiConversationMemoryForgetSchema,
 aiConversationMemoryForgottenResponseSchema,
 aiConversationMemoryResolveSchema,
 aiConversationMemoryResolvedResponseSchema,
 aiConversationSettingsOverviewSchema,
} from "@/features/settings/ai-conversation-settings.schema";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const memoryResourceSchema = z.literal("memories");
const memoryMutationSchema = z.discriminatedUnion("action", [
 aiConversationMemoryEditSchema.extend({ action: z.literal("edit") }),
 aiConversationMemoryResolveSchema.extend({ action: z.literal("resolve") }),
]);

function persistenceErrorResponse(error: unknown) {
 if (error instanceof AiConversationSettingsPersistenceNotReadyError) {
  return NextResponse.json(
   { error: "AI conversation persistence is not ready", code: "AI_PERSISTENCE_NOT_READY" },
   { status: 503 },
  );
 }
 if (error instanceof AiConversationSettingsPersistenceConfigurationError) {
  return NextResponse.json(
   { error: "AI conversation persistence server secret is missing", code: "AI_PERSISTENCE_CONFIG_MISSING" },
   { status: 503 },
  );
 }
 if (error instanceof AiConversationSettingsPersistenceRequestError) {
  if (error.code === "AI_MEMORY_NOT_FOUND" || error.status === 404) {
   return NextResponse.json(
    { error: "AI memory not found", code: "AI_MEMORY_NOT_FOUND" },
    { status: 404 },
   );
  }
  if (error.status === 401 || error.status === 403 || error.code === "42501") {
   return NextResponse.json(
    { error: "AI persistence access failed", code: "AI_PERSISTENCE_ACCESS_FAILED" },
    { status: 503 },
   );
  }
 }
 return null;
}

async function requireUser() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 return user;
}

export async function GET(request: NextRequest) {
 const user = await requireUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const resource = request.nextUrl.searchParams.get("resource");
 try {
  if (resource !== null) {
   const parsedResource = memoryResourceSchema.safeParse(resource);
   if (!parsedResource.success) {
    return NextResponse.json({ error: "Unsupported AI settings resource" }, { status: 400 });
   }
   const memories = await listAiConversationManagedMemories(user.id);
   return NextResponse.json(aiConversationManagedMemoryListSchema.parse(memories));
  }

  const overview = await loadAiConversationSettingsOverview(user.id);
  return NextResponse.json(aiConversationSettingsOverviewSchema.parse(overview));
 } catch (error) {
  const persistenceResponse = persistenceErrorResponse(error);
  if (persistenceResponse) return persistenceResponse;
  logger.error("[AI Settings] load failed", error);
  return NextResponse.json({ error: "Could not load AI conversation settings" }, { status: 500 });
 }
}

export async function PUT(request: NextRequest) {
 const user = await requireUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const payload: JsonFieldValue = await request.json();
 const parsed = aiConversationAccountPreferencesSchema.safeParse(payload);
 if (!parsed.success) {
  return NextResponse.json(
   { error: "Invalid AI conversation preferences", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 try {
  const preferences = await updateAiConversationAccountPreferences({
   userId: user.id,
   preferences: parsed.data,
  });
  return NextResponse.json(aiConversationAccountPreferencesSchema.parse(preferences));
 } catch (error) {
  const persistenceResponse = persistenceErrorResponse(error);
  if (persistenceResponse) return persistenceResponse;
  logger.error("[AI Settings] preference update failed", error);
  return NextResponse.json({ error: "Could not update AI conversation preferences" }, { status: 500 });
 }
}

export async function PATCH(request: NextRequest) {
 const user = await requireUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const payload: JsonFieldValue = await request.json();
 const parsed = memoryMutationSchema.safeParse(payload);
 if (!parsed.success) {
  return NextResponse.json(
   { error: "Invalid AI memory mutation", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 try {
  if (parsed.data.action === "edit") {
   const memory = await editAiConversationManagedMemory({
    userId: user.id,
    memoryId: parsed.data.memoryId,
    content: parsed.data.content,
   });
   return NextResponse.json(aiConversationManagedMemorySchema.parse(memory));
  }

  const result = await resolveAiConversationManagedOpenLoop({
   userId: user.id,
   memoryId: parsed.data.memoryId,
  });
  return NextResponse.json(aiConversationMemoryResolvedResponseSchema.parse(result));
 } catch (error) {
  const persistenceResponse = persistenceErrorResponse(error);
  if (persistenceResponse) return persistenceResponse;
  logger.error("[AI Settings] memory mutation failed", error);
  return NextResponse.json({ error: "Could not update AI memory" }, { status: 500 });
 }
}

export async function DELETE(request: NextRequest) {
 const user = await requireUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const payload: JsonFieldValue = await request.json();
 const parsed = aiConversationMemoryForgetSchema.safeParse(payload);
 if (!parsed.success) {
  return NextResponse.json(
   { error: "Invalid AI memory forget request", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 try {
  const result = await forgetAiConversationManagedMemory({
   userId: user.id,
   memoryId: parsed.data.memoryId,
  });
  return NextResponse.json(aiConversationMemoryForgottenResponseSchema.parse(result));
 } catch (error) {
  const persistenceResponse = persistenceErrorResponse(error);
  if (persistenceResponse) return persistenceResponse;
  logger.error("[AI Settings] memory forget failed", error);
  return NextResponse.json({ error: "Could not forget AI memory" }, { status: 500 });
 }
}
