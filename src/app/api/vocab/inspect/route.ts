import { createClient } from "@/lib/supabase/server";
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

 const { data: vocab, error } = await supabase
  .from("vocabularies")
  .select("*")
  .eq("hanzi", hanzi)
  .single();

 if (error || !vocab) {
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

 const body = await request.json();
 const { hanzi, pinyin, meaning } = body;

 if (!hanzi) {
  return NextResponse.json(
   { error: "Missing hanzi parameter" },
   { status: 400 },
  );
 }

 const { data: vocab, error: vocabError } = await supabase
  .from("vocabularies")
  .upsert(
   { hanzi, pinyin: pinyin || "", meaning: meaning || "" },
   { onConflict: "hanzi" },
  )
  .select("id")
  .single();

 if (vocabError) {
  return NextResponse.json({ error: vocabError.message }, { status: 500 });
 }

 if (vocab?.id) {
  await supabase.from("user_vocab_progress").upsert(
   {
    user_id: user.id,
    vocab_id: vocab.id,
    is_favorited: true,
   },
   { onConflict: "user_id,vocab_id" },
  );
 }

 return NextResponse.json({ success: true, vocab_id: vocab?.id });
}
