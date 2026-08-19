import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 analyzeHanziDetailed: vi.fn(),
 analyzeSentenceDetailed: vi.fn(),
 getDictionaryEntryByHeadword: vi.fn(),
 getUser: vi.fn(),
 getUserAiPromptSettings: vi.fn(),
 getVocabByHanzi: vi.fn(),
 incrementDictionaryLookupCount: vi.fn(),
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
vi.mock("@/services/ai.service", () => ({
 analyzeHanziDetailed: mocks.analyzeHanziDetailed,
 analyzeSentenceDetailed: mocks.analyzeSentenceDetailed,
}));
vi.mock("@/services/vocab.service", () => ({
 getDictionaryEntryByHeadword: mocks.getDictionaryEntryByHeadword,
 incrementDictionaryLookupCount: mocks.incrementDictionaryLookupCount,
 mapDictionaryEntryToVocabData: (entry: { id: string; headword: string }) => ({
  id: undefined,
  dictionary_id: entry.id,
  hanzi: entry.headword,
  pinyin: "nǐ hǎo",
  sino_vietnamese: null,
  meaning: "xin chào",
  ai_analysis: {},
 }),
 normalizeDictionaryHeadword: (value: string) => value.trim(),
 getPrimaryMeaning: (_analysis: object, fallback: string) => fallback,
 getVocabByHanzi: mocks.getVocabByHanzi,
 getVocabularyAnalysis: () => ({}),
 hasDetailedVocabAnalysis: () => false,
 isGenericEnglishFallbackAnalysis: () => false,
 syncDictionaryEntryToLegacyVocab: vi.fn(),
 upsertDictionaryEntry: vi.fn(),
 upsertVocab: vi.fn(),
}));

import { POST } from "./route";

function request(body: object) {
 return new NextRequest("https://app.example/api/lookup", {
  method: "POST",
  body: JSON.stringify(body),
 });
}

describe("POST /api/lookup", () => {
 beforeEach(() => {
  for (const mock of [
   mocks.analyzeHanziDetailed,
   mocks.analyzeSentenceDetailed,
   mocks.getDictionaryEntryByHeadword,
   mocks.getUser,
   mocks.getUserAiPromptSettings,
   mocks.getVocabByHanzi,
   mocks.incrementDictionaryLookupCount,
   mocks.resolveAiAnalysisRuntime,
  ]) {
   mock.mockReset();
  }
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(null);
  mocks.getVocabByHanzi.mockResolvedValue(null);
  mocks.getUserAiPromptSettings.mockResolvedValue({
   geminiModel: "gemini-2.5-flash",
   wordLookupPrompt: "word",
   sentenceLookupPrompt: "sentence",
  });
 });

 it("rejects unauthenticated dictionary lookups", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(request({ text: "你好", type: "word" }));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
 });

 it("rejects unsupported lookup types at the route boundary", async () => {
  const response = await POST(request({ text: "你好", type: "unsupported" }));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Invalid lookup payload" });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
 });

 it("returns a dictionary cache hit without resolving an AI runtime", async () => {
  mocks.getDictionaryEntryByHeadword.mockResolvedValue({
   id: "11111111-1111-4111-8111-111111111111",
   headword: "你好",
   lookup_count: 3,
  });

  const response = await POST(request({ text: "你好", type: "word" }));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({
   cached: true,
   data: { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "xin chào" },
  });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
  expect(mocks.analyzeHanziDetailed).not.toHaveBeenCalled();
 });

 it("blocks sentence generation instead of falling back to a system provider", async () => {
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await POST(request({ text: "今天天气很好。", type: "sentence" }));

  expect(response.status).toBe(409);
  expect(mocks.analyzeSentenceDetailed).not.toHaveBeenCalled();
 });
});
