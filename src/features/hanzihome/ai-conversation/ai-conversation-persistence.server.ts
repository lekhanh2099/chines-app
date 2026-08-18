import "server-only";

import { z } from "zod";

import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";

import type {
 AiConversationPersistedMessage,
 AiConversationSession,
} from "./ai-conversation-session.schemas";

const postgrestErrorSchema = z.object({
 code: z.string().optional(),
 message: z.string().optional(),
 details: z.string().nullable().optional(),
 hint: z.string().nullable().optional(),
});

const conversationRowSchema = z.object({
 id: z.uuid(),
 character_id: z.uuid(),
 title: z.string(),
 mode: z.enum(["natural", "speaking-practice", "grammar-coach", "hskk-practice"]),
 correction_style: z.enum(["light", "balanced", "strict"]),
 reply_mode: z.enum(["adaptive", "chinese", "bilingual"]),
 memory_policy: z.enum(["inherit", "enabled", "disabled"]),
});

const messageRowSchema = z.object({
 id: z.uuid(),
 seq: z.number().int().positive(),
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
 created_at: z.iso.datetime(),
});

const characterRowSchema = z.object({ id: z.uuid() });

const messageRpcResultSchema = z.union([
 messageRowSchema,
 z.array(messageRowSchema).length(1).transform((rows) => rows[0]),
]);

const DEFAULT_CHARACTER = {
 display_name: "小林",
 city: "上海",
 background: "在上海生活和工作的年轻人，熟悉普通话日常表达和当代城市生活。",
 personality: "自然、耐心、有分寸，会像朋友一样延续话题，而不是把每句话都变成课堂。",
 speaking_style: "以自然普通话交流；只有在学习者需要时才简短纠错或解释。",
 interests: ["日常生活", "电影", "文化", "城市生活", "语言交流"],
 identity_notes: "这是产品默认角色身份。用户本地保存的旧 memoryNotes 不会自动上传。",
} as const;

export class AiConversationPersistenceNotReadyError extends Error {
 constructor() {
  super("AI conversation persistence schema is not ready");
  this.name = "AiConversationPersistenceNotReadyError";
 }
}

class AiConversationPersistenceRequestError extends Error {
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
 method?: "GET" | "POST";
 body?: Readonly<Record<string, unknown>>;
 prefer?: string;
}): Promise<T> {
 const secret = getSupabaseServerSecret();
 const response = await fetch(buildRestUrl(resource, params), {
  method,
  headers: {
   Accept: "application/json",
   apikey: secret,
   Authorization: `Bearer ${secret}`,
   ...(body ? { "Content-Type": "application/json" } : {}),
   ...(prefer ? { Prefer: prefer } : {}),
  },
  ...(body ? { body: JSON.stringify(body) } : {}),
  cache: "no-store",
 });
 const payload: unknown = await response.json().catch(() => null);

 if (!response.ok) {
  const parsedError = postgrestErrorSchema.safeParse(payload);
  const code = parsedError.success ? parsedError.data.code ?? null : null;
  if (code === "42P01" || code === "PGRST202" || code === "PGRST205") {
   throw new AiConversationPersistenceNotReadyError();
  }

  throw new AiConversationPersistenceRequestError(
   response.status,
   code,
   parsedError.success && parsedError.data.message
    ? parsedError.data.message
    : "AI conversation persistence request failed",
  );
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

function toSession(
 conversation: z.output<typeof conversationRowSchema> | null,
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

async function createConversation(userId: string, characterId: string) {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema).min(1),
  method: "POST",
  body: {
   user_id: userId,
   character_id: characterId,
   title: "",
   mode: "natural",
   correction_style: "balanced",
   reply_mode: "adaptive",
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
 return requestPostgrest({
  resource: "ai_messages",
  schema: z.array(messageRowSchema),
  params: {
   select: "id,seq,role,content,created_at",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   order: "seq.asc",
   limit: String(limit),
  },
 });
}

export async function loadLatestAiConversationSession(userId: string): Promise<AiConversationSession> {
 const conversation = await findLatestConversation(userId);
 if (!conversation) return toSession(null, []);

 const messages = await loadMessages(conversation.id, userId);
 return toSession(conversation, messages);
}

export async function ensureAiConversationSession(userId: string): Promise<AiConversationSession> {
 const existing = await findLatestConversation(userId);
 if (existing) {
  const messages = await loadMessages(existing.id, userId);
  return toSession(existing, messages);
 }

 const characterId = (await findDefaultCharacterId(userId)) ?? (await createDefaultCharacter(userId));
 const conversation = await createConversation(userId, characterId);
 return toSession(conversation, []);
}

export async function appendAiConversationMessage({
 userId,
 conversationId,
 role,
 content,
 clientMessageId,
 replyToMessageId,
}: {
 userId: string;
 conversationId: string;
 role: "user" | "assistant";
 content: string;
 clientMessageId?: string;
 replyToMessageId?: string;
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
   p_metadata: {},
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
}): Promise<AiConversationPersistedMessage | null> {
 const rows = await requestPostgrest({
  resource: "ai_messages",
  schema: z.array(messageRowSchema),
  params: {
   select: "id,seq,role,content,created_at",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   role: "eq.assistant",
   reply_to_message_id: `eq.${userMessageId}`,
   limit: "1",
  },
 });
 return rows[0] ? toPersistedMessage(rows[0]) : null;
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
