import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import { AI_TASK_REGISTRY, type AiActivityEvent } from "@/lib/ai-task-contract";

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { AiActivitySettings } from "./AiActivitySettings";

const appLocales = ["vi", "en", "zh-CN"] satisfies readonly AppLocale[];

function activityEvent(taskIndex: number): AiActivityEvent {
 const task = AI_TASK_REGISTRY[taskIndex];
 if (!task) throw new Error(`Missing AI task fixture at index ${taskIndex}`);

 return {
  id: `00000000-0000-4000-8000-${String(taskIndex + 1).padStart(12, "0")}`,
  taskId: task.id,
  provider: null,
  model: null,
  keyId: null,
  keyLabel: null,
  resolutionSource: null,
  status: "blocked",
  errorCode: "provider-unavailable",
  latencyMs: null,
  inputTokens: null,
  outputTokens: null,
  resourceType: null,
  resourceId: null,
  createdAt: "2026-08-27T08:51:27.000Z",
 };
}

describe("AiActivitySettings", () => {
 it.each(appLocales)("renders localized task names instead of task IDs for %s", async (locale) => {
  const messages = await loadAppMessages(locale);
  const queryClient = new QueryClient();
  queryClient.setQueryData(["settings", "ai-activity", "all", "all", "all", null], {
   events: AI_TASK_REGISTRY.map((_, taskIndex) => activityEvent(taskIndex)),
   nextCursor: null,
  });

  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <QueryClientProvider client={queryClient}>
     <AiActivitySettings />
    </QueryClientProvider>
   </NextIntlClientProvider>,
  );

  for (const task of Object.values(messages.AiSettings.taskRouting.tasks)) {
   expect(markup).toContain(task.title);
  }
  for (const task of AI_TASK_REGISTRY) {
   expect(markup).not.toContain(task.id);
  }
 });
});
