import { createClient } from "@/lib/supabase/server";
import { resolveAiAnalysisRuntime } from "@/services/ai-analysis-runtime.service";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import { analyzeHanziDetailed } from "@/services/ai.service";
import {
 getDictionaryEntryByHeadword,
 getVocabByHanzi,
 hasInspectorDeepDiveData,
 getVocabularyAnalysis,
 mapDictionaryEntryToVocabData,
 normalizeDictionaryHeadword,
} from "@/services/vocab.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const generateVocabRequestSchema = z.object({
 hanzi: z.string().min(1).max(10),
});

function runtimeError(status: "missing-key" | "storage-unavailable") {
 return status === "missing-key"
  ? NextResponse.json(
     { error: "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI." },
     { status: 409 },
    )
  : NextResponse.json({ error: "Kho API key an toàn phía server chưa sẵn sàng." }, { status: 503 });
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const parsed = generateVocabRequestSchema.safeParse(await request.json());
 if (!parsed.success) {
  return NextResponse.json({ error: "Invalid hanzi parameter" }, { status: 400 });
 }
 const { hanzi } = parsed.data;

 const lookupText = normalizeDictionaryHeadword(hanzi);
 const cachedDictionary = await getDictionaryEntryByHeadword(supabase, lookupText);

 if (cachedDictionary) {
  const cachedData = mapDictionaryEntryToVocabData(cachedDictionary);
  if (hasInspectorDeepDiveData(cachedData.ai_analysis)) {
   return NextResponse.json({
    data: cachedData.ai_analysis || {},
    cached: true,
   });
  }
 }

 const existing = await getVocabByHanzi(supabase, lookupText);
 const existingAi = getVocabularyAnalysis(existing);

 if (hasInspectorDeepDiveData(existingAi)) {
  return NextResponse.json({ data: existingAi, cached: true });
 }

 const runtime = await resolveAiAnalysisRuntime({ supabase, userId: user.id });
 if (!runtime.ok) return runtimeError(runtime.status);

 const promptSettings = await getUserAiPromptSettings(supabase, user.id);
 const aiLookup = await analyzeHanziDetailed(lookupText, {
  geminiModel: promptSettings.geminiModel,
  promptTemplate: promptSettings.wordLookupPrompt,
  userApiKeys: [runtime.credential],
  allowGroq: true,
 });

 if (!aiLookup.data) {
  return NextResponse.json(
   {
    error:
     aiLookup.error ||
     "Không thể generate nghĩa tiếng Việt lúc này vì AI provider đang unavailable.",
   },
   { status: 503 },
  );
 }

 // Deep analysis can use learner-owned prompt/model settings. It is returned to
 // that request only and must not overwrite the shared canonical dictionary.
 return NextResponse.json({ data: aiLookup.data, cached: false });
}
