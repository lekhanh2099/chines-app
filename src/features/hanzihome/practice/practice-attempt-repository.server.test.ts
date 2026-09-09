import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServiceRoleSupabaseClient } = vi.hoisted(() => ({
 createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role.server", () => ({ createServiceRoleSupabaseClient }));
vi.mock("@/features/reading/repositories/reading-content.repository", () => ({
 getReaderAsset: vi.fn(),
 getReaderDocument: vi.fn(),
}));

import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-repository.server";

const userId = "98321546-f73c-44d9-8077-25ff5a563c79";
const attemptId = "af84c8d0-aa7f-4af7-a4b7-71ff6e887a35";
const attemptRow = {
 id: attemptId,
 user_id: userId,
 surface: "review",
 content_id: "vocab:词语",
 direction: null,
 answer: {
  kind: "review",
  itemType: "vocab",
  result: "hard",
 },
 score: null,
 response_ms: null,
 created_at: "2026-08-20T04:00:00.000Z",
};

describe("savePracticeAttempt", () => {
 beforeEach(() => {
  createServiceRoleSupabaseClient.mockReset();
 });

 it("uses the caller-provided UUID as the durable attempt identity", async () => {
  const single = vi.fn().mockResolvedValue({ data: attemptRow, error: null });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  createServiceRoleSupabaseClient.mockReturnValue({ from });

  await expect(
   savePracticeAttempt(
    {
     attemptId,
     surface: "review",
     contentId: "vocab:词语",
     direction: null,
     answer: attemptRow.answer,
     scorePercent: null,
     responseMs: null,
    },
    userId,
   ),
  ).resolves.toEqual(attemptRow);

  expect(insert).toHaveBeenCalledWith({
   id: attemptId,
   user_id: userId,
   surface: "review",
   content_id: "vocab:词语",
   direction: null,
   answer: attemptRow.answer,
   score: null,
   response_ms: null,
  });
 });

 it("resolves a duplicate UUID retry to the existing owner attempt", async () => {
  const firstSingle = vi.fn().mockResolvedValue({
   data: null,
   error: { code: "23505", message: "duplicate key" },
  });
  const firstSelect = vi.fn().mockReturnValue({ single: firstSingle });
  const insert = vi.fn().mockReturnValue({ select: firstSelect });

  const lookupQuery = {
   eq: vi.fn(),
   maybeSingle: vi.fn().mockResolvedValue({ data: attemptRow, error: null }),
  };
  lookupQuery.eq.mockReturnValue(lookupQuery);
  const lookupSelect = vi.fn().mockReturnValue(lookupQuery);
  const from = vi
   .fn()
   .mockReturnValueOnce({ insert })
   .mockReturnValueOnce({ select: lookupSelect });
  createServiceRoleSupabaseClient.mockReturnValue({ from });

  await expect(
   savePracticeAttempt(
    {
     attemptId,
     surface: "review",
     contentId: "vocab:词语",
     direction: null,
     answer: attemptRow.answer,
     scorePercent: null,
     responseMs: null,
    },
    userId,
   ),
  ).resolves.toEqual(attemptRow);

  expect(lookupQuery.eq).toHaveBeenNthCalledWith(1, "user_id", userId);
  expect(lookupQuery.eq).toHaveBeenNthCalledWith(2, "id", attemptId);
  expect(lookupQuery.maybeSingle).toHaveBeenCalledOnce();
 });
});
