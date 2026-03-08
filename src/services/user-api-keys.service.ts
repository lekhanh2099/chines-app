import type { SupabaseClient } from "@supabase/supabase-js";
import {
 getApiKeyProviderLabel,
 getMaskedApiKey,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import { decryptApiKey, encryptApiKey } from "@/lib/encryption";
import type { DbUserApiKey } from "@/types/database";

type SupabaseErrorLike = {
 code?: string | null;
 message?: string | null;
 details?: string | null;
 hint?: string | null;
};

export type UserApiKey = {
 id: string;
 userId: string;
 provider: ApiKeyProvider;
 label: string;
 maskedKey: string;
 isActive: boolean;
 priority: number;
 defaultModel: string | null;
 lastValidatedAt: string | null;
 createdAt: string;
 updatedAt: string;
};

export type UserApiKeyCredential = UserApiKey & {
 apiKey: string;
};

export type CreateUserApiKeyResult = {
 key: UserApiKey | null;
 error: string | null;
};

export type UserApiKeysSchemaStatus = {
 ready: boolean;
 reason: "ok" | "missing-table" | "schema-error";
 message: string | null;
};

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

function sortRuntimeCredentials(
 keys: UserApiKeyCredential[],
): UserApiKeyCredential[] {
 return [...keys].sort((left, right) => {
  if (left.priority !== right.priority) {
   return left.priority - right.priority;
  }

  return left.createdAt.localeCompare(right.createdAt);
 });
}

function getUserApiKeysSchemaStatusFromError(
 error: unknown,
): UserApiKeysSchemaStatus {
 const code =
  typeof error === "object" && error !== null && "code" in error
   ? String((error as { code?: unknown }).code || "")
   : "";
 const message =
  typeof error === "object" && error !== null && "message" in error
   ? String((error as { message?: unknown }).message || "")
   : "";
 const normalizedMessage = message.toLowerCase();

 if (
  code === "42P01" ||
  code === "PGRST205" ||
  normalizedMessage.includes('relation "user_api_keys" does not exist') ||
  normalizedMessage.includes(
   'relation "public.user_api_keys" does not exist',
  ) ||
  normalizedMessage.includes(
   "could not find the table 'public.user_api_keys'",
  ) ||
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

function formatApiKeyStorageError(
 error: SupabaseErrorLike | null | undefined,
): string {
 if (!error) {
  return "Không xác định được lỗi lưu API key.";
 }

 if (error.code === "23503") {
  return "Database đang dùng ràng buộc user_api_keys cũ hoặc thiếu bản ghi user profile. Hãy chạy migration repair mới cho user_api_keys rồi thử lại.";
 }

 if (error.code === "42501") {
  return "Database chưa có đủ RLS policy cho user_api_keys. Hãy apply lại migration mới rồi thử lại.";
 }

 if (error.code === "23505") {
  return "API key này đã tồn tại hoặc đang trùng với dữ liệu hiện có.";
 }

 return error.message || "Không lưu được API key.";
}

async function listUserApiKeysRaw(
 supabase: SupabaseClient,
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
   console.error("[ApiKeys] list error:", error);
  }
  return {
   data: [],
   schemaStatus: getUserApiKeysSchemaStatusFromError(error),
  };
 }

 return {
  data: data as DbUserApiKey[],
  schemaStatus: {
   ready: true,
   reason: "ok",
   message: null,
  },
 };
}

export async function getUserApiKeysSchemaStatus(
 supabase: SupabaseClient,
 userId: string,
): Promise<UserApiKeysSchemaStatus> {
 const result = await listUserApiKeysRaw(supabase, userId);
 return result.schemaStatus;
}

export async function isUserApiKeysSchemaReady(
 supabase: SupabaseClient,
 userId: string,
): Promise<boolean> {
 const result = await getUserApiKeysSchemaStatus(supabase, userId);
 return result.ready;
}

async function migrateLegacyDeepSeekKeyForUser(
 supabase: SupabaseClient,
 userId: string,
 existingKeys: DbUserApiKey[],
): Promise<boolean> {
 const { data: legacyRow, error } = await supabase
  .from("user_ai_prompt_settings")
  .select(
   "user_id, deepseek_api_key_encrypted, deepseek_enabled, created_at, updated_at",
  )
  .eq("user_id", userId)
  .maybeSingle();

 if (error || !legacyRow?.deepseek_api_key_encrypted) {
  if (error) {
   console.error("[ApiKeys] legacy lookup error:", error);
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
   default_model: "deepseek-chat",
   last_validated_at: legacyRow.updated_at,
   created_at: legacyRow.created_at,
   updated_at: legacyRow.updated_at,
  });

  if (insertError) {
   console.error("[ApiKeys] legacy migration insert error:", insertError);
   return false;
  }

  return true;
 } catch (migrationError) {
  console.error("[ApiKeys] legacy migration decrypt error:", migrationError);
  return false;
 }
}

export async function listUserApiKeys(
 supabase: SupabaseClient,
 userId: string,
): Promise<UserApiKey[]> {
 const initial = await listUserApiKeysRaw(supabase, userId);
 if (!initial.schemaStatus.ready) {
  return [];
 }

 if (initial.data.length === 0) {
  const migrated = await migrateLegacyDeepSeekKeyForUser(
   supabase,
   userId,
   initial.data,
  );

  if (migrated) {
   const afterMigration = await listUserApiKeysRaw(supabase, userId);
   return afterMigration.data.map(normalizeUserApiKey);
  }
 }

 return initial.data.map(normalizeUserApiKey);
}

export async function getActiveUserApiKeyCredentials(
 supabase: SupabaseClient,
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
   console.error("[ApiKeys] credential list error:", error);
  }
  return [];
 }

 const credentials = (data as DbUserApiKey[])
  .map((row) => {
   try {
    return {
     ...normalizeUserApiKey(row),
     apiKey: decryptApiKey(row.encrypted_key),
    };
   } catch (err) {
    console.error("[ApiKeys] decrypt failed:", err);
    return null;
   }
  })
  .filter((item): item is UserApiKeyCredential => !!item);

 return sortRuntimeCredentials(credentials);
}

export async function createUserApiKey(
 supabase: SupabaseClient,
 userId: string,
 input: {
  provider: ApiKeyProvider;
  apiKey: string;
  label?: string;
  defaultModel?: string | null;
 },
): Promise<CreateUserApiKeyResult> {
 if (!(await isUserApiKeysSchemaReady(supabase, userId))) {
  return {
   key: null,
   error:
    "Database chưa có bảng user_api_keys. Hãy apply migration mới trước khi thêm API key.",
  };
 }

 const existing = await listUserApiKeys(supabase, userId);
 const resolvedLabel =
  input.label?.trim() ||
  `${getApiKeyProviderLabel(input.provider)} Key ${existing.length + 1}`;

 const { data, error } = await supabase
  .from("user_api_keys")
  .insert({
   user_id: userId,
   provider: input.provider,
   label: resolvedLabel,
   masked_key: getMaskedApiKey(input.apiKey),
   encrypted_key: encryptApiKey(input.apiKey),
   is_active: true,
   priority: existing.length + 1,
   default_model: input.defaultModel || null,
   last_validated_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
  })
  .select(
   "id, user_id, provider, label, masked_key, is_active, priority, default_model, last_validated_at, created_at, updated_at",
  )
  .single();

 if (error || !data) {
  console.error("[ApiKeys] create error:", error);
  return {
   key: null,
   error: formatApiKeyStorageError(error as SupabaseErrorLike | null),
  };
 }

 return {
  key: normalizeUserApiKey(data as DbUserApiKey),
  error: null,
 };
}

export async function updateUserApiKey(
 supabase: SupabaseClient,
 userId: string,
 keyId: string,
 patch: {
  label?: string;
  isActive?: boolean;
  defaultModel?: string | null;
 },
): Promise<UserApiKey | null> {
 if (!(await isUserApiKeysSchemaReady(supabase, userId))) {
  return null;
 }

 const payload: Record<string, unknown> = {
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
   "id, user_id, provider, label, masked_key, is_active, priority, default_model, last_validated_at, created_at, updated_at",
  )
  .single();

 if (error || !data) {
  console.error("[ApiKeys] update error:", error);
  return null;
 }

 return normalizeUserApiKey(data as DbUserApiKey);
}

export async function deleteUserApiKey(
 supabase: SupabaseClient,
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
  console.error("[ApiKeys] delete error:", error);
  return false;
 }

 await resequenceUserApiKeys(supabase, userId);
 return true;
}

export async function moveUserApiKey(
 supabase: SupabaseClient,
 userId: string,
 keyId: string,
 direction: "up" | "down",
): Promise<UserApiKey[] | null> {
 if (!(await isUserApiKeysSchemaReady(supabase, userId))) {
  return null;
 }

 const keys = await resequenceUserApiKeys(supabase, userId);
 const index = keys.findIndex((key) => key.id === keyId);
 if (index === -1) {
  return null;
 }

 const targetIndex = direction === "up" ? index - 1 : index + 1;
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
  console.error(
   "[ApiKeys] reorder error:",
   currentUpdate.error || targetUpdate.error,
  );
  return null;
 }

 return resequenceUserApiKeys(supabase, userId);
}

export async function resequenceUserApiKeys(
 supabase: SupabaseClient,
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
   console.error("[ApiKeys] resequence error:", error);
   return keys;
  }
 }

 return listUserApiKeys(supabase, userId);
}
