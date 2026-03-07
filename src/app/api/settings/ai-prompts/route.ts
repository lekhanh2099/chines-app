import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeGeminiModel } from "@/lib/gemini-models";
import { createClient } from "@/lib/supabase/server";
import {
 getUserAiPromptSettings,
 upsertUserAiPromptSettings,
} from "@/services/ai-prompt-settings.service";

const aiPromptSettingsSchema = z.object({
 wordLookupPrompt: z.string().trim().min(1).max(8000),
 sentenceLookupPrompt: z.string().trim().min(1).max(8000),
 geminiModel: z.string().trim().min(1).max(200),
});

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const settings = await getUserAiPromptSettings(supabase, user.id);
 return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const payload: unknown = await request.json();
 const parsed = aiPromptSettingsSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid prompt settings",
    issues: parsed.error.flatten(),
   },
   { status: 400 },
  );
 }

 const saved = await upsertUserAiPromptSettings(supabase, user.id, {
  wordLookupPrompt: parsed.data.wordLookupPrompt,
  sentenceLookupPrompt: parsed.data.sentenceLookupPrompt,
  geminiModel: normalizeGeminiModel(parsed.data.geminiModel),
 });

 if (!saved) {
  return NextResponse.json(
   { error: "Failed to save AI prompt settings" },
   { status: 500 },
  );
 }

 return NextResponse.json(saved);
}
