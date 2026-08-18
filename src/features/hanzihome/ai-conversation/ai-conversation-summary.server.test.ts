import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";

const { generateStructuredAiConversationData, loadAiConversationMessageRange } = vi.hoisted(() => ({
 generateStructuredAiConversationData: vi.fn(),
 loadAiConversationMessageRange: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./ai-conversation-memory-persistence.server", () => ({ loadAiConversationMessageRange }));
vi.mock("./ai-conversation-structured.server", () => ({ generateStructuredAiConversationData }));

import { buildAiConversationSummaryUpdate } from "./ai-conversation-summary.server";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});
const conversationId = "11111111-1111-4111-8111-111111111111";

function messages(count: number, contentSize: number) {
 return Array.from({ length: count }, (_, index) => ({
  id: `message-${index + 1}`,
  seq: index + 1,
  role: index % 2 === 0 ? "user" : "assistant",
  content: `${index + 1}-${"中".repeat(contentSize)}`,
 }));
}

describe("AI conversation thread summary compaction", () => {
 beforeEach(() => {
  generateStructuredAiConversationData.mockReset();
  loadAiConversationMessageRange.mockReset();
  generateStructuredAiConversationData.mockImplementation(async ({ prompt }) => ({
   data: { summary: `summary-${prompt.length}` },
   error: null,
  }));
 });

 it("does not compact while the old-message span is below both pressure thresholds", async () => {
  loadAiConversationMessageRange.mockResolvedValue(messages(4, 100));

  const result = await buildAiConversationSummaryUpdate({
   supabase,
   userId: "user-1",
   conversation: {
    id: conversationId,
    character_id: "22222222-2222-4222-8222-222222222222",
    memory_policy: "inherit",
    summary: "",
    summary_until_seq: 0,
    summary_version: 1,
    last_message_seq: 16,
   },
  });

  expect(result).toBeNull();
  expect(generateStructuredAiConversationData).not.toHaveBeenCalled();
 });

 it("chunks large compaction input so every provider prompt remains inside the conversation message contract", async () => {
  loadAiConversationMessageRange.mockResolvedValue(messages(30, 500));

  const result = await buildAiConversationSummaryUpdate({
   supabase,
   userId: "user-1",
   conversation: {
    id: conversationId,
    character_id: "22222222-2222-4222-8222-222222222222",
    memory_policy: "inherit",
    summary: "previous summary ".repeat(300),
    summary_until_seq: 0,
    summary_version: 1,
    last_message_seq: 42,
   },
  });

  expect(result).toMatchObject({ summaryUntilSeq: 30, expectedSummaryVersion: 1 });
  expect(generateStructuredAiConversationData.mock.calls.length).toBeGreaterThan(1);
  for (const [request] of generateStructuredAiConversationData.mock.calls) {
   expect(request.prompt.length).toBeLessThan(6000);
  }
 });

 it("rebases every fifth summary version from raw transcript instead of feeding the persisted summary", async () => {
  const rawMessages = messages(18, 420);
  loadAiConversationMessageRange.mockResolvedValue(rawMessages);

  const result = await buildAiConversationSummaryUpdate({
   supabase,
   userId: "user-1",
   conversation: {
    id: conversationId,
    character_id: "22222222-2222-4222-8222-222222222222",
    memory_policy: "inherit",
    summary: "STALE_RECURSIVE_SUMMARY_SHOULD_NOT_ENTER_REBASE",
    summary_until_seq: 0,
    summary_version: 4,
    last_message_seq: 30,
   },
  });

  expect(result).toMatchObject({ summaryUntilSeq: 18, expectedSummaryVersion: 4 });
  const firstRequest = generateStructuredAiConversationData.mock.calls[0]?.[0];
  expect(firstRequest?.prompt).toContain('Previous continuity summary: ""');
  expect(firstRequest?.prompt).not.toContain("STALE_RECURSIVE_SUMMARY_SHOULD_NOT_ENTER_REBASE");
 });
});
