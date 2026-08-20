import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role.server", () => ({
 createServiceRoleSupabaseClient: vi.fn(),
}));

import { listDueLearningLoopItemsWithExecutor } from "./learning-loop-repository";

describe("listDueLearningLoopItems", () => {
 it("filters the queue by server time and bounds the result count", async () => {
  const execute = vi.fn().mockResolvedValue({ data: [], error: null });
  const now = new Date("2026-08-20T01:00:00.000Z");

  await expect(
   listDueLearningLoopItemsWithExecutor("user-1", execute, { now, limit: 25 }),
  ).resolves.toEqual([]);

  expect(execute).toHaveBeenCalledWith({
   userId: "user-1",
   dueBefore: "2026-08-20T01:00:00.000Z",
   limit: 25,
  });
 });

 it("clamps oversized due-queue requests", async () => {
  const execute = vi.fn().mockResolvedValue({ data: [], error: null });

  await listDueLearningLoopItemsWithExecutor("user-1", execute, { limit: 10_000 });

  expect(execute).toHaveBeenCalledOnce();
  expect(execute.mock.calls[0]?.[0]).toMatchObject({ userId: "user-1", limit: 100 });
 });

 it("surfaces repository errors before parsing rows", async () => {
  const execute = vi.fn().mockResolvedValue({
   data: null,
   error: { message: "queue unavailable" },
  });

  await expect(listDueLearningLoopItemsWithExecutor("user-1", execute)).rejects.toThrow(
   "queue unavailable",
  );
 });
});
