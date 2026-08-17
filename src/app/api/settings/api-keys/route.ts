import type { JsonFieldValue } from "@/types/json";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
 discoverApiKeyModels,
 type ApiKeyProviderSelection,
} from "@/features/settings/api-key-discovery.server";
import { isApiKeyModelSupported } from "@/lib/api-key-models";
import {
 AUTO_API_KEY_PROVIDER,
 ApiKeyProviderSchema,
 getApiKeyProviderLabel,
} from "@/lib/api-key-providers";
import { createClient } from "@/lib/supabase/server";
import {
 createUserApiKey,
 deleteUserApiKey,
 getUserApiKeysSchemaStatus,
 isUserApiKeysSchemaReady,
 listUserApiKeys,
 moveUserApiKey,
 updateUserApiKey,
} from "@/services/user-api-keys.service";

const RequestedProviderSchema = z.union([
 z.literal(AUTO_API_KEY_PROVIDER),
 ApiKeyProviderSchema,
]);

const discoverKeySchema = z.strictObject({
 action: z.literal("discover"),
 apiKey: z.string().trim().min(1).max(400),
 provider: RequestedProviderSchema.default(AUTO_API_KEY_PROVIDER),
});

const addKeySchema = z.strictObject({
 apiKey: z.string().trim().min(1).max(400),
 label: z.string().trim().max(80).optional(),
 provider: RequestedProviderSchema.optional(),
 model: z.string().trim().min(1).max(200).optional(),
});

const patchSchema = z.discriminatedUnion("action", [
 z.strictObject({
  action: z.literal("toggle"),
  keyId: z.uuid(),
  isActive: z.boolean(),
 }),
 z.strictObject({
  action: z.literal("rename"),
  keyId: z.uuid(),
  label: z.string().trim().min(1).max(80),
 }),
 z.strictObject({
  action: z.literal("move"),
  keyId: z.uuid(),
  direction: z.enum(["up", "down"]),
 }),
 z.strictObject({
  action: z.literal("model"),
  keyId: z.uuid(),
  model: z.string().trim().min(1).max(200),
 }),
]);

const deleteSchema = z.strictObject({
 keyId: z.uuid(),
});

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const schemaStatus = await getUserApiKeysSchemaStatus(supabase, user.id);
 const keys = schemaStatus.ready ? await listUserApiKeys(supabase, user.id) : [];
 const summary = {
  total: keys.length,
  active: keys.filter((key) => key.isActive).length,
  groq: keys.filter((key) => key.provider === "groq").length,
  deepseek: keys.filter((key) => key.provider === "deepseek").length,
  gemini: keys.filter((key) => key.provider === "gemini").length,
  openai: keys.filter((key) => key.provider === "openai").length,
 };

 return NextResponse.json({
  schemaReady: schemaStatus.ready,
  schemaReason: schemaStatus.reason,
  schemaMessage: schemaStatus.message,
  keys: keys.map((key) => ({
   ...key,
   providerLabel: getApiKeyProviderLabel(key.provider),
  })),
  summary,
 });
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const discoveryRequest = discoverKeySchema.safeParse(payload);
 if (discoveryRequest.success) {
  const discovery = await discoverApiKeyModels(
   discoveryRequest.data.apiKey,
   discoveryRequest.data.provider,
   request.signal,
  );

  if (!discovery.ok) {
   return NextResponse.json({ error: discovery.error }, { status: 400 });
  }

  return NextResponse.json({ valid: true, ...discovery.value });
 }

 if (!(await isUserApiKeysSchemaReady(supabase, user.id))) {
  return NextResponse.json(
   {
    error: "Database chưa có bảng user_api_keys. Hãy apply migration mới trước khi thêm API key.",
   },
   { status: 503 },
  );
 }

 const parsed = addKeySchema.safeParse(payload);
 if (!parsed.success) {
  return NextResponse.json(
   { error: "Payload không hợp lệ", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 const requestedProvider: ApiKeyProviderSelection =
  parsed.data.provider ?? AUTO_API_KEY_PROVIDER;
 const discovery = await discoverApiKeyModels(
  parsed.data.apiKey,
  requestedProvider,
  request.signal,
 );
 if (!discovery.ok) {
  return NextResponse.json({ error: discovery.error }, { status: 400 });
 }

 const selectedModel = parsed.data.model ?? discovery.value.recommendedModel;
 if (!discovery.value.models.includes(selectedModel)) {
  return NextResponse.json(
   {
    error:
     "Model đã chọn không còn khả dụng cho API key này. Hãy kiểm tra lại key để tải danh sách model mới.",
   },
   { status: 400 },
  );
 }

 const created = await createUserApiKey(supabase, user.id, {
  provider: discovery.value.provider,
  apiKey: parsed.data.apiKey,
  label: parsed.data.label,
  defaultModel: selectedModel,
 });

 if (!created.key) {
  return NextResponse.json(
   { error: created.error || "Không thể lưu API key." },
   { status: 500 },
  );
 }

 return NextResponse.json({
  success: true,
  key: {
   ...created.key,
   providerLabel: getApiKeyProviderLabel(created.key.provider),
  },
  message: `Đã xác thực và lưu ${discovery.value.providerLabel} key thành công.`,
 });
}

export async function PATCH(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 if (!(await isUserApiKeysSchemaReady(supabase, user.id))) {
  return NextResponse.json(
   {
    error:
     "Database chưa có bảng user_api_keys. Hãy apply migration mới trước khi cập nhật API key.",
   },
   { status: 503 },
  );
 }

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = patchSchema.safeParse(payload);
 if (!parsed.success) {
  return NextResponse.json(
   { error: "Payload không hợp lệ", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 if (parsed.data.action === "move") {
  const keys = await moveUserApiKey(
   supabase,
   user.id,
   parsed.data.keyId,
   parsed.data.direction,
  );

  if (!keys) {
   return NextResponse.json(
    { error: "Không thể cập nhật thứ tự key." },
    { status: 500 },
   );
  }

  return NextResponse.json({
   success: true,
   keys: keys.map((key) => ({
    ...key,
    providerLabel: getApiKeyProviderLabel(key.provider),
   })),
  });
 }

 if (parsed.data.action === "model") {
  const key = (await listUserApiKeys(supabase, user.id)).find(
   (candidate) => candidate.id === parsed.data.keyId,
  );
  if (!key || !isApiKeyModelSupported(key.provider, parsed.data.model)) {
   return NextResponse.json(
    { error: "Model đã chọn không được hỗ trợ cho provider này." },
    { status: 400 },
   );
  }
 }

 const updated = await updateUserApiKey(supabase, user.id, parsed.data.keyId, {
  ...(parsed.data.action === "toggle" ? { isActive: parsed.data.isActive } : {}),
  ...(parsed.data.action === "rename" ? { label: parsed.data.label } : {}),
  ...(parsed.data.action === "model" ? { defaultModel: parsed.data.model } : {}),
 });

 if (!updated) {
  return NextResponse.json(
   { error: "Không thể cập nhật API key." },
   { status: 500 },
  );
 }

 return NextResponse.json({
  success: true,
  key: {
   ...updated,
   providerLabel: getApiKeyProviderLabel(updated.provider),
  },
 });
}

export async function DELETE(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 if (!(await isUserApiKeysSchemaReady(supabase, user.id))) {
  return NextResponse.json(
   {
    error: "Database chưa có bảng user_api_keys. Hãy apply migration mới trước khi xóa API key.",
   },
   { status: 503 },
  );
 }

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = deleteSchema.safeParse(payload);
 if (!parsed.success) {
  return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
 }

 const deleted = await deleteUserApiKey(supabase, user.id, parsed.data.keyId);
 if (!deleted) {
  return NextResponse.json({ error: "Không thể xóa API key." }, { status: 500 });
 }

 return NextResponse.json({ success: true });
}
