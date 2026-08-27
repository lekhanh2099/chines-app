import { describe, expect, it } from "vitest";

import { AI_TASK_REGISTRY } from "@/lib/ai-task-contract";

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

 it.each(appLocales)("%s keeps the AI settings navigation contract", async (locale) => {
  const messages = await loadAppMessages(locale);

  expect(messages.AiSettings.tabs).toEqual(
   expect.objectContaining({
    conversation: expect.any(String),
    dailyReading: expect.any(String),
    providers: expect.any(String),
    tasks: expect.any(String),
    usage: expect.any(String),
    aria: expect.any(String),
   }),
  );
 });

 it.each(appLocales)("%s names every AI task in the registry", async (locale) => {
  const messages = await loadAppMessages(locale);
  const tasks = messages.AiSettings.taskRouting.tasks;

  expect(Object.keys(tasks)).toHaveLength(AI_TASK_REGISTRY.length);
  for (const task of Object.values(tasks)) {
   expect(task.title.trim()).not.toBe("");
  }
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
  expect(aiConversation.relationship).toEqual(
   expect.objectContaining({
    new: expect.any(String),
    familiar: expect.any(String),
    friends: expect.any(String),
    close: expect.any(String),
   }),
  );
  expect(aiConversation.history).toEqual(
   expect.objectContaining({
    open: expect.any(String),
    newConversation: expect.any(String),
    archive: expect.any(String),
    archiveDescription: expect.stringContaining("{title}"),
   }),
  );
  expect(aiConversation.memory).toEqual(
   expect.objectContaining({
    useLongTerm: expect.any(String),
    offShort: expect.any(String),
   }),
  );
  expect(aiConversation.runtime.compactReady).toContain("{provider}");
  expect(aiConversation.greeting).toContain("{name}");
  expect(aiConversation.greeting).toContain("{mode}");
  expect(aiConversation.greeting).not.toContain("{role}");
 });

 it.each(appLocales)(
  "%s keeps the AI settings and memory manager message contract",
  async (locale) => {
   const messages = await loadAppMessages(locale);
   const settings = messages.AiConversationSettings;

   expect(settings.overview.relationshipBands).toEqual(
    expect.objectContaining({
     new: expect.any(String),
     familiar: expect.any(String),
     friends: expect.any(String),
     close: expect.any(String),
    }),
   );
   expect(settings.memory.filters).toEqual(
    expect.objectContaining({
     all: expect.any(String),
     global: expect.any(String),
     character: expect.stringContaining("{name}"),
     openLoops: expect.any(String),
    }),
   );
   expect(settings.memory.relationshipWith).toContain("{name}");
   expect(settings.memory.scopeCharacter).toContain("{name}");
   expect(settings.memory.updated).toContain("{date}");
   expect(settings.memory.actionsAria).toContain("{content}");
  },
 );

 it.each(appLocales)(
  "%s keeps model/provider, advanced and usage copy contracts",
  async (locale) => {
   const messages = await loadAppMessages(locale);

   expect(messages.AiLookupSettings.modelProvider).toEqual(
    expect.objectContaining({
     title: expect.any(String),
     description: expect.any(String),
     dirty: expect.any(String),
     synced: expect.any(String),
     reset: expect.any(String),
     save: expect.any(String),
     keyActions: expect.stringContaining("{label}"),
    }),
   );
   expect(messages.AiLookupSettings.advanced).toEqual(
    expect.objectContaining({
     title: expect.any(String),
     description: expect.any(String),
     open: expect.any(String),
     close: expect.any(String),
    }),
   );
   expect(messages.AiUsage.runtimeUsage).toContain("{tokens}");
   expect(messages.AiUsage.runtimeRequests).toContain("{requests}");
  },
 );

 it.each(appLocales)(
  "%s keeps Daily Reading settings navigation and failure copy",
  async (locale) => {
   const messages = await loadAppMessages(locale);
   const settings = messages.DailyReading.settings;

   expect(settings.tabs).toEqual(
    expect.objectContaining({
     overview: expect.any(String),
     pipeline: expect.any(String),
     history: expect.any(String),
     aria: expect.any(String),
    }),
   );
   expect(settings.actions).toEqual(
    expect.objectContaining({
     viewPipeline: expect.any(String),
     openAiSettings: expect.any(String),
     resume: expect.any(String),
     retry: expect.any(String),
    }),
   );
   expect(settings.errors).toEqual(
    expect.objectContaining({
     tooShort: expect.any(String),
     schema: expect.any(String),
     provider: expect.any(String),
     showTechnical: expect.any(String),
    }),
   );
   expect(settings.history.latest).toEqual(expect.any(String));
   expect(settings.pipeline.failedAt).toContain("{stage}");
   expect(settings.toast.generationFailedAtStage).toContain("{stage}");
   expect(settings.toast.generationFailedAtStage).toContain("{detail}");
  },
 );
});
