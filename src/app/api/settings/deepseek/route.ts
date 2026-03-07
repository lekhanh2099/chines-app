import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEEPSEEK_MODEL_OPTIONS } from "@/lib/deepseek-models";
import { createClient } from "@/lib/supabase/server";
import {
 getDecryptedDeepSeekKey,
 removeDeepSeekKey,
 saveDeepSeekKey,
 toggleDeepSeekEnabled,
} from "@/services/ai-prompt-settings.service";

const DEEPSEEK_VALIDATE_TIMEOUT = 10_000;

/* ══════════════════════════════════════════
   GET — Check BYOK status & list models
   ══════════════════════════════════════════ */

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { data } = await supabase
  .from("user_ai_prompt_settings")
  .select("deepseek_enabled, deepseek_api_key_encrypted")
  .eq("user_id", user.id)
  .maybeSingle();

 const hasKey = !!data?.deepseek_api_key_encrypted;
 const enabled = data?.deepseek_enabled ?? false;

 // Only fetch live models if the user has a key AND it's enabled
 let models: { id: string; label: string; description: string }[] = [];

 if (hasKey && enabled) {
  const apiKey = await getDecryptedDeepSeekKey(supabase, user.id);
  if (apiKey) {
   models = await fetchDeepSeekModels(apiKey);
  }
  // Fallback to static list only when key exists but API call failed
  if (models.length === 0) {
   models = DEEPSEEK_MODEL_OPTIONS.map((m) => ({
    id: m.value,
    label: m.label,
    description: m.description,
   }));
  }
 }

 return NextResponse.json({
  hasKey,
  enabled,
  models,
 });
}

/* ══════════════════════════════════════════
   POST — Validate & Save API Key
   ══════════════════════════════════════════ */

const saveKeySchema = z.object({
 apiKey: z
  .string()
  .trim()
  .min(1, "API Key không được để trống")
  .max(200, "API Key quá dài"),
});

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const payload: unknown = await request.json();
 const parsed = saveKeySchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json(
   { error: "API Key không hợp lệ", issues: parsed.error.flatten() },
   { status: 400 },
  );
 }

 const { apiKey } = parsed.data;

 // Basic format check — DeepSeek keys start with "sk-"
 if (!apiKey.startsWith("sk-")) {
  return NextResponse.json(
   {
    error:
     "Cấu trúc Key không đúng định dạng DeepSeek. Key phải bắt đầu bằng 'sk-'.",
   },
   { status: 400 },
  );
 }

 // Validate by calling the /models endpoint
 const validation = await validateDeepSeekKey(apiKey);

 if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
 }

 // Save encrypted key to database
 let result: { success: boolean; error?: string };
 try {
  result = await saveDeepSeekKey(supabase, user.id, apiKey);
 } catch (err) {
  console.error("[BYOK] encryption/save error:", err);
  return NextResponse.json(
   {
    error:
     "Lỗi mã hóa API Key. Vui lòng kiểm tra cấu hình server (BYOK_ENCRYPTION_SECRET).",
   },
   { status: 500 },
  );
 }

 if (!result.success) {
  return NextResponse.json(
   { error: result.error || "Không lưu được API Key." },
   { status: 500 },
  );
 }

 return NextResponse.json({
  success: true,
  models: validation.models,
  message: "Đã kết nối thành công! API Key đã được mã hóa và lưu trữ.",
 });
}

/* ══════════════════════════════════════════
   PUT — Toggle enable/disable
   ══════════════════════════════════════════ */

const toggleSchema = z.object({
 enabled: z.boolean(),
});

export async function PUT(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const payload: unknown = await request.json();
 const parsed = toggleSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
 }

 const result = await toggleDeepSeekEnabled(
  supabase,
  user.id,
  parsed.data.enabled,
 );

 if (!result.success) {
  return NextResponse.json(
   { error: "Không thể cập nhật trạng thái BYOK." },
   { status: 500 },
  );
 }

 return NextResponse.json({ success: true, enabled: parsed.data.enabled });
}

/* ══════════════════════════════════════════
   DELETE — Remove API Key
   ══════════════════════════════════════════ */

export async function DELETE() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const result = await removeDeepSeekKey(supabase, user.id);

 if (!result.success) {
  return NextResponse.json(
   { error: "Không xóa được API Key." },
   { status: 500 },
  );
 }

 return NextResponse.json({ success: true });
}

/* ══════════════════════════════════════════
   Helpers — Validate Key & Fetch Models
   ══════════════════════════════════════════ */

type ValidationResult = {
 valid: boolean;
 error?: string;
 models?: { id: string; label: string; description: string }[];
};

async function validateDeepSeekKey(apiKey: string): Promise<ValidationResult> {
 try {
  const res = await fetch("https://api.deepseek.com/models", {
   method: "GET",
   headers: {
    Authorization: `Bearer ${apiKey}`,
   },
   signal: AbortSignal.timeout(DEEPSEEK_VALIDATE_TIMEOUT),
  });

  if (res.status === 401) {
   return {
    valid: false,
    error:
     "API Key không hợp lệ. Vui lòng kiểm tra lại key trên platform.deepseek.com.",
   };
  }

  if (res.status === 402) {
   return {
    valid: false,
    error:
     "Tài khoản DeepSeek của bạn đã hết tín dụng (Insufficient Quota). Vui lòng nạp thêm.",
   };
  }

  if (!res.ok) {
   return {
    valid: false,
    error: `DeepSeek trả về lỗi HTTP ${res.status}. Vui lòng thử lại.`,
   };
  }

  const json = (await res.json()) as {
   data?: { id: string; object: string }[];
  };
  const models = (json.data || []).map((m) => ({
   id: m.id,
   label: m.id,
   description: `DeepSeek model: ${m.id}`,
  }));

  return { valid: true, models };
 } catch (err) {
  if (err instanceof DOMException && err.name === "TimeoutError") {
   return {
    valid: false,
    error: "Kết nối tới DeepSeek quá chậm (timeout 10s). Vui lòng thử lại.",
   };
  }

  return {
   valid: false,
   error: `Lỗi kết nối: ${err instanceof Error ? err.message : "unknown"}`,
  };
 }
}

async function fetchDeepSeekModels(
 apiKey: string,
): Promise<{ id: string; label: string; description: string }[]> {
 try {
  const res = await fetch("https://api.deepseek.com/models", {
   method: "GET",
   headers: { Authorization: `Bearer ${apiKey}` },
   signal: AbortSignal.timeout(DEEPSEEK_VALIDATE_TIMEOUT),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
   data?: { id: string; object: string }[];
  };

  return (json.data || []).map((m) => ({
   id: m.id,
   label: m.id,
   description: `DeepSeek model: ${m.id}`,
  }));
 } catch {
  return [];
 }
}
