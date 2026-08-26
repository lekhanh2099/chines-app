import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import { getApiKeyModelOptions, isApiKeyModelSupported } from "@/lib/api-key-models";
import { getApiKeyProviderLabel } from "@/lib/api-key-providers";
import {
 AI_TASK_REGISTRY,
 aiTaskAssignmentSchema,
 getAiTaskDefinition,
} from "@/lib/ai-task-contract";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import {
 AiTaskStorageNotReadyError,
 listUserAiTaskAssignments,
 upsertUserAiTaskAssignment,
} from "@/services/ai-task-routing.service";
import { getAiRuntimeCapabilitiesForProvider } from "@/services/ai-runtime.service";
import { listUserApiKeys } from "@/services/user-api-keys.service";

const updateTaskSchema = aiTaskAssignmentSchema;

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  const [assignments, keys] = await Promise.all([
   listUserAiTaskAssignments(auth.context.user.id),
   listUserApiKeys(auth.context.supabase, auth.context.user.id),
  ]);

  return privateNoStoreJson({
   tasks: AI_TASK_REGISTRY.map((task) => ({
    ...task,
    assignment: assignments.find((assignment) => assignment.taskId === task.id) ?? {
     taskId: task.id,
     mode: "auto",
     keyId: null,
     model: null,
    },
   })),
   keys: keys.map((key) => {
    const supportedModels = getApiKeyModelOptions(key.provider).map((model) => ({
     value: model.value,
     label: model.label,
    }));
    const models =
     key.defaultModel && !supportedModels.some((model) => model.value === key.defaultModel)
      ? [{ value: key.defaultModel, label: key.defaultModel }, ...supportedModels]
      : supportedModels;
    return {
     keyId: key.id,
     provider: key.provider,
     providerLabel: getApiKeyProviderLabel(key.provider),
     label: key.label,
     maskedKey: key.maskedKey,
     isActive: key.isActive,
     defaultModel: key.defaultModel,
     capabilities: [...getAiRuntimeCapabilitiesForProvider(key.provider)],
     models,
    };
   }),
  });
 } catch (error) {
  if (error instanceof AiTaskStorageNotReadyError) {
   return apiError("AI task assignment storage is not ready", 503, "AI_TASK_SCHEMA_UNAVAILABLE");
  }
  return apiError("Unable to load AI task assignments", 500, "AI_TASKS_LOAD_FAILED");
 }
}

export async function PUT(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = updateTaskSchema.safeParse(payload);
 if (!parsed.success) {
  return privateNoStoreJson(
   { error: "Invalid AI task assignment", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 if (parsed.data.mode === "assigned") {
  const task = getAiTaskDefinition(parsed.data.taskId);
  const key = (await listUserApiKeys(auth.context.supabase, auth.context.user.id)).find(
   (candidate) => candidate.id === parsed.data.keyId,
  );
  if (!key) return apiError("API key does not belong to this account", 404, "AI_KEY_NOT_FOUND");
  if (!key.isActive) return apiError("Assigned API key is paused", 409, "AI_KEY_PAUSED");
  if (!getAiRuntimeCapabilitiesForProvider(key.provider).includes(task.capability)) {
   return apiError("API key provider cannot run this task", 400, "AI_TASK_CAPABILITY_UNAVAILABLE");
  }
  if (
   !isApiKeyModelSupported(key.provider, parsed.data.model) &&
   key.defaultModel !== parsed.data.model
  ) {
   return apiError("Model is not supported by this API key", 400, "AI_MODEL_UNAVAILABLE");
  }
 }

 try {
  const assignment = await upsertUserAiTaskAssignment(auth.context.user.id, parsed.data);
  return privateNoStoreJson({ assignment });
 } catch (error) {
  if (error instanceof AiTaskStorageNotReadyError) {
   return apiError("AI task assignment storage is not ready", 503, "AI_TASK_SCHEMA_UNAVAILABLE");
  }
  return apiError("Unable to save AI task assignment", 500, "AI_TASK_UPDATE_FAILED");
 }
}
