import { createClient } from "@/lib/supabase/server";
import {
 getDictionaryEntryByHeadword,
 getVocabularyAnalysis,
 getVocabByHanzi,
 mapDictionaryEntryToVocabData,
 saveVocabToSrs,
} from "@/services/vocab.service";
import { NextRequest, NextResponse } from "next/server";
import type { AiAnalysis } from "@/types/database";

export async function GET(request: NextRequest) {
 const hanzi = request.nextUrl.searchParams.get("hanzi");

 if (!hanzi) {
  return NextResponse.json(
   { error: "Missing hanzi parameter" },
   { status: 400 },
  );
 }

 const supabase = await createClient();

 const cachedDictionary = await getDictionaryEntryByHeadword(supabase, hanzi);

 if (cachedDictionary) {
  const vocab = mapDictionaryEntryToVocabData(cachedDictionary);

  return NextResponse.json({
   found: true,
   data: {
    id: vocab.id,
    dictionary_id: vocab.dictionary_id,
    hanzi: vocab.hanzi,
    pinyin: vocab.pinyin,
    sino_vietnamese: vocab.sino_vietnamese,
    meaning: vocab.meaning,
    ai_analysis: vocab.ai_analysis,
   },
  });
 }

 const vocab = await getVocabByHanzi(supabase, hanzi);

 if (!vocab) {
  return NextResponse.json({ found: false, hanzi }, { status: 200 });
 }

 return NextResponse.json({
  found: true,
  data: {
   id: vocab.id,
   hanzi: vocab.hanzi,
   pinyin: vocab.pinyin,
   sino_vietnamese: vocab.sino_vietnamese,
   meaning: vocab.meaning,
   ai_analysis: getVocabularyAnalysis(vocab),
  },
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

 const body: unknown = await request.json();
 const {
  hanzi,
  pinyin,
  sino_vietnamese,
  meaning,
  analysis,
  ai_analysis,
  context_sentence,
  context_translation,
  personal_note,
  personal_note_mode,
 } = body as {
  hanzi?: string;
  pinyin?: string;
  sino_vietnamese?: string;
  meaning?: string;
  analysis?: AiAnalysis;
  ai_analysis?: AiAnalysis;
  context_sentence?: string;
  context_translation?: string;
  personal_note?: string;
  personal_note_mode?: "normal" | "important";
 };

 if (!hanzi) {
  return NextResponse.json(
   { error: "Missing hanzi parameter" },
   { status: 400 },
  );
 }

 const result = await saveVocabToSrs(
  supabase,
  user.id,
  {
   hanzi,
   pinyin: pinyin || "",
   sino_vietnamese,
   meaning: meaning || "",
   ...(analysis || ai_analysis ? { ai_analysis: analysis || ai_analysis } : {}),
  },
  {
   contextSentence: context_sentence,
   contextTranslation: context_translation,
   personalNote: personal_note,
   personalNoteMode: personal_note_mode,
  },
 );

 if (!result) {
  return NextResponse.json(
   { error: "Failed to save vocabulary" },
   { status: 500 },
  );
 }

 if (
  (context_sentence?.trim() || context_translation?.trim()) &&
  !result.contextSchemaAvailable
 ) {
  return NextResponse.json(
   {
    error:
     "Da luu tu vung nhung chua luu duoc ngu canh. Chay migration 20260307000003_user_vocab_context.sql truoc.",
   },
   { status: 409 },
  );
 }

 if (personal_note?.trim() && !result.noteSchemaAvailable) {
  return NextResponse.json(
   {
    error:
     "Da luu tu vung nhung chua luu duoc ghi chu ca nhan. Chay migration 20260307000004_user_vocab_personal_note.sql truoc.",
   },
   { status: 409 },
  );
 }

 return NextResponse.json({
  success: true,
  vocab_id: result.vocabId,
  dictionary_id: result.dictionaryId,
  context_schema_available: result.contextSchemaAvailable,
  note_schema_available: result.noteSchemaAvailable,
 });
}
