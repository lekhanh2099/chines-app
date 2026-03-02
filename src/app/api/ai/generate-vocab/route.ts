import { createClient } from "@/lib/supabase/server";
import { analyzeHanzi } from "@/services/ai.service";
import { getVocabByHanzi, upsertVocab } from "@/services/vocab.service";
import { NextRequest, NextResponse } from "next/server";
import type { AiAnalysis } from "@/types/database";

export async function POST(request: NextRequest) {
 const supabase = await createClient();

 // Auth check
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const body: unknown = await request.json();
 const { hanzi } = body as { hanzi?: string };

 if (!hanzi || typeof hanzi !== "string" || hanzi.length > 10) {
  return NextResponse.json(
   { error: "Invalid hanzi parameter" },
   { status: 400 },
  );
 }

 // Check if we already have AI data in DB via service
 const existing = await getVocabByHanzi(supabase, hanzi);
 const existingAi = existing?.ai_analysis as AiAnalysis | null;

 if (existingAi && Object.keys(existingAi).length > 3) {
  return NextResponse.json({ data: existingAi, cached: true });
 }

 // Call AI service
 const aiResult = await analyzeHanzi(hanzi);

 if (!aiResult) {
  return NextResponse.json(
   {
    error:
     "AI generation failed — check server logs. Common causes: DeepSeek insufficient balance, missing API keys.",
   },
   { status: 502 },
  );
 }

 // Upsert via service
 const upsertResult = await upsertVocab(supabase, {
  hanzi: aiResult.hanzi,
  pinyin: aiResult.pinyin,
  meaning: aiResult.meanings?.[0]?.definition || "",
  ai_analysis: aiResult as AiAnalysis,
 });

 if (!upsertResult) {
  console.error("[generate-vocab] DB upsert failed");
 }

 return NextResponse.json({ data: aiResult, cached: false });
}
