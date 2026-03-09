import { createClient } from "@/lib/supabase/server";
import { saveVocabToSrs, classifyVocabType } from "@/services/vocab.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { AiAnalysis } from "@/types/database";

/**
 * Schema for a single imported vocab item.
 * Accepts the JSON structure users paste in (word lookup result).
 */
const importItemSchema = z.object({
 hanzi: z.string().min(1),
 pinyin: z.string().optional(),
 han_viet: z.string().optional(),
 sino_vietnamese: z.string().optional(),
 meaning_summary: z.string().optional(),
 definitions: z
  .array(
   z.object({
    pos: z.string().optional(),
    text: z.string().optional(),
    meaning: z.string().optional(),
    meanings: z
     .array(
      z.object({
       meaning: z.string().optional(),
       examples: z
        .array(
         z.object({
          cn: z.string().optional(),
          pinyin: z.string().optional(),
          vi: z.string().optional(),
         }),
        )
        .optional(),
      }),
     )
     .optional(),
   }),
  )
  .optional(),
 etymology: z
  .union([
   z.string(),
   z.object({
    type: z.string().optional(),
    origin: z.string().optional(),
    mnemonic: z.string().optional(),
    explanation: z.string().optional(),
   }),
  ])
  .optional(),
 related_compounds: z
  .array(
   z.object({
    word: z.string().optional(),
    pinyin: z.string().optional(),
    meaning: z.string().optional(),
   }),
  )
  .optional(),
 radicals: z
  .array(
   z.object({
    char: z.string().optional(),
    pinyin: z.string().optional(),
    meaning: z.string().optional(),
   }),
  )
  .optional(),
 stroke_count: z.number().optional(),
 radical: z.string().optional(),
 hsk_level: z.string().optional(),
 tocfl_level: z.string().optional(),
 notes: z.string().optional(),
 mnemonic_story: z.string().optional(),
 synonyms: z
  .array(
   z.object({
    word: z.string().optional(),
    pinyin: z.string().optional(),
    meaning: z.string().optional(),
   }),
  )
  .optional(),
 antonyms: z
  .array(
   z.object({
    word: z.string().optional(),
    pinyin: z.string().optional(),
    meaning: z.string().optional(),
   }),
  )
  .optional(),
});

const importPayloadSchema = z.object({
 items: z.array(importItemSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
 const supabase = await createClient();

 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 let body: unknown;
 try {
  body = await request.json();
 } catch {
  return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
 }

 const parsed = importPayloadSchema.safeParse(body);
 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid import format",
    details: parsed.error.issues.map((i) => ({
     path: i.path.join("."),
     message: i.message,
    })),
   },
   { status: 400 },
  );
 }

 const results: {
  hanzi: string;
  success: boolean;
  error?: string;
 }[] = [];

 for (const item of parsed.data.items) {
  const meaningSummary =
   item.meaning_summary ||
   item.definitions
    ?.map((d) => d.text || d.meaning || d.meanings?.[0]?.meaning)
    .filter(Boolean)
    .join("; ") ||
   "";

  const aiAnalysis: AiAnalysis = {
   hanzi: item.hanzi,
   pinyin: item.pinyin,
   han_viet: item.han_viet || item.sino_vietnamese,
   sino_vietnamese: item.sino_vietnamese || item.han_viet,
   meaning_summary: meaningSummary,
   definitions: item.definitions,
   etymology: item.etymology,
   related_compounds: item.related_compounds,
   radicals: item.radicals,
   stroke_count: item.stroke_count,
   radical: item.radical,
   hsk_level: item.hsk_level,
   tocfl_level: item.tocfl_level,
   notes: item.notes,
   mnemonic_story: item.mnemonic_story,
   synonyms: item.synonyms,
   antonyms: item.antonyms,
  };

  const vocabType = classifyVocabType(item.hanzi, item.pinyin);

  try {
   const saved = await saveVocabToSrs(supabase, user.id, {
    hanzi: item.hanzi,
    pinyin: item.pinyin || "",
    sino_vietnamese: item.sino_vietnamese || item.han_viet,
    meaning: meaningSummary,
    ai_analysis: aiAnalysis,
   });

   if (saved) {
    // Update type in dictionary_core if the table supports it
    if (saved.dictionaryId) {
     await supabase
      .from("dictionary_core")
      .update({ type: vocabType })
      .eq("id", saved.dictionaryId);
    }
    results.push({ hanzi: item.hanzi, success: true });
   } else {
    results.push({
     hanzi: item.hanzi,
     success: false,
     error: "Failed to save",
    });
   }
  } catch (err) {
   results.push({
    hanzi: item.hanzi,
    success: false,
    error: err instanceof Error ? err.message : "Unknown error",
   });
  }
 }

 const successCount = results.filter((r) => r.success).length;
 const failCount = results.filter((r) => !r.success).length;

 return NextResponse.json({
  imported: successCount,
  failed: failCount,
  results,
 });
}
