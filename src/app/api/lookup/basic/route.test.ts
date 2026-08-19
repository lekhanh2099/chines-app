import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 analyzeHanziBasicDetailed: vi.fn(),
 getDictionaryEntryByHeadword: vi.fn(),
 getUser: vi.fn(),
 getVocabByHanzi: vi.fn(),
 resolveAiAnalysisRuntime: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));
vi.mock("@/services/ai-analysis-runtime.service", () => ({
 resolveAiAnalysisRuntime: mocks.resolveAiAnalysisRuntime,
}));
vi.mock("@/services/ai.service", () => ({
 analyzeHanziBasicDetailed: mocks.analyzeHanziBasicDetailed,
}));
vi.mock("@/services/vocab.service", () => ({
 getBasicVocabData: (value: object) => value,
 getDictionaryEntryByHeadword: mocks.getDictionaryEntryByHeadword,
 getPrimaryMeaning: (_analysis: object, fallback: string) => fallback,
 getVocabularyAnalysis: () => ({}),
 getVocabByHanzi: mocks.getVocabByHanzi,
 mapDictionaryEntryToVocabData: (entry: { id: string; headword: string }) => ({
  id: undefined,
  dictionary_id: entry.id,
  hanzi: entry.headword,
  pinyin: "nǐ hǎo",
  sino_vietnamese: undefined,
  meaning: "xin chào",
  ai_analysis: {},
 }),
 normalizeDictionaryHeadword: (value: string) => value.trim(),
 syncDictionaryEntryToLegacyVocab: vi.fn(),
 upsertDictionaryEntry: vi.fn(),
 upsertVocab: vi.fn(),
}));

import { POST } from "./route";

function request(body: object) {
 return new NextRequest("https://app.example/api/lookup/basic", {
  method: "POST",
  body: JSON.stringify(body),
 });
}

describe("POST /api/lookup/basic", () => {
 beforeEach(() => {
  for (const mock of [
   mocks.analyzeHanziBasicDetailed,
   mocks.getDictionaryEntryByHeadword,
   mocks.getUser,
   mocks.getVocabByHanzi,
   mocks.resolveAiAnalysisRuntime,
  ]) {
   mock.mockReset();
  }
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(null);
  mocks.getVocabByHanzi.mockResolvedValue(null);
 });

 it("rejects unauthenticated lookups before parsing or querying content", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(request({ text: "你好" }));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
 });

 it("rejects invalid lookup payloads at the route boundary", async () => {
  const response = await POST(request({ text: "" }));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Invalid basic lookup payload" });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
 });

 it("serves a usable dictionary meaning without requiring any provider key", async () => {
  mocks.getDictionaryEntryByHeadword.mockResolvedValue({
   id: "11111111-1111-4111-8111-111111111111",
   headword: "你好",
  });

  const response = await POST(request({ text: "你好" }));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({
   cached: true,
   source: "dictionary_core",
   data: { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "xin chào" },
  });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
  expect(mocks.analyzeHanziBasicDetailed).not.toHaveBeenCalled();
 });

 it("returns a missing-key state when AI fallback is actually required", async () => {
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await POST(request({ text: "生僻词" }));

  expect(response.status).toBe(409);
  expect(mocks.analyzeHanziBasicDetailed).not.toHaveBeenCalled();
 });
});
