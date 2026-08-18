import "server-only";

import { z } from "zod";

import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";
import type { JsonObject } from "@/types/json";

import {
 aiConversationAccountPreferencesSchema,
 aiConversationManagedMemorySchema,
 aiConversationSettingsOverviewSchema,
 type AiConversationAccountPreferences,
 type AiConversationManagedMemory,
 type AiConversationSettingsOverview,
} from "./ai-conversation-settings.schema";

const postgrestErrorSchema = z.object({
 code: z.string().optional(),
 message: z.string().optional(),
});

const preferenceRowSchema = z.object({
 default_character_id: z.uuid().nullable(),
 default_mode: aiConversationAccountPreferencesSchema.shape.defaultMode,
 default_correction_style: aiConversationAccountPreferencesSchema.shape.defaultCorrectionStyle,
 default_reply_mode: aiConversationAccountPreferencesSchema.shape.defaultReplyMode,
 learner_level: aiConversationAccountPreferencesSchema.shape.learnerLevel,
 memory_enabled: z.boolean(),
});

const characterRowSchema = z.object({
 id: z.uuid(),
 display_name: z.string().trim().min(1),
 city: z.string(),
});

const relationshipRowSchema = z.object({
 nickname: z.string(),
 familiarity_score: z.number().min(0).max(1),
});

const memoryRowSchema = z.object({
 id: z.uuid(),
 character_id: z.uuid().nullable(),
 kind: aiConversationManagedMemorySchema.shape.kind,
 content: z.string().trim().min(1).max(600),
 updated_at: z.iso.datetime({ offset: true }),
});

const DEFAULT_ACCOUNT_PREFERENCES: AiConversationAccountPreferences = {
 defaultMode: "natural",
 defaultCorrectionStyle: "balanced",
 defaultReplyMode: "adaptive",
 learnerLevel: "intermediate",
 memoryEnabled: true,
};

export class AiConversationSettingsPersistenceNotReadyError extends Error {
 constructor() {
  super("AI conversation settings persistence is not ready");
  this.name = "AiConversationSettingsPersistenceNotReadyError";
 }
}

export class AiConversationSettingsPersistenceConfigurationError extends Error {
 constructor() {
  super("AI conversation settings server secret is not configured");
  this.name = "AiConversationSettingsPersistenceConfigurationError";
 }
}

export class AiConversationSettingsPersistenceRequestError extends Error {
 readonly status: number;
 readonly code: string | null;

 constructor(status: number, code: string | null, message: string) {
  super(message);
  this.name = "AiConversationSettingsPersistenceRequestError";
  this.status = status;
  this.code = code;
 }
}

function getServerSecret() {
 try {
  return getSupabaseServerSecret();
 } catch {
  throw new AiConversationSettingsPersistenceConfigurationError();
 }
}

function buildRestUrl(resource: string, params?: Readonly<Record<string, string>>) {
 const url = new URL(`${publicSupabaseEnv.url}/rest/v1/${resource}`);
 for (const [key, value] of Object.entries(params ?? {})) {
  url.searchParams.set(key, value);
 }
 return url;
}

function buildServiceHeaders(secret: string, hasBody: boolean, prefer?: string) {
 const isModernSecret = secret.startsWith("sb_secret_");
 return {
  Accept: "application/json",
  apikey: secret,
  ...(!isModernSecret ? { Authorization: `Bearer ${secret}` } : {}),
  ...(hasBody ? { "Content-Type": "application/json" } : {}),
  ...(prefer ? { Prefer: prefer } : {}),
 };
}

function isPersistenceNotReady(code: string | null, message: string) {
 if (code === "42P01" || code === "42703" || code === "PGRST202" || code === "PGRST204" || code === "PGRST205") {
  return true;
 }
 const normalized = message.toLowerCase();
 return (
  normalized.includes("ai_conversation_preferences") ||
  normalized.includes("ai_memories") ||
  normalized.includes("ai_relationship_states")
 );
}

async function requestPostgrest<T>({
 resource,
 schema,
 params,
 method = "GET",
 body,
 prefer,
}: {
 resource: string;
 schema: z.ZodType<T>;
 params?: Readonly<Record<string, string>>;
 method?: "GET" | "POST" | "PATCH" | "DELETE";
 body?: JsonObject;
 prefer?: string;
}): Promise<T> {
 const secret = getServerSecret();
 const response = await fetch(buildRestUrl(resource, params), {
  method,
  headers: buildServiceHeaders(secret, Boolean(body), prefer),
  ...(body ? { body: JSON.stringify(body) } : {}),
  cache: "no-store",
 });
 const payload: unknown = await response.json().catch(() => null);

 if (!response.ok) {
  const parsedError = postgrestErrorSchema.safeParse(payload);
  const code = parsedError.success ? parsedError.data.code ?? null : null;
  const message =
   parsedError.success && parsedError.data.message
    ? parsedError.data.message
    : "AI conversation settings persistence request failed";
  if (isPersistenceNotReady(code, message)) {
   throw new AiConversationSettingsPersistenceNotReadyError();
  }
  throw new AiConversationSettingsPersistenceRequestError(response.status, code, message);
 }

 return schema.parse(payload);
}

function toAccountPreferences(
 row: z.output<typeof preferenceRowSchema> | null,
): AiConversationAccountPreferences {
 if (!row) return DEFAULT_ACCOUNT_PREFERENCES;
 return {
  defaultMode: row.default_mode,
  defaultCorrectionStyle: row.default_correction_style,
  defaultReplyMode: row.default_reply_mode,
  learnerLevel: row.learner_level,
  memoryEnabled: row.memory_enabled,
 };
}

async function loadPreferenceRow(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_conversation_preferences",
  schema: z.array(preferenceRowSchema),
  params: {
   select:
    "default_character_id,default_mode,default_correction_style,default_reply_mode,learner_level,memory_enabled",
   user_id: `eq.${userId}`,
   limit: "1",
  },
 });
 return rows[0] ?? null;
}

async function loadCurrentCharacter(userId: string, preferredCharacterId: string | null) {
 const params: Record<string, string> = {
  select: "id,display_name,city",
  user_id: `eq.${userId}`,
  archived_at: "is.null",
  limit: "1",
 };
 if (preferredCharacterId) {
  params.id = `eq.${preferredCharacterId}`;
 } else {
  params.order = "created_at.asc";
 }
 const rows = await requestPostgrest({
  resource: "ai_characters",
  schema: z.array(characterRowSchema),
  params,
 });
 return rows[0] ?? null;
}

async function loadRelationship(userId: string, characterId: string | null) {
 if (!characterId) return null;
 const rows = await requestPostgrest({
  resource: "ai_relationship_states",
  schema: z.array(relationshipRowSchema),
  params: {
   select: "nickname,familiarity_score",
   user_id: `eq.${userId}`,
   character_id: `eq.${characterId}`,
   limit: "1",
  },
 });
 return rows[0] ?? null;
}

export async function loadAiConversationSettingsOverview(
 userId: string,
): Promise<AiConversationSettingsOverview> {
 const preferenceRow = await loadPreferenceRow(userId);
 const character = await loadCurrentCharacter(userId, preferenceRow?.default_character_id ?? null);
 const relationship = await loadRelationship(userId, character?.id ?? null);
 return aiConversationSettingsOverviewSchema.parse({
  preferences: toAccountPreferences(preferenceRow),
  character: character
   ? { id: character.id, displayName: character.display_name, city: character.city }
   : null,
  relationship: relationship
   ? { nickname: relationship.nickname, familiarityScore: relationship.familiarity_score }
   : null,
 });
}

export async function updateAiConversationAccountPreferences({
 userId,
 preferences,
}: {
 userId: string;
 preferences: AiConversationAccountPreferences;
}): Promise<AiConversationAccountPreferences> {
 const parsed = aiConversationAccountPreferencesSchema.parse(preferences);
 const rows = await requestPostgrest({
  resource: "ai_conversation_preferences",
  schema: z.array(preferenceRowSchema).min(1),
  method: "POST",
  params: {
   select:
    "default_character_id,default_mode,default_correction_style,default_reply_mode,learner_level,memory_enabled",
   on_conflict: "user_id",
  },
  body: {
   user_id: userId,
   default_mode: parsed.defaultMode,
   default_correction_style: parsed.defaultCorrectionStyle,
   default_reply_mode: parsed.defaultReplyMode,
   learner_level: parsed.learnerLevel,
   memory_enabled: parsed.memoryEnabled,
   updated_at: new Date().toISOString(),
  },
  prefer: "resolution=merge-duplicates,return=representation",
 });
 return toAccountPreferences(rows[0] ?? null);
}

export async function listAiConversationManagedMemories(
 userId: string,
): Promise<AiConversationManagedMemory[]> {
 const rows = await requestPostgrest({
  resource: "ai_memories",
  schema: z.array(memoryRowSchema),
  params: {
   select: "id,character_id,kind,content,updated_at",
   user_id: `eq.${userId}`,
   status: "eq.active",
   order: "updated_at.desc",
   limit: "200",
  },
 });
 const characterIds = [...new Set(rows.flatMap((row) => (row.character_id ? [row.character_id] : [])))];
 let characterNames = new Map<string, string>();
 if (characterIds.length > 0) {
  const characters = await requestPostgrest({
   resource: "ai_characters",
   schema: z.array(characterRowSchema),
   params: {
    select: "id,display_name,city",
    user_id: `eq.${userId}`,
    id: `in.(${characterIds.join(",")})`,
   },
  });
  characterNames = new Map(characters.map((character) => [character.id, character.display_name]));
 }
 return rows.map((row) =>
  aiConversationManagedMemorySchema.parse({
   id: row.id,
   characterId: row.character_id,
   characterName: row.character_id ? characterNames.get(row.character_id) ?? null : null,
   kind: row.kind,
   content: row.content,
   updatedAt: row.updated_at,
  }),
 );
}

async function mutateSingleMemory({
 userId,
 memoryId,
 params,
 body,
 method = "PATCH",
}: {
 userId: string;
 memoryId: string;
 params?: Readonly<Record<string, string>>;
 body?: JsonObject;
 method?: "PATCH" | "DELETE";
}) {
 const rows = await requestPostgrest({
  resource: "ai_memories",
  schema: z.array(memoryRowSchema),
  method,
  params: {
   select: "id,character_id,kind,content,updated_at",
   user_id: `eq.${userId}`,
   id: `eq.${memoryId}`,
   status: "eq.active",
   ...params,
  },
  body,
  prefer: "return=representation",
 });
 const memory = rows[0];
 if (!memory) {
  throw new AiConversationSettingsPersistenceRequestError(
   404,
   "AI_MEMORY_NOT_FOUND",
   "AI memory not found",
  );
 }
 return memory;
}

export async function editAiConversationManagedMemory({
 userId,
 memoryId,
 content,
}: {
 userId: string;
 memoryId: string;
 content: string;
}): Promise<AiConversationManagedMemory> {
 const normalizedContent = z.string().trim().min(1).max(600).parse(content);
 const memory = await mutateSingleMemory({
  userId,
  memoryId,
  body: {
   content: normalizedContent,
   embedding: null,
   embedding_model: null,
   embedding_version: null,
   updated_at: new Date().toISOString(),
  },
 });
 return aiConversationManagedMemorySchema.parse({
  id: memory.id,
  characterId: memory.character_id,
  characterName: null,
  kind: memory.kind,
  content: memory.content,
  updatedAt: memory.updated_at,
 });
}

export async function resolveAiConversationManagedOpenLoop({
 userId,
 memoryId,
}: {
 userId: string;
 memoryId: string;
}) {
 const memory = await mutateSingleMemory({
  userId,
  memoryId,
  params: { kind: "eq.open_loop" },
  body: { status: "resolved", updated_at: new Date().toISOString() },
 });
 return { memoryId: memory.id, resolved: true as const };
}

export async function forgetAiConversationManagedMemory({
 userId,
 memoryId,
}: {
 userId: string;
 memoryId: string;
}) {
 const memory = await mutateSingleMemory({ userId, memoryId, method: "DELETE" });
 return { memoryId: memory.id, forgotten: true as const };
}
