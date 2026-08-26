import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 analyzeHanziBasicDetailed: vi.fn(),
 createServiceRoleSupabaseClient: vi.fn(),
 getDictionaryEntryByHeadword: vi.fn(),
 getUser: vi.fn(),
 getVocabByHanzi: vi.fn(),
 resolveAiAnalysisRuntime: vi.fn(),
 syncDictionaryEntryToLegacyCacheAsServer: vi.fn(),
 upsertDictionaryEntry: vi.fn(),
 upsertLegacyVocabularyCacheAsServer: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));
vi.mock("@/lib/supabase/service-role.server", () => ({
 createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));
vi.mock("@/features/dictionary/server/dictionary-persistence.server", () => ({
 syncDictionaryEntryToLegacyCacheAsServer: mocks.syncDictionaryEntryToLegacyCacheAsServer,
 upsertLegacyVocabularyCacheAsServer: mocks.upsertLegacyVocabularyCacheAsServer,
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
 getPrimaryMeaning: (_analysis: { meaning_summary?: string }, fallback: string) =>
  _analysis.meaning_summary || fallback,
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
 upsertDictionaryEntry: mocks.upsertDictionaryEntry,
}));

import { POST } from "./route";

function request(body: object) {
 return new NextRequest("https://app.example/api/lookup/basic", {
  method: "POST",
  body: JSON.stringify(body),
 });
}

describe("POST /api/lookup/basic", () => {
 const authority = { scope: "service-role" };
 const credential = {
  provider: "gemini",
  apiKey: "redacted",
  label: "test",
  defaultModel: "gemini-2.5-flash",
 };
 const runtime = {
  taskId: "lookup.quick",
  resolutionSource: "auto",
  keyId: "11111111-1111-4111-8111-111111111111",
  provider: "gemini",
  providerLabel: "Google Gemini",
  label: "test",
  maskedKey: "AIza***",
  model: "gemini-2.5-flash",
  priority: 0,
  apiKey: "redacted",
  capabilities: ["lookup"],
 };

 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(null);
  mocks.getVocabByHanzi.mockResolvedValue(null);
  mocks.createServiceRoleSupabaseClient.mockReturnValue(authority);
 });

 it("rejects unauthenticated lookups before parsing or querying content", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(request({ text: "你好" }));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("rejects invalid lookup payloads at the route boundary", async () => {
  const response = await POST(request({ text: "" }));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Invalid basic lookup payload" });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
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
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
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
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("keeps fixed basic word enrichment transient until the user saves it", async () => {
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({ ok: true, credential, runtime });
  mocks.analyzeHanziBasicDetailed.mockResolvedValue({
   data: {
    hanzi: "学习",
    pinyin: "xué xí",
    sino_vietnamese: "học tập",
    meaning_summary: "học; học tập",
   },
   error: null,
  });
  const response = await POST(request({ text: "学习" }));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({
   cached: false,
   source: "ai_basic_transient",
   provenance: "ai-transient",
   data: { hanzi: "学习", meaning: "học; học tập" },
  });
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
  expect(mocks.upsertDictionaryEntry).not.toHaveBeenCalled();
  expect(mocks.syncDictionaryEntryToLegacyCacheAsServer).not.toHaveBeenCalled();
 });

 it("keeps long selections transient instead of creating shared dictionary rows", async () => {
  const longSelection =
   "这是一个用于阅读理解的很长中文句子它不应该作为共享词典词头被保存下来超过三十二个汉字";
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({ ok: true, credential, runtime });
  mocks.analyzeHanziBasicDetailed.mockResolvedValue({
   data: {
    hanzi: longSelection,
    pinyin: "",
    meaning_summary: "một câu dài dùng để đọc hiểu",
   },
   error: null,
  });

  const response = await POST(request({ text: longSelection }));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({
   cached: false,
   source: "ai_basic_transient",
   data: { hanzi: longSelection, meaning: "một câu dài dùng để đọc hiểu" },
  });
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
  expect(mocks.upsertDictionaryEntry).not.toHaveBeenCalled();
  expect(mocks.upsertLegacyVocabularyCacheAsServer).not.toHaveBeenCalled();
 });
});
