import { parseErrorLike, type ErrorInput } from "@/types/error";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { getApiKeyProviderLabel, getMaskedApiKey } from "@/lib/api-key-providers";
import { decryptApiKey, encryptApiKey } from "@/lib/encryption";
import { DbUserApiKeySchema, type DbUserApiKey } from "@/types/database";
import type { Database, TablesUpdate } from "@/types/supabase.generated";
import { z } from "zod";

type AppSupabaseClient = SupabaseClient<Database>;

const SupabaseErrorLikeSchema = z.object({
 code: z.string().nullable().optional(),
 message: z.string().nullable().optional(),
 details: z.string().nullable().optional(),
 hint: z.string().nullable().optional(),
});

export type UserApiKey = {
 id: DbUserApiKey["id"];
 userId: DbUserApiKey["user_id"];
 provider: DbUserApiKey["provider"];
 label: DbUserApiKey["label"];
 maskedKey: DbUserApiKey["masked_key"];
 isActive: DbUserApiKey["is_active"];
 priority: DbUserApiKey["priority"];
 defaultModel: DbUserApiKey["default_model"];
 lastValidatedAt: DbUserApiKey["last_validated_at"];
 createdAt: DbUserApiKey["created_at"];
 updatedAt: DbUserApiKey["updated_at"];
};

export type UserApiKeyCredential = z.infer<
 z.ZodObject<{
  id: z.ZodType<UserApiKey["id"]>;
  userId: z.ZodType<UserApiKey["userId"]>;
  provider: z.ZodType<UserApiKey["provider"]>;
  label: z.ZodType<UserApiKey["label"]>;
  maskedKey: z.ZodType<UserApiKey["maskedKey"]>;
  isActive: z.ZodType<UserApiKey["isActive"]>;
  priority: z.ZodType<UserApiKey["priority"]>;
  defaultModel: z.ZodType<UserApiKey["defaultModel"]>;
  lastValidatedAt: z.ZodType<UserApiKey["lastValidatedAt"]>;
  createdAt: z.ZodType<UserApiKey["createdAt"]>;
  updatedAt: z.ZodType<UserApiKey["updatedAt"]>;
  apiKey: z.ZodString;
 }>
>;

export type CreateUserApiKeyResult = z.infer<
 z.ZodObject<{
  key: z.ZodNullable<z.ZodType<UserApiKey>>;
  error: z.ZodNullable<z.ZodString>;
 }>
>;

export type UserApiKeysSchemaStatus = z.infer<
 z.ZodObject<{
  ready: z.ZodBoolean;
  reason: z.ZodEnum<{
   ok: "ok";
   "missing-table": "missing-table";
   "schema-error": "schema-error";
  }>;
  message: z.ZodNullable<z.ZodString>;
 }>
>;

const MoveDirectionSchema = z.enum(["up", "down"]);

type CreateUserApiKeyInput = z.infer<
 z.ZodObject<{
  provider: typeof DbUserApiKeySchema.shape.provider;
  apiKey: z.ZodString;
  label: z.ZodOptional<z.ZodString>;
  defaultModel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
 }>
>;

type UpdateUserApiKeyInput = z.infer<
 z.ZodObject<{
  label: z.ZodOptional<z.ZodString>;
  isActive: z.ZodOptional<z.ZodBoolean>;
  defaultModel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
 }>
>;

function normalizeUserApiKey(row: DbUserApiKey): UserApiKey {
 return {
  id: row.id,
  userId: row.user_id,
  provider: row.provider,
  label: row.label,
  maskedKey: row.masked_key,
  isActive: row.is_active,
  priority: row.priority,
  defaultModel: row.default_model,
  lastValidatedAt: row.last_validated_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
 };
}

function sortRuntimeCredentials(keys: UserApiKeyCredential[]): UserApiKeyCredential[] {
 return [...keys].sort((left, right) => {
  if (left.priority !== right.priority) {
   return left.priority - right.priority;
  }

  return left.createdAt.localeCompare(right.createdAt);
 });
}

function getUserApiKeysSchemaStatusFromError(error: ErrorInput): UserApiKeysSchemaStatus {
 const { code, message } = parseErrorLike(error);
 const normalizedMessage = message.toLowerCase();

 if (
  code === "42P01" ||
  code === "PGRST205" ||
  normalizedMessage.includes('relation "user_api_keys" does not exist') ||
  normalizedMessage.includes('relation "public.user_api_keys" does not exist') ||
  normalizedMessage.includes("could not find the table 'public.user_api_keys'") ||
  normalizedMessage.includes('could not find the table "public.user_api_keys"')
 ) {
  return {
   ready: false,
   reason: "missing-table",
   message:
    "Database chưa có bảng user_api_keys. Cần apply migration mới trước khi dùng API Key Manager.",
  };
 }

 if (code === "42703") {
  return {
   ready: false,
   reason: "schema-error",
   message:
    "Bảng user_api_keys đã có nhưng đang thiếu column hoặc đang ở version schema cũ. Hãy chạy migration repair mới.",
  };
 }

 if (code === "42501") {
  return {
   ready: false,
   reason: "schema-error",
   message:
    "Bảng user_api_keys có thể đã tồn tại nhưng đang thiếu policy hoặc quyền truy cập phù hợp.",
  };
 }

 return {
  ready: false,
  reason: "schema-error",
  message: message || "user_api_keys đang ở trạng thái schema không hợp lệ.",
 };
}

function formatApiKeyStorageError(error: ErrorInput): string {
 const parsed = SupabaseErrorLikeSchema.safeParse(error);
 if (!parsed.success) {
  return "Không xác định được lỗi lưu API key.";
 }

 if (parsed.data.code === "23503") {
  return "Database đang dùng ràng buộc user_api_keys cũ hoặc thiếu bản ghi user profile. Hãy chạy migration repair mới cho user_api_keys rồi thử lại.";
 }

 if (parsed.data.code === "42501") {
  return "Database chưa có đủ RLS policy cho user_api_keys. Hãy apply lại migration mới rồi thử lại.";
 }

 if (parsed.data.code === "23505") {
  return "API key này đã tồn tại hoặc đang trùng với dữ liệu hiện có.";
 }

 return parsed.data.message || "Không lưu được API key.";
}

async function listUserApiKeysRaw(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<{ data: DbUserApiKey[]; schemaStatus: UserApiKeysSchemaStatus }> {
 const { data, error } = await supabase
  .from("user_api_keys")
  .select(
   "id, user_id, provider, label, masked_key, encrypted_key, is_active, priority, default_model, last_validated_at, created_at, updated_at",
  )
  .eq("user_id", userId)
  .order("priority", { ascending: true })
  .order("created_at", { ascending: true });

 if (error || !data) {
  if (error) {
   logger.error("[ApiKeys] list error:", error);
  }
  return {
   data: [],
   schemaStatus: getUserApiKeysSchemaStatusFromError(error),
  };
 }

 return {
  data: DbUserApiKeySchema.array().parse(data),
  schemaStatus: {
   ready: true,
   reason: "ok",
   message: null,
  },
 };
}

export async function getUserApiKeysSchemaStatus(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<UserApiKeysSchemaStatus> {
 const result = await listUserApiKeysRaw(supabase, userId);
 return result.schemaStatus;
}

export async function isUserApiKeysSchemaReady(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<boolean> {
 const result = await getUserApiKeysSchemaStatus(supabase, userId);
 return result.ready;
}

async function migrateLegacyDeepSeekKeyForUser(
 supabase: AppSupabaseClient,
 userId: string,
 existingKeys: DbUserApiKey[],
): Promise<boolean> {
 const { data: legacyRow, error } = await supabase
  .from("user_ai_prompt_settings")
  .select("user_id, deepseek_api_key_encrypted, deepseek_enabled, created_at, updated_at")
  .eq("user_id", userId)
  .maybeSingle();

 if (error || !legacyRow?.deepseek_api_key_encrypted) {
  if (error) {
   logger.error("[ApiKeys] legacy lookup error:", error);
  }
  return false;
 }

 if (existingKeys.some((key) => key.provider === "deepseek")) {
  return false;
 }

 try {
  const decryptedKey = decryptApiKey(legacyRow.deepseek_api_key_encrypted);
  const { error: insertError } = await supabase.from("user_api_keys").insert({
   user_id: userId,
   provider: "deepseek",
   label: "DeepSeek Key (Migrated)",
   masked_key: getMaskedApiKey(decryptedKey),
   encrypted_key: legacyRow.deepseek_api_key_encrypted,
   is_active: legacyRow.deepseek_enabled ?? true,
   priority: existingKeys.length + 1,
   default_model: "deepseek-v4-flash",
   last_validated_at: legacyRow.updated_at,
   created_at: legacyRow.created_at,
   updated_at: legacyRow.updated_at,
  });

  if (insertError) {
   logger.error("[ApiKeys] legacy migration insert error:", insertError);
   return false;
  }

  return true;
 } catch (migrationError) {
  logger.error("[ApiKeys] legacy migration decrypt error:", migrationError);
  return false;
 }
}

export async function listUserApiKeys(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<UserApiKey[]> {
 const initial = await listUserApiKeysRaw(supabase, userId);
 if (!initial.schemaStatus.ready) {
  return [];
 }

 if (initial.data.length === 0) {
  const migrated = await migrateLegacyDeepSeekKeyForUser(supabase, userId, initial.data);

  if (migrated) {
   const afterMigration = await listUserApiKeysRaw(supabase, userId);
   return afterMigration.data.map(normalizeUserApiKey);
  }
 }

 return initial.data.map(normalizeUserApiKey);
}

export async function getActiveUserApiKeyCredentials(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<UserApiKeyCredential[]> {
 const existingKeys = await listUserApiKeys(supabase, userId);
 if (existingKeys.length === 0) {
  return [];
 }

 const { data, error } = await supabase
  .from("user_api_keys")
  .select(
   "id, user_id, provider, label, masked_key, encrypted_key, is_active, priority, default_model, last_validated_at, created_at, updated_at",
  )
  .eq("user_id", userId)
  .eq("is_active", true)
  .order("priority", { ascending: true })
  .order("created_at", { ascending: true });

 if (error || !data) {
  if (error) {
   logger.error("[ApiKeys] credential list error:", error);
  }
  return [];
 }

 const credentials = DbUserApiKeySchema.array()
  .parse(data)
  .map((row) => {
   try {
    return {
     ...normalizeUserApiKey(row),
     apiKey: decryptApiKey(row.encrypted_key),
    };
   } catch (err) {
    logger.error("[ApiKeys] decrypt failed:", err);
    return null;
   }
  })
  .filter((item): item is UserApiKeyCredential => !!item);

 return sortRuntimeCredentials(credentials);
}

export async function createUserApiKey(
 supabase: AppSupabaseClient,
 userId: string,
 input: CreateUserApiKeyInput,
): Promise<CreateUserApiKeyResult> {
 if (!(await isUserApiKeysSchemaReady(supabase, userId))) {
  return {
   key: null,
   error: "Database chưa có bảng user_api_keys. Hãy apply migration mới trước khi thêm API key.",
  };
 }

 const existing = await listUserApiKeys(supabase, userId);
 const resolvedLabel =
  input.label?.trim() || `${getApiKeyProviderLabel(input.provider)} Key ${existing.length + 1}`;

 let encryptedKey: string;
 try {
  encryptedKey = encryptApiKey(input.apiKey);
 } catch (encryptionError) {
  logger.error("[ApiKeys] encryption configuration error:", encryptionError);
  return {
   key: null,
   error:
    "Kho lưu API key an toàn chưa được cấu hình trên server. Hãy cấu hình BYOK_ENCRYPTION_SECRET hoặc Supabase server secret rồi thử lại.",
  };
 }

 const { data, error } = await supabase
  .from("user_api_keys")
  .insert({
   user_id: userId,
   provider: input.provider,
   label: resolvedLabel,
   masked_key: getMaskedApiKey(input.apiKey),
   encrypted_key: encryptedKey,
   is_active: true,
   priority: input.provider === "groq" ? 0 : existing.length + 1,
   default_model: input.defaultModel || null,
   last_validated_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
  })
  .select(
   "id, user_id, provider, label, masked_key, encrypted_key, is_active, priority, default_model, last_validated_at, created_at, updated_at",
  )
  .single();

 if (error || !data) {
  logger.error("[ApiKeys] create error:", error);
  return {
   key: null,
   error: formatApiKeyStorageError(error),
  };
 }

 return {
  key: normalizeUserApiKey(DbUserApiKeySchema.parse(data)),
  error: null,
 };
}

export async function updateUserApiKey(
 supabase: AppSupabaseClient,
 userId: string,
 keyId: string,
 patch: UpdateUserApiKeyInput,
): Promise<z.infer<z.ZodNullable<z.ZodType<UserApiKey>>>> {
 if (!(await isUserApiKeysSchemaReady(supabase, userId))) {
  return null;
 }

 const payload: TablesUpdate<"user_api_keys"> = {
  updated_at: new Date().toISOString(),
 };

 if (typeof patch.label === "string") {
  payload.label = patch.label.trim() || "Untitled key";
 }

 if (typeof patch.isActive === "boolean") {
  payload.is_active = patch.isActive;
 }

 if (patch.defaultModel !== undefined) {
  payload.default_model = patch.defaultModel;
 }

 const { data, error } = await supabase
  .from("user_api_keys")
  .update(payload)
  .eq("id", keyId)
  .eq("user_id", userId)
  .select(
   "id, user_id, provider, label, masked_key, encrypted_key, is_active, priority, default_model, last_validated_at, created_at, updated_at",
  )
  .single();

 if (error || !data) {
  logger.error("[ApiKeys] update error:", error);
  return null;
 }

 return normalizeUserApiKey(DbUserApiKeySchema.parse(data));
}

export async function deleteUserApiKey(
 supabase: AppSupabaseClient,
 userId: string,
 keyId: string,
): Promise<boolean> {
 if (!(await isUserApiKeysSchemaReady(supabase, userId))) {
  return false;
 }

 const { error } = await supabase
  .from("user_api_keys")
  .delete()
  .eq("id", keyId)
  .eq("user_id", userId);

 if (error) {
  logger.error("[ApiKeys] delete error:", error);
  return false;
 }

 await resequenceUserApiKeys(supabase, userId);
 return true;
}

export async function moveUserApiKey(
 supabase: AppSupabaseClient,
 userId: string,
 keyId: string,
 direction: z.infer<typeof MoveDirectionSchema>,
): Promise<z.infer<z.ZodNullable<z.ZodArray<z.ZodType<UserApiKey>>>>> {
 if (!(await isUserApiKeysSchemaReady(supabase, userId))) {
  return null;
 }

 const keys = await resequenceUserApiKeys(supabase, userId);
 const index = keys.findIndex((key) => key.id === keyId);
 if (index === -1) {
  return null;
 }

 const targetIndex = direction === MoveDirectionSchema.enum.up ? index - 1 : index + 1;
 if (targetIndex < 0 || targetIndex >= keys.length) {
  return keys;
 }

 const current = keys[index];
 const target = keys[targetIndex];

 const currentUpdate = await supabase
  .from("user_api_keys")
  .update({ priority: target.priority, updated_at: new Date().toISOString() })
  .eq("id", current.id)
  .eq("user_id", userId);

 const targetUpdate = await supabase
  .from("user_api_keys")
  .update({ priority: current.priority, updated_at: new Date().toISOString() })
  .eq("id", target.id)
  .eq("user_id", userId);

 if (currentUpdate.error || targetUpdate.error) {
  logger.error("[ApiKeys] reorder error:", currentUpdate.error || targetUpdate.error);
  return null;
 }

 return resequenceUserApiKeys(supabase, userId);
}

export async function resequenceUserApiKeys(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<UserApiKey[]> {
 const keys = await listUserApiKeys(supabase, userId);

 for (let index = 0; index < keys.length; index += 1) {
  const expectedPriority = index + 1;
  if (keys[index].priority === expectedPriority) {
   continue;
  }

  const { error } = await supabase
   .from("user_api_keys")
   .update({
    priority: expectedPriority,
    updated_at: new Date().toISOString(),
   })
   .eq("id", keys[index].id)
   .eq("user_id", userId);

  if (error) {
   logger.error("[ApiKeys] resequence error:", error);
   return keys;
  }
 }

 return listUserApiKeys(supabase, userId);
}
