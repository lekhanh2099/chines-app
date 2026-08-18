import "server-only";

import { z } from "zod";

import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";
import type { JsonObject } from "@/types/json";

import type { AiConversationContextState } from "./ai-conversation-context.server";
import type {
 AiConversationPersistedMessage,
 AiConversationSession,
 AiConversationSettings,
 AiConversationSettingsUpdate,
} from "./ai-conversation-session.schemas";

const postgrestErrorSchema = z.object({
 code: z.string().optional(),
 message: z.string().optional(),
 details: z.string().nullable().optional(),
 hint: z.string().nullable().optional(),
});

const conversationModeSchema = z.enum([
 "natural",
 "speaking-practice",
 "grammar-coach",
 "hskk-practice",
]);
const correctionStyleSchema = z.enum(["light", "balanced", "strict"]);
const replyModeSchema = z.enum(["adaptive", "chinese", "bilingual"]);
const learnerLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

const conversationRowSchema = z.object({
 id: z.uuid(),
 character_id: z.uuid(),
 title: z.string(),
 mode: conversationModeSchema,
 correction_style: correctionStyleSchema,
 reply_mode: replyModeSchema,
 memory_policy: z.enum(["inherit", "enabled", "disabled"]),
});

const conversationContextRowSchema = conversationRowSchema.extend({
 summary: z.string(),
 summary_until_seq: z.number().int().nonnegative(),
});

const messageRowSchema = z.object({
 id: z.uuid(),
 seq: z.number().int().positive(),
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
 created_at: z.iso.datetime({ offset: true }),
});

const assistantRuntimeMetadataSchema = z.strictObject({
 provider: z.string().trim().min(1),
 model: z.string().trim().min(1),
 apiKeyId: z.uuid().nullable(),
});

const assistantReplyRowSchema = messageRowSchema.extend({
 metadata: assistantRuntimeMetadataSchema,
});

const characterRowSchema = z.object({ id: z.uuid() });

const characterContextRowSchema = z.object({
 id: z.uuid(),
 display_name: z.string().trim().min(1),
 city: z.string(),
 age: z.number().int().min(1).max(120).nullable(),
 background: z.string(),
 personality: z.string(),
 speaking_style: z.string(),
 interests: z.array(z.string()),
 identity_notes: z.string(),
});

const relationshipContextRowSchema = z.object({
 nickname: z.string(),
 familiarity_score: z.number().min(0).max(1),
 revision: z.number().int().nonnegative(),
});

const preferenceContextRowSchema = z.object({
 default_mode: conversationModeSchema,
 default_correction_style: correctionStyleSchema,
 default_reply_mode: replyModeSchema,
 learner_level: learnerLevelSchema,
});

const messageRpcResultSchema = z.union([
 messageRowSchema,
 z.tuple([messageRowSchema]).transform(([row]) => row),
]);

const DEFAULT_CHARACTER = {
 display_name: "小林",
 city: "上海",
 background: "在上海生活和工作的年轻人，熟悉普通话日常表达和当代城市生活。",
 personality: "自然、耐心、有分寸，会像朋友一样延续话题，而不是把每句话都变成课堂。",
 speaking_style: "以自然普通话交流；只有在学习者需要时才简短纠错或解释。",
 interests: ["日常生活", "电影", "文化", "城市生活", "语言交流"],
 identity_notes: "这是产品默认角色身份。用户本地保存的旧 memoryNotes 不会自动上传。",
};

const DEFAULT_CONVERSATION_PREFERENCES: z.output<typeof preferenceContextRowSchema> = {
 default_mode: "natural",
 default_correction_style: "balanced",
 default_reply_mode: "adaptive",
 learner_level: "intermediate",
};

export class AiConversationPersistenceNotReadyError extends Error {
 constructor() {
  super("AI conversation persistence schema is not ready");
  this.name = "AiConversationPersistenceNotReadyError";
 }
}

export class AiConversationPersistenceConfigurationError extends Error {
 constructor() {
  super("AI conversation persistence server secret is not configured");
  this.name = "AiConversationPersistenceConfigurationError";
 }
}

export class AiConversationPersistenceRequestError extends Error {
 readonly status: number;
 readonly code: string | null;

 constructor(status: number, code: string | null, message: string) {
  super(message);
  this.name = "AiConversationPersistenceRequestError";
  this.status = status;
  this.code = code;
 }
}

function buildRestUrl(resource: string, params?: Readonly<Record<string, string>>) {
 const url = new URL(`${publicSupabaseEnv.url}/rest/v1/${resource}`);
 for (const [key, value] of Object.entries(params ?? {})) {
  url.searchParams.set(key, value);
 }
 return url;
}

function buildServiceHeaders(secret: string, body: boolean, prefer?: string) {
 const isModernSecret = secret.startsWith("sb_secret_");
 return {
  Accept: "application/json",
  apikey: secret,
  ...(!isModernSecret ? { Authorization: `Bearer ${secret}` } : {}),
  ...(body ? { "Content-Type": "application/json" } : {}),
  ...(prefer ? { Prefer: prefer } : {}),
 };
}

function getPersistenceServerSecret() {
 try {
  return getSupabaseServerSecret();
 } catch {
  throw new AiConversationPersistenceConfigurationError();
 }
}

function isMissingPersistenceSchema(code: string | null, message: string) {
 if (code === "42P01" || code === "PGRST202" || code === "PGRST205") return true;

 const normalizedMessage = message.toLowerCase();
 return (
  normalizedMessage.includes("could not find the table 'public.ai_") ||
  normalizedMessage.includes('could not find the table "public.ai_') ||
  (normalizedMessage.includes('relation "public.ai_') &&
   normalizedMessage.includes("does not exist")) ||
  normalizedMessage.includes("could not find the function public.ai_append_message") ||
  normalizedMessage.includes("could not find the function ai_append_message")
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
 method?: "GET" | "POST" | "PATCH";
 body?: JsonObject;
 prefer?: string;
}): Promise<T> {
 const secret = getPersistenceServerSecret();
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
    : "AI conversation persistence request failed";

  if (isMissingPersistenceSchema(code, message)) {
   throw new AiConversationPersistenceNotReadyError();
  }

  throw new AiConversationPersistenceRequestError(response.status, code, message);
 }

 return schema.parse(payload);
}

function toPersistedMessage(row: z.output<typeof messageRowSchema>): AiConversationPersistedMessage {
 return {
  id: row.id,
  seq: row.seq,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
 };
}

function toCharacterPresentation(row: z.output<typeof characterContextRowSchema>) {
 return {
  id: row.id,
  displayName: row.display_name,
  city: row.city,
  interests: row.interests,
 };
}

function toSession(
 conversation: z.output<typeof conversationRowSchema> | null,
 character: z.output<typeof characterContextRowSchema> | null,
 learnerLevel: z.output<typeof learnerLevelSchema>,
 messages: z.output<typeof messageRowSchema>[],
): AiConversationSession {
 return {
  conversation: conversation
   ? {
      id: conversation.id,
      characterId: conversation.character_id,
      title: conversation.title,
      mode: conversation.mode,
      correctionStyle: conversation.correction_style,
      replyMode: conversation.reply_mode,
      memoryPolicy: conversation.memory_policy,
     }
   : null,
  character: character ? toCharacterPresentation(character) : null,
  learnerLevel,
  messages: messages.map(toPersistedMessage),
 };
}

async function findLatestConversation(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema),
  params: {
   select: "id,character_id,title,mode,correction_style,reply_mode,memory_policy",
   user_id: `eq.${userId}`,
   archived_at: "is.null",
   order: "last_message_at.desc.nullslast,created_at.desc",
   limit: "1",
  },
 });
 return rows[0] ?? null;
}

async function loadConversationPreferences(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_conversation_preferences",
  schema: z.array(preferenceContextRowSchema),
  params: {
   select: "default_mode,default_correction_style,default_reply_mode,learner_level",
   user_id: `eq.${userId}`,
   limit: "1",
  },
 });
 return rows[0] ?? DEFAULT_CONVERSATION_PREFERENCES;
}

async function findDefaultCharacterId(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_characters",
  schema: z.array(characterRowSchema),
  params: {
   select: "id",
   user_id: `eq.${userId}`,
   display_name: `eq.${DEFAULT_CHARACTER.display_name}`,
   archived_at: "is.null",
   order: "created_at.asc",
   limit: "1",
  },
 });
 return rows[0]?.id ?? null;
}

async function loadCharacter(userId: string, characterId: string) {
 const rows = await requestPostgrest({
  resource: "ai_characters",
  schema: z.array(characterContextRowSchema),
  params: {
   select:
    "id,display_name,city,age,background,personality,speaking_style,interests,identity_notes",
   user_id: `eq.${userId}`,
   id: `eq.${characterId}`,
   archived_at: "is.null",
   limit: "1",
  },
 });
 const character = rows[0];
 if (!character) {
  throw new AiConversationPersistenceRequestError(
   409,
   "AI_CHARACTER_NOT_FOUND",
   "AI character not found",
  );
 }
 return character;
}

async function createDefaultCharacter(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_characters",
  schema: z.array(characterRowSchema).min(1),
  method: "POST",
  body: { user_id: userId, ...DEFAULT_CHARACTER },
  prefer: "return=representation",
 });
 const character = rows[0];
 if (!character) {
  throw new Error("AI default character insert returned no row");
 }
 return character.id;
}

async function createConversation(
 userId: string,
 characterId: string,
 preferences: z.output<typeof preferenceContextRowSchema>,
) {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema).min(1),
  method: "POST",
  body: {
   user_id: userId,
   character_id: characterId,
   title: "",
   mode: preferences.default_mode,
   correction_style: preferences.default_correction_style,
   reply_mode: preferences.default_reply_mode,
   memory_policy: "inherit",
  },
  prefer: "return=representation",
 });
 const conversation = rows[0];
 if (!conversation) {
  throw new Error("AI conversation insert returned no row");
 }
 return conversation;
}

async function loadMessages(conversationId: string, userId: string, limit = 200) {
 const rows = await requestPostgrest({
  resource: "ai_messages",
  schema: z.array(messageRowSchema),
  params: {
   select: "id,seq,role,content,created_at",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   order: "seq.desc",
   limit: String(limit),
  },
 });
 return rows.reverse();
}

async function loadSessionForConversation({
 userId,
 conversation,
 preferences,
}: {
 userId: string;
 conversation: z.output<typeof conversationRowSchema>;
 preferences?: z.output<typeof preferenceContextRowSchema>;
}) {
 const [messages, character, resolvedPreferences] = await Promise.all([
  loadMessages(conversation.id, userId),
  loadCharacter(userId, conversation.character_id),
  preferences ? Promise.resolve(preferences) : loadConversationPreferences(userId),
 ]);
 return toSession(conversation, character, resolvedPreferences.learner_level, messages);
}

export async function loadLatestAiConversationSession(userId: string): Promise<AiConversationSession> {
 const [conversation, preferences] = await Promise.all([
  findLatestConversation(userId),
  loadConversationPreferences(userId),
 ]);
 if (!conversation) return toSession(null, null, preferences.learner_level, []);

 return loadSessionForConversation({ userId, conversation, preferences });
}

export async function ensureAiConversationSession(userId: string): Promise<AiConversationSession> {
 const [existing, preferences] = await Promise.all([
  findLatestConversation(userId),
  loadConversationPreferences(userId),
 ]);
 if (existing) {
  return loadSessionForConversation({ userId, conversation: existing, preferences });
 }

 const characterId = (await findDefaultCharacterId(userId)) ?? (await createDefaultCharacter(userId));
 const conversation = await createConversation(userId, characterId, preferences);
 return loadSessionForConversation({ userId, conversation, preferences });
}

export async function updateAiConversationSettings({
 userId,
 conversationId,
 settings,
}: {
 userId: string;
 conversationId: string;
 settings: AiConversationSettingsUpdate;
}): Promise<AiConversationSettings> {
 const conversations = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema),
  method: "PATCH",
  params: {
   select: "id,character_id,title,mode,correction_style,reply_mode,memory_policy",
   user_id: `eq.${userId}`,
   id: `eq.${conversationId}`,
   archived_at: "is.null",
  },
  body: {
   mode: settings.mode,
   correction_style: settings.correctionStyle,
   reply_mode: settings.replyMode,
   updated_at: new Date().toISOString(),
  },
  prefer: "return=representation",
 });
 const conversation = conversations[0];
 if (!conversation) {
  throw new AiConversationPersistenceRequestError(
   404,
   "AI_CONVERSATION_NOT_FOUND",
   "AI conversation not found",
  );
 }

 const preferences = await requestPostgrest({
  resource: "ai_conversation_preferences",
  schema: z.array(preferenceContextRowSchema).min(1),
  method: "POST",
  params: {
   select: "default_mode,default_correction_style,default_reply_mode,learner_level",
   on_conflict: "user_id",
  },
  body: {
   user_id: userId,
   learner_level: settings.learnerLevel,
   updated_at: new Date().toISOString(),
  },
  prefer: "resolution=merge-duplicates,return=representation",
 });
 const preference = preferences[0];
 if (!preference) {
  throw new Error("AI conversation preference upsert returned no row");
 }

 return {
  conversationId: conversation.id,
  characterId: conversation.character_id,
  mode: conversation.mode,
  correctionStyle: conversation.correction_style,
  replyMode: conversation.reply_mode,
  learnerLevel: preference.learner_level,
 };
}

export async function loadAiConversationContextState({
 userId,
 conversationId,
}: {
 userId: string;
 conversationId: string;
}): Promise<AiConversationContextState> {
 const conversations = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationContextRowSchema),
  params: {
   select:
    "id,character_id,title,mode,correction_style,reply_mode,memory_policy,summary,summary_until_seq",
   user_id: `eq.${userId}`,
   id: `eq.${conversationId}`,
   archived_at: "is.null",
   limit: "1",
  },
 });
 const conversation = conversations[0];
 if (!conversation) {
  throw new AiConversationPersistenceRequestError(
   404,
   "AI_CONVERSATION_NOT_FOUND",
   "AI conversation not found",
  );
 }

 const [character, relationships, preferences] = await Promise.all([
  loadCharacter(userId, conversation.character_id),
  requestPostgrest({
   resource: "ai_relationship_states",
   schema: z.array(relationshipContextRowSchema),
   params: {
    select: "nickname,familiarity_score,revision",
    user_id: `eq.${userId}`,
    character_id: `eq.${conversation.character_id}`,
    limit: "1",
   },
  }),
  loadConversationPreferences(userId),
 ]);
 const relationship = relationships[0] ?? null;

 return {
  conversation: {
   id: conversation.id,
   characterId: conversation.character_id,
   mode: conversation.mode,
   correctionStyle: conversation.correction_style,
   replyMode: conversation.reply_mode,
   memoryPolicy: conversation.memory_policy,
   summary: conversation.summary,
   summaryUntilSeq: conversation.summary_until_seq,
  },
  character: {
   id: character.id,
   displayName: character.display_name,
   city: character.city,
   age: character.age,
   background: character.background,
   personality: character.personality,
   speakingStyle: character.speaking_style,
   interests: character.interests,
   identityNotes: character.identity_notes,
  },
  relationship: relationship
   ? {
      nickname: relationship.nickname,
      familiarityScore: relationship.familiarity_score,
      revision: relationship.revision,
     }
   : null,
  learnerLevel: preferences.learner_level,
 };
}

export async function appendAiConversationMessage({
 userId,
 conversationId,
 role,
 content,
 clientMessageId,
 replyToMessageId,
 metadata,
}: {
 userId: string;
 conversationId: string;
 role: "user" | "assistant";
 content: string;
 clientMessageId?: string;
 replyToMessageId?: string;
 metadata?: JsonObject;
}): Promise<AiConversationPersistedMessage> {
 const row = await requestPostgrest({
  resource: "rpc/ai_append_message",
  schema: messageRpcResultSchema,
  method: "POST",
  body: {
   p_user_id: userId,
   p_conversation_id: conversationId,
   p_role: role,
   p_content: content,
   p_client_message_id: clientMessageId ?? null,
   p_reply_to_message_id: replyToMessageId ?? null,
   p_metadata: metadata ?? {},
  },
 });
 return toPersistedMessage(row);
}

export async function findAssistantReplyForUserMessage({
 userId,
 conversationId,
 userMessageId,
}: {
 userId: string;
 conversationId: string;
 userMessageId: string;
}): Promise<{
 message: AiConversationPersistedMessage;
 provider: string;
 model: string;
 apiKeyId: string | null;
} | null> {
 const rows = await requestPostgrest({
  resource: "ai_messages",
  schema: z.array(assistantReplyRowSchema),
  params: {
   select: "id,seq,role,content,created_at,metadata",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   role: "eq.assistant",
   reply_to_message_id: `eq.${userMessageId}`,
   limit: "1",
  },
 });
 const row = rows[0];
 if (!row) return null;
 return {
  message: toPersistedMessage(row),
  provider: row.metadata.provider,
  model: row.metadata.model,
  apiKeyId: row.metadata.apiKeyId,
 };
}

export async function loadRecentAiConversationMessages({
 userId,
 conversationId,
 limit,
}: {
 userId: string;
 conversationId: string;
 limit: number;
}): Promise<AiConversationPersistedMessage[]> {
 const rows = await requestPostgrest({
  resource: "ai_messages",
  schema: z.array(messageRowSchema),
  params: {
   select: "id,seq,role,content,created_at",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   order: "seq.desc",
   limit: String(limit),
  },
 });
 return rows.reverse().map(toPersistedMessage);
}
