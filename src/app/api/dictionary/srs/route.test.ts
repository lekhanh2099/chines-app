import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 verifyExpectedAuthenticatedOwner: vi.fn(),
 createServiceRoleSupabaseClient: vi.fn(),
 getDictionaryEntryByHeadword: vi.fn(),
 getVocabByHanzi: vi.fn(),
 getVocabularyAnalysis: vi.fn(),
 upsertDictionaryEntry: vi.fn(),
 saveCanonicalDictionaryEntryToSrsAsServer: vi.fn(),
 resolveAiAnalysisRuntime: vi.fn(),
 analyzeHanziBasicDetailed: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner: mocks.verifyExpectedAuthenticatedOwner,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));
vi.mock("@/lib/supabase/service-role.server", () => ({
 createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));
vi.mock("@/features/dictionary/server/dictionary-persistence.server", () => ({
 saveCanonicalDictionaryEntryToSrsAsServer: mocks.saveCanonicalDictionaryEntryToSrsAsServer,
}));
vi.mock("@/services/ai-analysis-runtime.service", () => ({
 resolveAiAnalysisRuntime: mocks.resolveAiAnalysisRuntime,
}));
vi.mock("@/services/ai.service", () => ({
 analyzeHanziBasicDetailed: mocks.analyzeHanziBasicDetailed,
}));
vi.mock("@/services/vocab.service", () => ({
 getDictionaryEntryByHeadword: mocks.getDictionaryEntryByHeadword,
 getVocabByHanzi: mocks.getVocabByHanzi,
 getVocabularyAnalysis: mocks.getVocabularyAnalysis,
 getPrimaryMeaning: (_analysis: { meaning_summary?: string }, fallback: string) =>
  _analysis.meaning_summary || fallback,
 normalizeDictionaryHeadword: (value: string) => value.trim(),
 upsertDictionaryEntry: mocks.upsertDictionaryEntry,
}));

import { POST } from "./route";

function post(body: object) {
 return new Request("https://app.example/api/dictionary/srs", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": "user-1" },
  body: JSON.stringify(body),
 });
}

describe("POST /api/dictionary/srs", () => {
 const authContext = {
  user: { id: "user-1" },
  supabase: { scope: "session" },
 };
 const authority = { scope: "service-role" };
 const canonical = {
  id: "dictionary-1",
  headword: "学习",
  pinyin: "xué xí",
  sino_vietnamese: "học tập",
  meaning: "học; học tập",
  ai_analysis: {},
 };
 const saved = {
  vocabId: "vocab-1",
  dictionaryId: "dictionary-1",
  contextSchemaAvailable: true,
  noteSchemaAvailable: true,
 };

 beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: authContext });
  mocks.verifyExpectedAuthenticatedOwner.mockReturnValue(null);
  mocks.createServiceRoleSupabaseClient.mockReturnValue(authority);
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(canonical);
  mocks.getVocabByHanzi.mockResolvedValue(null);
  mocks.getVocabularyAnalysis.mockReturnValue({});
  mocks.saveCanonicalDictionaryEntryToSrsAsServer.mockResolvedValue(saved);
 });

 it("returns the auth boundary response before creating privileged authority", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await POST(post({ hanzi: "学习" }));

  expect(response.status).toBe(401);
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("rejects an auth-owner mismatch before privileged work", async () => {
  mocks.verifyExpectedAuthenticatedOwner.mockReturnValue(
   Response.json({ error: "owner mismatch", code: "AUTH_OWNER_MISMATCH" }, { status: 412 }),
  );

  const response = await POST(post({ hanzi: "学习" }));

  expect(response.status).toBe(412);
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("rejects browser-supplied canonical dictionary fields", async () => {
  const response = await POST(
   post({
    hanzi: "学习",
    meaning: "poisoned canonical meaning",
    ai_analysis: { injected: true },
   }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ code: "INVALID_PAYLOAD" });
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("saves user-owned SRS state from the server-resolved canonical entry", async () => {
  const response = await POST(
   post({
    hanzi: "学习",
    contextSentence: "我每天学习中文。",
    personalNote: "复习",
   }),
  );

  expect(response.status).toBe(200);
  expect(mocks.saveCanonicalDictionaryEntryToSrsAsServer).toHaveBeenCalledWith({
   authority,
   userId: "user-1",
   entry: canonical,
   options: {
    contextSentence: "我每天学习中文。",
    contextTranslation: undefined,
    personalNote: "复习",
    personalNoteMode: undefined,
   },
  });
  await expect(response.json()).resolves.toEqual(saved);
 });

 it("canonicalizes only trusted server-read legacy data when dictionary_core is missing", async () => {
  const legacy = {
   id: "legacy-1",
   hanzi: "学习",
   pinyin: "xué xí",
   sino_vietnamese: "học tập",
   meaning: "học; học tập",
  };
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(null);
  mocks.getVocabByHanzi.mockResolvedValue(legacy);
  mocks.getVocabularyAnalysis.mockReturnValue({ source: "legacy" });
  mocks.upsertDictionaryEntry.mockResolvedValue(canonical);

  const response = await POST(post({ hanzi: "学习" }));

  expect(response.status).toBe(200);
  expect(mocks.upsertDictionaryEntry).toHaveBeenCalledWith(authority, {
   headword: "学习",
   pinyin: "xué xí",
   sinoVietnamese: "học tập",
   meaning: "học; học tập",
   ai_analysis: { source: "legacy" },
  });
  expect(mocks.resolveAiAnalysisRuntime).not.toHaveBeenCalled();
 });

 it("uses the fixed basic AI contract when neither canonical nor legacy content exists", async () => {
  mocks.getDictionaryEntryByHeadword.mockResolvedValue(null);
  mocks.getVocabByHanzi.mockResolvedValue(null);
  mocks.resolveAiAnalysisRuntime.mockResolvedValue({
   ok: true,
   credential: {
    provider: "gemini",
    apiKey: "redacted",
    label: "test",
    defaultModel: "gemini-2.5-flash",
   },
  });
  mocks.analyzeHanziBasicDetailed.mockResolvedValue({
   data: {
    hanzi: "学习",
    pinyin: "xué xí",
    sino_vietnamese: "học tập",
    meaning_summary: "học; học tập",
   },
   error: null,
  });
  mocks.upsertDictionaryEntry.mockResolvedValue(canonical);

  const response = await POST(post({ hanzi: "学习" }));

  expect(response.status).toBe(200);
  expect(mocks.resolveAiAnalysisRuntime).toHaveBeenCalledWith({
   supabase: authContext.supabase,
   userId: "user-1",
  });
  expect(mocks.analyzeHanziBasicDetailed).toHaveBeenCalledWith("学习", {
   userApiKeys: [expect.objectContaining({ provider: "gemini" })],
   allowGroq: true,
  });
  expect(mocks.upsertDictionaryEntry).toHaveBeenCalledWith(authority, {
   headword: "学习",
   pinyin: "xué xí",
   sinoVietnamese: "học tập",
   meaning: "học; học tập",
   ai_analysis: expect.objectContaining({ meaning_summary: "học; học tập" }),
  });
 });
});
