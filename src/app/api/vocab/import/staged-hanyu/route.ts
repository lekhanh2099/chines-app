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
 definitions?: AiAnalysis["definitions"];
 examples?: AiAnalysis["examples"];
 notes?: string;
 source?: {
  sheet?: string;
  row_number?: number;
  category?: string;
 };
};

type StagedVocabPayload = {
 items: StagedVocabItem[];
};

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

 const payloadPath = path.join(
  process.cwd(),
  "data/import/hanyu-2-1-vocab-staging.json",
 );
 const payload = JSON.parse(
  await fs.readFile(payloadPath, "utf8"),
 ) as StagedVocabPayload;

 const uniqueItems = new Map<string, StagedVocabItem>();
 for (const item of payload.items) {
  if (item.hanzi && !uniqueItems.has(item.hanzi)) {
   uniqueItems.set(item.hanzi, item);
  }
 }

 const results: {
  hanzi: string;
  success: boolean;
  error?: string;
 }[] = [];

 for (const item of uniqueItems.values()) {
  const meaning = item.meaning_summary || "";
  const sourceNote = [
   item.notes,
   item.source
    ? `Source: ${item.source.sheet || "unknown"} #${
       item.source.row_number || "?"
      }${item.source.category ? `, ${item.source.category}` : ""}`
    : "",
  ]
   .filter(Boolean)
   .join("\n");

  const aiAnalysis: AiAnalysis = {
   hanzi: item.hanzi,
   pinyin: item.pinyin,
   sino_vietnamese: item.sino_vietnamese,
   han_viet: item.sino_vietnamese,
   meaning_summary: meaning,
   definitions: item.definitions,
   examples: item.examples,
   notes: sourceNote,
  };

  try {
   const saved = await saveVocabToSrs(supabase, user.id, {
    hanzi: item.hanzi,
    pinyin: item.pinyin || "",
    sino_vietnamese: item.sino_vietnamese,
    meaning,
    ai_analysis: aiAnalysis,
   });

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
  imported,
  failed,
  total: results.length,
  results,
 });
}
