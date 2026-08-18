import { describe, expect, it } from "vitest";

import type { AppLocale } from "./config";
import { loadAppMessages } from "./messages";

function collectLeafKeys(value: object, prefix = ""): string[] {
 return Object.entries(value).flatMap(([key, nestedValue]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
   return collectLeafKeys(nestedValue, path);
  }
  return [path];
 });
}

const translatedLocales = ["en", "zh-CN"] satisfies readonly AppLocale[];
const appLocales = ["vi", ...translatedLocales] satisfies readonly AppLocale[];

describe("i18n message contracts", () => {
 it.each(translatedLocales)("%s exposes the same semantic keys as Vietnamese", async (locale) => {
  const [baseMessages, translatedMessages] = await Promise.all([
   loadAppMessages("vi"),
   loadAppMessages(locale),
  ]);

  expect(collectLeafKeys(translatedMessages).sort()).toEqual(collectLeafKeys(baseMessages).sort());
 });

 it.each(appLocales)("%s keeps the AI conversation workspace message contract", async (locale) => {
  const messages = await loadAppMessages(locale);
  const aiConversation = messages.AiConversation;

  expect(aiConversation.modes).toEqual(
   expect.objectContaining({
    natural: expect.any(String),
    speakingPractice: expect.any(String),
    grammarCoach: expect.any(String),
    hskkPractice: expect.any(String),
   }),
  );
  expect(aiConversation.greeting).toContain("{name}");
  expect(aiConversation.greeting).toContain("{mode}");
  expect(aiConversation.greeting).not.toContain("{role}");
 });
});
