import { describe, expect, it } from "vitest";
import {
 AI_MODEL_FILES,
 TOTAL_APPROXIMATE_MODEL_BYTES,
 checkAiModelReady,
 getAiModelStorageEstimate,
} from "./offline-ai-model";

describe("offline-ai-model", () => {
 it("defines expected Hugging Face VITS AISHELL-3 assets", () => {
  expect(AI_MODEL_FILES.length).toBe(3);
  expect(AI_MODEL_FILES.map((f) => f.name)).toEqual(["model.onnx", "tokens.txt", "lexicon.txt"]);
  expect(TOTAL_APPROXIMATE_MODEL_BYTES).toBeGreaterThan(40_000_000);
 });

 it("returns false when window.caches is not available", async () => {
  const ready = await checkAiModelReady();
  expect(ready).toBe(false);

  const estimate = await getAiModelStorageEstimate();
  expect(estimate.isReady).toBe(false);
  expect(estimate.sizeBytes).toBe(0);
 });
});
