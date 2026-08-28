import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import { getApiKeyModelOptions, isApiKeyModelSupported } from "@/lib/api-key-models";
import { getApiKeyProviderLabel } from "@/lib/api-key-providers";
import {
 AI_TASK_REGISTRY,
 AI_SEMANTIC_MEMORY_MODEL,
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
import {
 getAiRuntimeCapabilitiesForProvider,
 getAiTaskRuntimePreviewsFromInventory,
 getUserAiTaskRuntimePreview,
 loadUserAiRuntimeInventory,
} from "@/services/ai-runtime.service";
import { listUserApiKeys } from "@/services/user-api-keys.service";

const updateTaskSchema = aiTaskAssignmentSchema;

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  const [assignments, keys, inventory] = await Promise.all([
   listUserAiTaskAssignments(auth.context.user.id),
   listUserApiKeys(auth.context.supabase, auth.context.user.id),
   loadUserAiRuntimeInventory(auth.context.supabase, auth.context.user.id),
  ]);
  const runtimePreviews = getAiTaskRuntimePreviewsFromInventory(inventory, assignments);

  return privateNoStoreJson({
   tasks: AI_TASK_REGISTRY.map((task) => {
    const runtimePreview = runtimePreviews.find((preview) => preview.taskId === task.id);
    if (!runtimePreview) throw new Error(`Missing AI task runtime preview for ${task.id}`);
    return {
     ...task,
     assignment: assignments.find((assignment) => assignment.taskId === task.id) ?? {
      taskId: task.id,
      mode: "auto",
      keyId: null,
      model: null,
     },
     runtimePreview,
    };
   }),
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
     availability: !key.isActive
      ? "paused"
      : inventory.credentials.some((credential) => credential.id === key.id)
        ? "ready"
        : "credential-unreadable",
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
  const inventory = await loadUserAiRuntimeInventory(auth.context.supabase, auth.context.user.id);
  if (!inventory.credentials.some((credential) => credential.id === key.id)) {
   return apiError(
    "Assigned API key credential cannot be read",
    409,
    "AI_KEY_CREDENTIAL_UNREADABLE",
   );
  }
  if (!getAiRuntimeCapabilitiesForProvider(key.provider).includes(task.capability)) {
   return apiError("API key provider cannot run this task", 400, "AI_TASK_CAPABILITY_UNAVAILABLE");
  }
  if (
   parsed.data.taskId === "conversation.semantic-memory"
    ? parsed.data.model !== AI_SEMANTIC_MEMORY_MODEL
    : !isApiKeyModelSupported(key.provider, parsed.data.model) &&
      key.defaultModel !== parsed.data.model
  ) {
   return apiError("Model is not supported by this API key", 400, "AI_MODEL_UNAVAILABLE");
  }
 }

 try {
  const assignment = await upsertUserAiTaskAssignment(auth.context.user.id, parsed.data);
  const runtimePreview = await getUserAiTaskRuntimePreview({
   supabase: auth.context.supabase,
   userId: auth.context.user.id,
   assignment,
  });
  return privateNoStoreJson({ assignment, runtimePreview });
 } catch (error) {
  if (error instanceof AiTaskStorageNotReadyError) {
   return apiError("AI task assignment storage is not ready", 503, "AI_TASK_SCHEMA_UNAVAILABLE");
  }
  return apiError("Unable to save AI task assignment", 500, "AI_TASK_UPDATE_FAILED");
 }
}
