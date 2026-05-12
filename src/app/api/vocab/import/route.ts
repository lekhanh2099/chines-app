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
 meaning_detail: z.string().optional(),
 han_viet_note: z.string().optional(),
 source_metadata: z
  .object({
   course_key: z.string().optional(),
   lesson_key: z.string().optional(),
   lesson_number: z.number().nullable().optional(),
   lesson_title: z.string().optional(),
   row_number: z.number().nullable().optional(),
   category: z.string().optional(),
   source_file: z.string().optional(),
  })
  .optional(),
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
 word_type: z.string().optional(),
 decomposition: z.string().optional(),
 comparisons: z.array(z.string()).optional(),
 collocations: z.array(z.string()).optional(),
 examples: z
  .array(
   z.object({
    zh: z.string(),
    pinyin: z.string(),
    vi: z.string(),
    note: z.string().optional(),
   }),
  )
  .optional(),
 cultural_note: z.string().optional(),
 usage_note: z.string().optional(),
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
   meaning_detail: item.meaning_detail,
   han_viet_note: item.han_viet_note,
   source_metadata: item.source_metadata,
   definitions: item.definitions,
   word_type: item.word_type,
   decomposition: item.decomposition,
   comparisons: item.comparisons,
   collocations: item.collocations,
   examples: item.examples,
   cultural_note: item.cultural_note,
   usage_note: item.usage_note,
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
   }, { dictionaryMergeMode: "prefer-incoming" });

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
