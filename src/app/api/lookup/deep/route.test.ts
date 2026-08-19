import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 analyzeHanziDetailed: vi.fn(),
 getDictionaryEntryByHeadword: vi.fn(),
 getUser: vi.fn(),
 getUserAiPromptSettings: vi.fn(),
 getVocabByHanzi: vi.fn(),
 hasInspectorDeepDiveData: vi.fn(),
 resolveAiAnalysisRuntime: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));
vi.mock("@/services/ai-analysis-runtime.service", () => ({
 resolveAiAnalysisRuntime: mocks.resolveAiAnalysisRuntime,
}));
vi.mock("@/services/ai-prompt-settings.service", () => ({
 getUserAiPromptSettings: mocks.getUserAiPromptSettings,
}));
vi.mock("@/services/ai.service", () => ({ analyzeHanziDetailed: mocks.analyzeHanziDetailed }));
vi.mock("@/services/vocab.service", () => ({
 getDictionaryEntryByHeadword: mocks.getDictionaryEntryByHeadword,
 getPrimaryMeaning: (_analysis: object, fallback: string) => fallback,
 getVocabularyAnalysis: (value: { ai_analysis?: object } | null) => value?.ai_analysis ?? {},
 getVocabByHanzi: mocks.getVocabByHanzi,
 hasInspectorDeepDiveData: mocks.hasInspectorDeepDiveData,
 mapDictionaryEntryToVocabData: (entry: {
  id: string;
  headword: string;
  ai_analysis?: object;
 }) => ({
  id: undefined,
  dictionary_id: entry.id,
  hanzi: entry.headword,
  pinyin: "jǐn liàng",
  sino_vietnamese: "tận lượng",
  meaning: "cố gắng hết mức",
  ai_analysis: entry.ai_analysis ?? {},
 }),
 normalizeDictionaryHeadword: (value: string) => value.trim(),
 syncDictionaryEntryToLegacyVocab: vi.fn(),
 upsertDictionaryEntry: vi.fn(),
 upsertVocab: vi.fn(),
}));

import { POST } from "./route";

function request(text: string) {
 return new NextRequest("https://app.example/api/lookup/deep", {
  method: "POST",
  body: JSON.stringify({ text }),
 });
}

describe("POST /api/lookup/deep", () => {
 beforeEach(() => {
  for (const mock of [
   mocks.analyzeHanziDetailed,
   mocks.getDictionaryEntryByHeadword,
   mocks.getUser,
   mocks.getUserAiPromptSettings,
   mocks.getVocabByHanzi,
   mocks.hasInspectorDeepDiveData,
   mocks.resolveAiAnalysisRuntime,
  ]) {
   mock.mockReset();
  }
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(null);
  mocks.getVocabByHanzi.mockResolvedValue(null);
  mocks.hasInspectorDeepDiveData.mockReturnValue(false);
  mocks.getUserAiPromptSettings.mockResolvedValue({
   geminiModel: "gemini-2.5-flash",
   wordLookupPrompt: "Explain",
  });
 });

 it("returns a complete cached deep analysis without resolving AI runtime", async () => {
  mocks.getDictionaryEntryByHeadword.mockResolvedValue({
   id: "11111111-1111-4111-8111-111111111111",
   headword: "尽量",
   ai_analysis: { mnemonic_story: "cache" },
  });
  mocks.hasInspectorDeepDiveData.mockReturnValue(true);

  const response = await POST(request("尽量"));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({
   cached: true,
   data: { hanzi: "尽量", meaning: "cố gắng hết mức" },
  });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
  expect(mocks.analyzeHanziDetailed).not.toHaveBeenCalled();
 });

 it("returns missing-key instead of invoking a system provider on a cache miss", async () => {
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await POST(request("生僻词"));

  expect(response.status).toBe(409);
  expect(mocks.analyzeHanziDetailed).not.toHaveBeenCalled();
 });
});
