import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

vi.mock("@/features/hanzihome/local/content-cache-store", () => ({
 bumpLessonCacheGenerations: vi.fn().mockResolvedValue(undefined),
}));

import { invalidateHanziHomeContent } from "./invalidate-content";

it("refreshes vocabulary store queries after a vocabulary edit", async () => {
 const queryClient = new QueryClient();
 const reused = hanzihomeQueryKeys.reusedVocabulary("user-1");
 const word = hanzihomeQueryKeys.vocabularyWord("user-1", "行");
 queryClient.setQueryData(reused, new Set(["行"]));
 queryClient.setQueryData(word, []);

 await invalidateHanziHomeContent({ queryClient, lessonId: "lesson-1", entityType: "vocab_item" });

 expect(queryClient.getQueryState(reused)?.isInvalidated).toBe(true);
 expect(queryClient.getQueryState(word)?.isInvalidated).toBe(true);
});
