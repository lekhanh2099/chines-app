import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
 AUTO_API_KEY_PROVIDER,
 API_KEY_PROVIDER_OPTIONS,
 getApiKeyProviderLabel,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini-models";
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

const VALIDATION_TIMEOUT = 10_000;
const OPENAI_MODEL_PREFERENCES = [
 "gpt-4.1-mini",
 "gpt-4o-mini",
 "gpt-4.1",
 "gpt-4o",
] as const;

const providerEnum = z.enum(
 API_KEY_PROVIDER_OPTIONS.map((option) => option.value) as [
  ApiKeyProvider,
  ...ApiKeyProvider[],
 ],
);

const addKeySchema = z.object({
 apiKey: z.string().trim().min(1).max(400),
 label: z.string().trim().max(80).optional(),
 provider: z.union([z.literal(AUTO_API_KEY_PROVIDER), providerEnum]).optional(),
});

const patchSchema = z.discriminatedUnion("action", [
 z.object({
  action: z.literal("toggle"),
  keyId: z.string().uuid(),
  isActive: z.boolean(),
 }),
 z.object({
  action: z.literal("rename"),
  keyId: z.string().uuid(),
  label: z.string().trim().min(1).max(80),
 }),
 z.object({
  action: z.literal("move"),
  keyId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
 }),
]);

const deleteSchema = z.object({
 keyId: z.string().uuid(),
});

type ProviderValidationSuccess = {
 valid: true;
 provider: ApiKeyProvider;
 defaultModel: string | null;
 detectedVia: "auto" | "manual";
 message?: string;
};

type ProviderValidationFailure = {
 valid: false;
 error: string;
};

type ProviderValidationResult =
 | ProviderValidationSuccess
 | ProviderValidationFailure;

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const schemaStatus = await getUserApiKeysSchemaStatus(supabase, user.id);
 const keys = schemaStatus.ready
  ? await listUserApiKeys(supabase, user.id)
  : [];
 const summary = {
  total: keys.length,
  active: keys.filter((key) => key.isActive).length,
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

 if (!(await isUserApiKeysSchemaReady(supabase, user.id))) {
  return NextResponse.json(
   {
    error:
     "Database chưa có bảng user_api_keys. Hãy apply migration mới trước khi thêm API key.",
   },
   { status: 503 },
  );
 }

 const payload: unknown = await request.json();
 const parsed = addKeySchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json(
   { error: "Payload không hợp lệ", issues: parsed.error.flatten() },
   { status: 400 },
  );
 }

 const validation = await detectAndValidateProvider(
  parsed.data.apiKey,
  parsed.data.provider || AUTO_API_KEY_PROVIDER,
 );

 if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
 }

 const created = await createUserApiKey(supabase, user.id, {
  provider: validation.provider,
  apiKey: parsed.data.apiKey,
  label: parsed.data.label,
  defaultModel: validation.defaultModel,
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
  message:
   validation.message ||
   `Đã thêm ${getApiKeyProviderLabel(validation.provider)} key thành công.`,
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

 const payload: unknown = await request.json();
 const parsed = patchSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json(
   { error: "Payload không hợp lệ", issues: parsed.error.flatten() },
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

 const updated = await updateUserApiKey(supabase, user.id, parsed.data.keyId, {
  ...(parsed.data.action === "toggle"
   ? { isActive: parsed.data.isActive }
   : {}),
  ...(parsed.data.action === "rename" ? { label: parsed.data.label } : {}),
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
    error:
     "Database chưa có bảng user_api_keys. Hãy apply migration mới trước khi xóa API key.",
   },
   { status: 503 },
  );
 }

 const payload: unknown = await request.json();
 const parsed = deleteSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
 }

 const deleted = await deleteUserApiKey(supabase, user.id, parsed.data.keyId);
 if (!deleted) {
  return NextResponse.json(
   { error: "Không thể xóa API key." },
   { status: 500 },
  );
 }

 return NextResponse.json({ success: true });
}

async function detectAndValidateProvider(
 apiKey: string,
 provider: ApiKeyProvider | typeof AUTO_API_KEY_PROVIDER,
): Promise<ProviderValidationResult> {
 if (provider !== AUTO_API_KEY_PROVIDER) {
  return validateByProvider(apiKey, provider, "manual");
 }

 const candidates = getProviderCandidates(apiKey);
 const errors: string[] = [];

 for (const candidate of candidates) {
  const result = await validateByProvider(apiKey, candidate, "auto");
  if (result.valid) {
   return result;
  }
  errors.push(result.error);
 }

 return {
  valid: false,
  error:
   errors[0] ||
   "Không thể xác định provider cho API key này. Hãy chọn provider thủ công.",
 };
}

function getProviderCandidates(apiKey: string): ApiKeyProvider[] {
 const trimmed = apiKey.trim();

 if (trimmed.startsWith("AIza")) {
  return ["gemini"];
 }

 if (trimmed.startsWith("sk-proj-")) {
  return ["openai", "deepseek"];
 }

 if (trimmed.startsWith("sk-")) {
  return ["deepseek", "openai"];
 }

 return ["deepseek", "gemini", "openai"];
}

async function validateByProvider(
 apiKey: string,
 provider: ApiKeyProvider,
 detectedVia: "auto" | "manual",
): Promise<ProviderValidationResult> {
 if (provider === "deepseek") {
  return validateDeepSeekKey(apiKey, detectedVia);
 }

 if (provider === "gemini") {
  return validateGeminiKey(apiKey, detectedVia);
 }

 return validateOpenAiKey(apiKey, detectedVia);
}

async function validateDeepSeekKey(
 apiKey: string,
 detectedVia: "auto" | "manual",
): Promise<ProviderValidationResult> {
 if (!apiKey.startsWith("sk-")) {
  return {
   valid: false,
   error:
    "Key này không giống định dạng DeepSeek. DeepSeek key thường bắt đầu bằng 'sk-'.",
  };
 }

 try {
  const res = await fetch("https://api.deepseek.com/models", {
   method: "GET",
   headers: { Authorization: `Bearer ${apiKey}` },
   signal: AbortSignal.timeout(VALIDATION_TIMEOUT),
  });

  if (res.status === 401 || res.status === 403) {
   return {
    valid: false,
    error:
     "DeepSeek từ chối API key này. Hãy kiểm tra lại key trên platform.deepseek.com.",
   };
  }

  if (res.status === 402) {
   return {
    valid: false,
    error: "DeepSeek key hợp lệ nhưng tài khoản đã hết số dư.",
   };
  }

  if (!res.ok) {
   return {
    valid: false,
    error: `DeepSeek trả về lỗi HTTP ${res.status}.`,
   };
  }

  const json = (await res.json()) as { data?: { id: string }[] };
  const models = (json.data || []).map((model) => model.id);
  const defaultModel =
   models.find((model) => model === "deepseek-chat") || models[0] || null;

  return {
   valid: true,
   provider: "deepseek",
   defaultModel,
   detectedVia,
   message:
    detectedVia === "auto"
     ? "Đã tự nhận diện DeepSeek key và lưu thành công."
     : undefined,
  };
 } catch (err) {
  return {
   valid: false,
   error: formatValidationNetworkError("DeepSeek", err),
  };
 }
}

async function validateGeminiKey(
 apiKey: string,
 detectedVia: "auto" | "manual",
): Promise<ProviderValidationResult> {
 try {
  const res = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
   {
    method: "GET",
    signal: AbortSignal.timeout(VALIDATION_TIMEOUT),
   },
  );

  if (res.status === 400 || res.status === 401 || res.status === 403) {
   return {
    valid: false,
    error:
     "Google Gemini từ chối API key này. Hãy kiểm tra lại key trong AI Studio.",
   };
  }

  if (!res.ok) {
   return {
    valid: false,
    error: `Google Gemini trả về lỗi HTTP ${res.status}.`,
   };
  }

  const json = (await res.json()) as {
   models?: {
    name?: string;
    supportedGenerationMethods?: string[];
   }[];
  };

  const availableModels = (json.models || [])
   .filter((model) =>
    (model.supportedGenerationMethods || []).includes("generateContent"),
   )
   .map((model) => model.name || "")
   .filter(Boolean);

  return {
   valid: true,
   provider: "gemini",
   defaultModel:
    availableModels.find((model) => model === DEFAULT_GEMINI_MODEL) ||
    availableModels[0] ||
    DEFAULT_GEMINI_MODEL,
   detectedVia,
   message:
    detectedVia === "auto"
     ? "Đã tự nhận diện Google Gemini key và lưu thành công."
     : undefined,
  };
 } catch (err) {
  return {
   valid: false,
   error: formatValidationNetworkError("Google Gemini", err),
  };
 }
}

async function validateOpenAiKey(
 apiKey: string,
 detectedVia: "auto" | "manual",
): Promise<ProviderValidationResult> {
 if (!apiKey.startsWith("sk-")) {
  return {
   valid: false,
   error:
    "Key này không giống định dạng OpenAI. OpenAI key thường bắt đầu bằng 'sk-'.",
  };
 }

 try {
  const res = await fetch("https://api.openai.com/v1/models", {
   method: "GET",
   headers: { Authorization: `Bearer ${apiKey}` },
   signal: AbortSignal.timeout(VALIDATION_TIMEOUT),
  });

  if (res.status === 401 || res.status === 403) {
   return {
    valid: false,
    error:
     "OpenAI từ chối API key này. Hãy kiểm tra lại key trên platform.openai.com.",
   };
  }

  if (!res.ok) {
   return {
    valid: false,
    error: `OpenAI trả về lỗi HTTP ${res.status}.`,
   };
  }

  const json = (await res.json()) as { data?: { id: string }[] };
  const models = (json.data || []).map((model) => model.id);
  const defaultModel =
   OPENAI_MODEL_PREFERENCES.find((model) => models.includes(model)) ||
   models[0] ||
   null;

  return {
   valid: true,
   provider: "openai",
   defaultModel,
   detectedVia,
   message:
    detectedVia === "auto"
     ? "Đã tự nhận diện OpenAI key và lưu thành công."
     : undefined,
  };
 } catch (err) {
  return {
   valid: false,
   error: formatValidationNetworkError("OpenAI", err),
  };
 }
}

function formatValidationNetworkError(
 providerLabel: string,
 error: unknown,
): string {
 if (error instanceof DOMException && error.name === "TimeoutError") {
  return `${providerLabel} phản hồi quá chậm khi validate key. Vui lòng thử lại.`;
 }

 return `${providerLabel} lỗi kết nối: ${error instanceof Error ? error.message : "unknown"}.`;
}
