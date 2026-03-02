import { createClient } from "@/lib/supabase/server";
import { getVocabByHanzi, saveVocabToSrs } from "@/services/vocab.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
 const hanzi = request.nextUrl.searchParams.get("hanzi");

 if (!hanzi) {
  return NextResponse.json(
   { error: "Missing hanzi parameter" },
   { status: 400 },
  );
 }

 const supabase = await createClient();

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
   meaning: vocab.meaning,
   ai_analysis: vocab.ai_analysis,
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
 const { hanzi, pinyin, meaning } = body as {
  hanzi?: string;
  pinyin?: string;
  meaning?: string;
 };

 if (!hanzi) {
  return NextResponse.json(
   { error: "Missing hanzi parameter" },
   { status: 400 },
  );
 }

 const result = await saveVocabToSrs(supabase, user.id, {
  hanzi,
  pinyin: pinyin || "",
  meaning: meaning || "",
 });

 if (!result) {
  return NextResponse.json(
   { error: "Failed to save vocabulary" },
   { status: 500 },
  );
 }

 return NextResponse.json({ success: true, vocab_id: result.vocabId });
}
