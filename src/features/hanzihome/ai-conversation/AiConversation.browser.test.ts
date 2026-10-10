import { chromium, expect as browserExpect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";
import { loadAppMessages } from "@/i18n/messages";
import { aiRuntimeWithTaskRuntimesResponseSchema } from "@/lib/ai/ai-task-contract";
import { apiKeysResponseSchema } from "@/features/settings/model/api-key-manager.schema";
import type { JsonObject } from "@/types/json";
import {
 aiConversationHistorySchema,
 aiConversationSessionSchema,
 aiConversationTurnRequestSchema,
 aiConversationTurnResponseSchema,
} from "./model/ai-conversation-session.schemas";
import { aiConversationStreamEventSchema } from "./model/ai-conversation-stream.schemas";
import type {} from "./AiConversation.browser.fixture";

it.runIf(process.env.AI_CONVERSATION_BROWSER_TEST === "1")(
 "keeps completed message bodies stable through typing and actual NDJSON chunks",
 async () => {
  const conversationId = "11111111-1111-4111-8111-111111111111";
  const characterId = "22222222-2222-4222-8222-222222222222";
  const keyId = "66666666-6666-4666-8666-666666666666";
  let session = aiConversationSessionSchema.parse({
   conversation: {
    id: conversationId,
    characterId,
    title: "Fixture conversation",
    mode: "natural",
    correctionStyle: "balanced",
    replyMode: "adaptive",
    memoryPolicy: "inherit",
   },
   character: { id: characterId, displayName: "小林", city: "上海", interests: ["电影"] },
   relationship: null,
   learnerLevel: "intermediate",
   memoryEnabled: true,
   messages: Array.from({ length: 20 }, (_unused, index) => ({
    id: randomUUID(),
    seq: index + 1,
    role: index % 2 === 0 ? "user" : "assistant",
    content: `Completed fixture message ${index + 1}`,
    createdAt: "2026-08-18T03:00:00+00:00",
   })),
  });
  const keys = apiKeysResponseSchema.parse({
   keys: [],
   summary: { total: 0, active: 0, groq: 0, deepseek: 0, gemini: 0, openai: 0 },
  });
  const runtime = aiRuntimeWithTaskRuntimesResponseSchema.parse({
   status: "ready",
   reason: "ok",
   activeKeyCount: 1,
   usableKeyCount: 1,
   selectedKey: {
    keyId,
    provider: "groq",
    providerLabel: "Groq",
    label: "Fixture key",
    maskedKey: "fixture-masked",
    model: "openai/gpt-oss-20b",
    priority: 0,
    lastValidatedAt: null,
    capabilities: ["conversation"],
   },
   capabilities: ["conversation"],
   taskRuntimes: [
    {
     taskId: "conversation.reply",
     status: "ready",
     reason: "ok",
     receipt: {
      taskId: "conversation.reply",
      provider: "groq",
      model: "openai/gpt-oss-20b",
      keyId,
      keyLabel: "Fixture key",
      resolutionSource: "auto",
     },
    },
   ],
  });
  const streams = new Map<number, ServerResponse>();
  const submitted: ReturnType<typeof aiConversationTurnRequestSchema.parse>[] = [];
  let closedStreams = 0;
  const fixture = fileURLToPath(new URL("./AiConversation.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/ai-conversation-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     ...["next/navigation", "@/i18n/navigation", "@/components/ui/display/typography"].map(
      (find) => ({ find, replacement: fixture }),
     ),
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "ai-conversation-fixture-page",
     configureServer(instance) {
      instance.middlewares.use("/api/ai/conversation/stream", (request, response) => {
       let body = "";
       request.setEncoding("utf8");
       request.on("data", (chunk: string) => {
        body += chunk;
       });
       request.on("end", () => {
        const parsed: JsonObject = JSON.parse(body);
        expect(parsed.conversationId).toBe(conversationId);
        const input = aiConversationTurnRequestSchema.parse({
         clientMessageId: parsed.clientMessageId,
         content: parsed.content,
        });
        submitted.push(input);
        const index = submitted.length;
        streams.set(index, response);
        response.setHeader("Content-Type", "application/x-ndjson");
        response.flushHeaders();
        response.on("close", () => {
         streams.delete(index);
         closedStreams += 1;
        });
       });
      });
      instance.middlewares.use("/ai-conversation-test", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/ai-conversation-test",
         '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script type="module" src="/src/features/hanzihome/ai-conversation/AiConversation.browser.fixture.tsx"></script></body></html>',
        ),
       );
      });
     },
    },
   ],
  });
  await server.listen();
  try {
   const url = server.resolvedUrls?.local[0];
   if (!url) throw new Error("Missing fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let sessionReads = 0;
    await page.route("**/api/settings/api-keys", (route) => route.fulfill({ json: keys }));
    await page.route("**/api/ai/runtime", (route) => route.fulfill({ json: runtime }));
    await page.route("**/api/ai/conversation", async (route) => {
     const body = route.request().postData() ?? "";
     if (body.includes('"action":"history"')) {
      await route.fulfill({ json: aiConversationHistorySchema.parse([]) });
     } else {
      sessionReads += 1;
      await route.fulfill({ json: session });
     }
    });
    const messages = (await loadAppMessages("vi")).AiConversation;
    await page.goto(url + "ai-conversation-test?conversation=" + conversationId);
    await page.waitForFunction(() => Boolean(window.aiConversationHarness));
    await page.evaluate(
     (contents) => window.aiConversationHarness.mount(contents),
     session.messages.map((message) => message.content),
    );
    await browserExpect(page.locator("[data-message-role]")).toHaveCount(20);
    const draft = page.getByRole("textbox", { name: messages.message.label });
    const send = page.getByRole("button", { name: messages.actions.send, exact: true });
    await draft.fill("warmup");
    await browserExpect(send).toBeEnabled();
    const typingSamples: ReturnType<Window["aiConversationHarness"]["snapshot"]>[] = [];
    for (let repetition = 0; repetition < 5; repetition += 1) {
     await page.evaluate(() => window.aiConversationHarness.reset());
     for (let tick = 1; tick <= 30; tick += 1) {
      await draft.fill(`Draft ${repetition}:${tick}`);
      await browserExpect(draft).toHaveValue(`Draft ${repetition}:${tick}`);
     }
     typingSamples.push(await page.evaluate(() => window.aiConversationHarness.snapshot()));
    }
    await draft.fill("你好。");
    await send.click();
    await browserExpect.poll(() => streams.size).toBe(1);
    await browserExpect(
     page.getByRole("button", { name: messages.actions.stop, exact: true }),
    ).toBeVisible();
    const response = streams.get(1);
    if (!response) throw new Error("Missing active stream");
    let content = "";
    const streamSamples: ReturnType<Window["aiConversationHarness"]["snapshot"]>[] = [];
    for (let repetition = 0; repetition < 5; repetition += 1) {
     await page.evaluate(() => window.aiConversationHarness.reset());
     for (let chunk = 1; chunk <= 30; chunk += 1) {
      content += "好";
      response.write(
       JSON.stringify(aiConversationStreamEventSchema.parse({ type: "delta", text: "好" })) + "\n",
      );
      await browserExpect(page.getByRole("log").getByText(content, { exact: true })).toBeVisible();
     }
     streamSamples.push(await page.evaluate(() => window.aiConversationHarness.snapshot()));
    }
    await writeFile(
     "/tmp/chines-app-ai-message-commits-20261008.json",
     JSON.stringify(
      {
       mode: "Vite development",
       browser: browser.version(),
       viewport: page.viewportSize(),
       completedMessages: 20,
       typingSamples,
       streamSamples,
      },
      null,
      2,
     ),
    );
    for (const sample of [...typingSamples, ...streamSamples]) {
     expect(sample.bodies.reduce((total, body) => total + body.durations.length, 0)).toBe(0);
    }
    expect(sessionReads).toBe(1);
    const input = submitted[0];
    if (!input) throw new Error("Missing submitted turn");
    const turn = aiConversationTurnResponseSchema.parse({
     conversationId,
     userMessage: {
      id: input.clientMessageId,
      seq: 21,
      role: "user",
      content: input.content,
      createdAt: "2026-08-18T03:01:00+00:00",
     },
     assistantMessage: {
      id: randomUUID(),
      seq: 22,
      role: "assistant",
      content,
      createdAt: "2026-08-18T03:01:01+00:00",
     },
     provider: "Groq",
     model: "openai/gpt-oss-20b",
     apiKeyId: keyId,
     runtimeReceipt: null,
     usage: null,
    });
    session = {
     ...session,
     messages: [...session.messages, turn.userMessage, turn.assistantMessage],
    };
    response.end(
     JSON.stringify(aiConversationStreamEventSchema.parse({ type: "final", turn })) + "\n",
    );
    await browserExpect(page.locator("[data-message-role]")).toHaveCount(22);
    await browserExpect(draft).toBeEnabled();
    await draft.fill("Stop this turn");
    await send.click();
    await browserExpect.poll(() => submitted.length).toBe(2);
    await page.getByRole("button", { name: messages.actions.stop, exact: true }).click();
    await browserExpect.poll(() => closedStreams).toBe(2);
    await browserExpect(draft).toHaveValue("Stop this turn");
    await browserExpect(page.locator("[data-message-role]")).toHaveCount(22);
    await browserExpect(send).toBeEnabled();
    await send.click();
    await browserExpect.poll(() => submitted.length).toBe(3);
    expect(submitted[2]).toEqual(submitted[1]);
    await page.evaluate(() => window.aiConversationHarness.unmount());
    await browserExpect(draft).toHaveCount(0);
    await browserExpect.poll(() => closedStreams).toBe(3);
    expect(streams.size).toBe(0);
    expect(session.messages).toHaveLength(22);
    expect(sessionReads).toBe(2);
    expect(errors).toEqual([]);
   } finally {
    await browser.close();
   }
  } finally {
   streams.forEach((response) => response.destroy());
   await server.close();
  }
 },
 60_000,
);
