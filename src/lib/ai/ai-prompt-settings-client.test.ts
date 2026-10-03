import { afterEach, describe, expect, it, vi } from "vitest";

import {
 defaultClientAiPromptSettings,
 loadClientAiPromptSettings,
 saveClientAiPromptSettings,
} from "./ai-prompt-settings-client";

function createStorage(initial: Record<string, string> = {}): Storage {
 const values = new Map(Object.entries(initial));
 return {
  get length() {
   return values.size;
  },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
 };
}

afterEach(() => vi.unstubAllGlobals());

describe("client AI prompt settings storage", () => {
 it("migrates a legacy payload and normalizes an unknown model", () => {
  const localStorage = createStorage({
   "ai-prompt-settings": JSON.stringify({
    wordLookupPrompt: "custom word prompt",
    sentenceLookupPrompt: "custom sentence prompt",
    geminiModel: "removed-model",
   }),
  });
  vi.stubGlobal("window", { localStorage });

  const migrated = loadClientAiPromptSettings();
  expect(migrated.geminiModel).toBe(defaultClientAiPromptSettings.geminiModel);
  expect(migrated.wordLookupPrompt).toContain("custom word prompt");
  expect(migrated.wordLookupPrompt).toContain("{WORD}");
  expect(migrated.sentenceLookupPrompt).toContain("custom sentence prompt");
  expect(migrated.sentenceLookupPrompt).toContain("{SENTENCE}");
 });

 it("writes a versioned payload and falls back when storage is corrupted", () => {
  const localStorage = createStorage();
  vi.stubGlobal("window", { localStorage });

  const saved = saveClientAiPromptSettings(defaultClientAiPromptSettings);
  expect(loadClientAiPromptSettings()).toEqual(saved);

  localStorage.setItem("ai-prompt-settings", "{");
  expect(loadClientAiPromptSettings()).toEqual(defaultClientAiPromptSettings);
 });
});
