import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyVocabType, saveVocabToSrs } from "@/services/vocab.service";
import type { AiAnalysis } from "@/types/database";

export const dynamic = "force-dynamic";

type StagedVocabItem = {
 hanzi: string;
 pinyin?: string;
 sino_vietnamese?: string;
 meaning_summary?: string;
 meaning_detail?: string;
 han_viet_note?: string;
 source_metadata?: AiAnalysis["source_metadata"];
 definitions?: AiAnalysis["definitions"];
 word_type?: string;
 decomposition?: string;
 comparisons?: string[];
 collocations?: string[];
 examples?: AiAnalysis["examples"];
 cultural_note?: string;
 usage_note?: string;
 notes?: string;
 source?: {
  course_key?: string;
  sheet?: string;
  lesson_number?: number;
  lesson_title?: string;
  row_number?: number;
  category?: string;
 };
};

type StagedVocabPayload = {
 lessons?: {
  lesson_key: string;
  lesson_number: number | null;
  lesson_title: string;
  count: number;
 }[];
 items: StagedVocabItem[];
};

function isMissingTableOrColumnError(error: unknown): boolean {
 const code =
  typeof error === "object" && error !== null && "code" in error
   ? String((error as { code?: unknown }).code || "")
   : "";
 const message =
  typeof error === "object" && error !== null && "message" in error
   ? String((error as { message?: unknown }).message || "").toLowerCase()
   : "";

 return (
  code === "42P01" ||
  code === "42703" ||
  code === "PGRST204" ||
  code === "PGRST205" ||
  message.includes("does not exist") ||
  message.includes("schema cache")
 );
}

export async function GET(request: NextRequest) {
 if (process.env.NODE_ENV !== "development") {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
 }

 const confirm = request.nextUrl.searchParams.get("confirm");
 if (confirm !== "import") {
  return NextResponse.json(
   {
    error: "Missing confirm=import",
    usage: "/api/vocab/import/staged-hanyu?confirm=import",
   },
   { status: 400 },
  );
 }

 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const source = request.nextUrl.searchParams.get("source");
 const stagingFile =
  source === "docx"
   ? "hanyu-docx-vocab-staging.json"
   : "hanyu-2-1-vocab-staging.json";
 const payloadPath = path.join(process.cwd(), "data/import", stagingFile);
 const payload = JSON.parse(
  await fs.readFile(payloadPath, "utf8"),
 ) as StagedVocabPayload;

 const clean = request.nextUrl.searchParams.get("clean");
 let cleaned = false;
 if (clean === "1" || clean === "true") {
  const progressDelete = await supabase
   .from("user_vocab_progress")
   .delete()
   .eq("user_id", user.id);

  if (progressDelete.error) {
   return NextResponse.json(
    {
     error: "Failed to clean old vocab progress",
     details: progressDelete.error.message,
    },
    { status: 500 },
   );
  }

  const relationDelete = await supabase
   .from("user_vocabularies")
   .delete()
   .eq("user_id", user.id);

  if (
   relationDelete.error &&
   !isMissingTableOrColumnError(relationDelete.error)
  ) {
   return NextResponse.json(
    {
     error: "Failed to clean old vocab relations",
     details: relationDelete.error.message,
    },
    { status: 500 },
   );
  }

  cleaned = true;
 }

 const uniqueItems = new Map<string, StagedVocabItem>();
 const duplicateItems: { hanzi: string; lesson?: string; row?: number }[] = [];
 for (const item of payload.items) {
  if (!item.hanzi) continue;
  if (uniqueItems.has(item.hanzi)) {
   duplicateItems.push({
    hanzi: item.hanzi,
    lesson: item.source_metadata?.lesson_key || item.source?.sheet,
    row: item.source_metadata?.row_number || item.source?.row_number,
   });
   continue;
  }
  uniqueItems.set(item.hanzi, item);
 }

 const results: {
  hanzi: string;
  success: boolean;
  error?: string;
 }[] = [];

 for (const item of uniqueItems.values()) {
  const meaning = item.meaning_summary || "";
  const generatedSourceNote = item.source
   ? `Source: ${item.source.sheet || "unknown"} #${
      item.source.row_number || "?"
     }${item.source.category ? `, ${item.source.category}` : ""}`
   : "";
  const sourceNote = [
   item.notes,
   item.notes?.includes("Source:") ? "" : generatedSourceNote,
  ]
   .filter(Boolean)
   .join("\n");

  const aiAnalysis: AiAnalysis = {
   hanzi: item.hanzi,
   pinyin: item.pinyin,
   sino_vietnamese: item.sino_vietnamese,
   han_viet: item.sino_vietnamese,
   meaning_summary: meaning,
   meaning_detail: item.meaning_detail,
   han_viet_note: item.han_viet_note,
   source_metadata:
    item.source_metadata ||
    (item.source
     ? {
        course_key: item.source.course_key,
        lesson_key: item.source.sheet,
        lesson_number: item.source.lesson_number,
        lesson_title: item.source.lesson_title,
        row_number: item.source.row_number,
        category: item.source.category,
       }
     : undefined),
   definitions: item.definitions,
   word_type: item.word_type,
   decomposition: item.decomposition,
   comparisons: item.comparisons,
   collocations: item.collocations,
   examples: item.examples,
   cultural_note: item.cultural_note,
   usage_note: item.usage_note,
   notes: sourceNote,
  };

  try {
   const saved = await saveVocabToSrs(supabase, user.id, {
    hanzi: item.hanzi,
    pinyin: item.pinyin || "",
    sino_vietnamese: item.sino_vietnamese,
    meaning,
    ai_analysis: aiAnalysis,
   }, { dictionaryMergeMode: "prefer-incoming" });

   if (saved) {
    if (saved.dictionaryId) {
     await supabase
      .from("dictionary_core")
      .update({ type: classifyVocabType(item.hanzi, item.pinyin) })
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
  } catch (error) {
   results.push({
    hanzi: item.hanzi,
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
   });
  }
 }

 const imported = results.filter((result) => result.success).length;
 const failed = results.length - imported;

 return NextResponse.json({
  cleaned,
  imported,
  failed,
  total: results.length,
  sourceFile: stagingFile,
  lessonCount: payload.lessons?.length || 0,
  lessons: payload.lessons || [],
  originalItems: payload.items.length,
  uniqueItems: uniqueItems.size,
  skippedDuplicates: duplicateItems.length,
  duplicateItems: duplicateItems.slice(0, 50),
  results,
 });
}
