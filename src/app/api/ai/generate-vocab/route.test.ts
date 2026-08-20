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

vi.mock("server-only", () => ({}));
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
 getVocabByHanzi: mocks.getVocabByHanzi,
 hasInspectorDeepDiveData: mocks.hasInspectorDeepDiveData,
 getVocabularyAnalysis: (value: { ai_analysis?: object } | null) => value?.ai_analysis ?? {},
 mapDictionaryEntryToVocabData: (entry: {
  id: string;
  headword: string;
  ai_analysis?: object;
 }) => ({
  id: undefined,
  dictionary_id: entry.id,
  hanzi: entry.headword,
  pinyin: "nǐ hǎo",
  meaning: "xin chào",
  ai_analysis: entry.ai_analysis ?? {},
 }),
 normalizeDictionaryHeadword: (value: string) => value.trim(),
}));

import { POST } from "./route";

function request(hanzi: string) {
 return new NextRequest("https://app.example/api/ai/generate-vocab", {
  method: "POST",
  body: JSON.stringify({ hanzi }),
 });
}

const credential = {
 id: "11111111-1111-4111-8111-111111111111",
 userId: "user-1",
 provider: "groq",
 label: "Groq",
 maskedKey: "gsk_***",
 isActive: true,
 priority: 0,
 defaultModel: "openai/gpt-oss-20b",
 lastValidatedAt: null,
 createdAt: "2026-08-19T00:00:00.000Z",
 updatedAt: "2026-08-19T00:00:00.000Z",
 apiKey: "gsk-personal",
};

describe("POST /api/ai/generate-vocab", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(null);
  mocks.getVocabByHanzi.mockResolvedValue(null);
  mocks.hasInspectorDeepDiveData.mockReturnValue(false);
  mocks.getUserAiPromptSettings.mockResolvedValue({
   geminiModel: "gemini-2.5-flash",
   wordLookupPrompt: "Explain",
  });
 });

 it("serves a deep cached analysis without resolving a runtime", async () => {
  const analysis = { mnemonic_story: "cache" };
  mocks.getDictionaryEntryByHeadword.mockResolvedValue({
   id: "22222222-2222-4222-8222-222222222222",
   headword: "你好",
   ai_analysis: analysis,
  });
  mocks.hasInspectorDeepDiveData.mockReturnValue(true);

  const response = await POST(request("你好"));

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ cached: true, data: analysis });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
  expect(mocks.analyzeHanziDetailed).not.toHaveBeenCalled();
 });

 it("blocks new generation when no personal key is available", async () => {
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await POST(request("生僻词"));

  expect(response.status).toBe(409);
  expect(mocks.analyzeHanziDetailed).not.toHaveBeenCalled();
 });

 it("passes exactly the credential selected by shared runtime authority", async () => {
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({
   ok: true,
   runtime: { keyId: credential.id },
   credential,
  });
  mocks.analyzeHanziDetailed.mockResolvedValue({ data: null, error: "provider unavailable" });

  const response = await POST(request("生僻词"));

  expect(response.status).toBe(503);
  expect(mocks.analyzeHanziDetailed).toHaveBeenCalledWith(
   "生僻词",
   expect.objectContaining({ userApiKeys: [credential], allowGroq: true }),
  );
 });

 it("returns learner-configured deep analysis without promoting it to canonical storage", async () => {
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({
   ok: true,
   runtime: { keyId: credential.id },
   credential,
  });
  const analysis = {
   hanzi: "学习",
   pinyin: "xué xí",
   sino_vietnamese: "học tập",
   meaning_summary: "học; học tập",
  };
  mocks.analyzeHanziDetailed.mockResolvedValue({ data: analysis, error: null });

  const response = await POST(request("学习"));

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ data: analysis, cached: false });
 });
});
