import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it, vi } from "vitest";
import { getReaderDocument, listReaderDocuments } from "../repositories/reading-content.repository";
import { loadAppMessages } from "@/i18n/messages";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";
import type {} from "./Reading.browser.fixture";
import { dailyReadingSchema } from "@/features/daily-reading/daily-reading.schemas";

vi.mock("server-only", () => ({}));

it.runIf(process.env.READER_BROWSER_TEST === "1")(
 "keeps Reading study bindings on the facade runtime",
 async () => {
  const first = (await listReaderDocuments("core"))[0];
  if (!first) throw new Error("Missing core corpus");
  const resource = await getReaderDocument(first.id);
  const paragraph = resource?.paragraphs[0];
  const second = resource?.paragraphs[1];
  if (!resource || !paragraph || !second) throw new Error("Missing core paragraphs");
  const hskDocuments = await listReaderDocuments("hsk");
  const hskFirst = hskDocuments[0];
  if (!hskFirst) throw new Error("Missing HSK corpus");
  const hskResource = await getReaderDocument(hskFirst.id);
  if (!hskResource) throw new Error("Missing HSK resource");
  const fixture = fileURLToPath(new URL("./Reading.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   resolve: {
    alias: [
     ...[
      "@/features/hanzihome/hooks/useLearningState",
      "@/components/providers/QueryProvider",
      "@/features/speech/MandarinTtsProvider",
      "@/features/dictionary/hooks/useVocabInspector",
      "@/i18n/navigation",
      "next/navigation",
      "next/link",
     ].map((find) => ({ find, replacement: fixture })),
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "reading-study-page",
     configureServer(instance) {
      instance.middlewares.use("/hsk-documents", (_request, response) => {
       response.setHeader("Content-Type", "application/json");
       response.end(JSON.stringify(hskDocuments));
      });
      instance.middlewares.use("/hsk-resource", (_request, response) => {
       response.setHeader("Content-Type", "application/json");
       response.end(JSON.stringify(hskResource));
      });
      instance.middlewares.use("/reading-resource", (_request, response) => {
       response.setHeader("Content-Type", "application/json");
       response.end(JSON.stringify(resource));
      });
      instance.middlewares.use("/reading-test", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/reading-test",
         '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script type="module" src="/src/features/reading/workspaces/Reading.browser.fixture.tsx"></script></body></html>',
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
    let stateReads = 0;
    const writes: string[] = [];
    const annotation: ReaderAnnotationRow = {
     id: "22222222-2222-4222-8222-222222222222",
     user_id: "11111111-1111-4111-8111-111111111111",
     document_id: first.id,
     paragraph_id: paragraph.id,
     asset_id: null,
     annotation_type: "note",
     page_number: null,
     start_offset: 0,
     end_offset: 1,
     selected_text: paragraph.zh.slice(0, 1),
     note_text: "Saved note",
     color: "yellow",
     payload: {},
     revision: 1,
     created_at: "2026-09-08T00:00:00Z",
     updated_at: "2026-09-08T00:00:00Z",
     deleted_at: null,
    };
    await page.route("**/api/reading/**", async (route) => {
     const request = route.request();
     if (request.url().includes("/reading/state?")) {
      stateReads += 1;
      await route.fulfill({
       json: {
        progress: null,
        annotations: request.url().includes(hskFirst.id) ? [] : [annotation],
        overrides: [],
       },
      });
     } else if (request.method() === "PATCH") {
      writes.push(request.postData() ?? "");
      await route.fulfill({
       json: { annotation: { ...annotation, note_text: "Updated note", revision: 2 } },
      });
     } else if (request.url().includes("/reading/progress")) {
      writes.push(request.postData() ?? "");
      await route.fulfill({ json: { progress: null } });
     } else if (
      request.url().includes("/reading/pronunciation-overrides") &&
      request.method() === "PUT"
     ) {
      writes.push(request.postData() ?? "");
      await route.fulfill({ status: 500, json: { error: "fixture save failure" } });
     } else await route.fulfill({ status: 500, json: { error: "Unexpected request" } });
    });
    const messages = await loadAppMessages("vi");
    const chrome = messages.Reader.study.chrome;
    await page.goto(url + "reading-test");
    await page.waitForFunction(() => Boolean(window.readingHarness));
    await page.evaluate(() => window.readingHarness.mount());
    await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(
     resource.paragraphs.length,
    );
    await page.getByRole("button", { name: chrome.commands.next, exact: true }).click();
    await browserExpect(page.locator(`[data-reader-segment="${second.id}"]`)).toHaveAttribute(
     "data-active",
     "true",
    );
    await page.getByRole("tab", { name: chrome.tabs.translation, exact: true }).click();
    await browserExpect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute(
     "aria-current",
     "step",
    );
    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("tab", { name: chrome.tabs.reader, exact: true }).click();
    await browserExpect(page.locator(`[data-reader-segment="${paragraph.id}"]`)).toHaveAttribute(
     "data-active",
     "true",
    );
    await page.getByRole("button", { name: chrome.tools.shadowing, exact: true }).click();
    await browserExpect(
     page.getByRole("button", { name: messages.Reader.study.shadowing.start, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: chrome.tools.title, exact: true }).click();
    await page.getByRole("menuitem", { name: "Hiển thị lớp học", exact: true }).hover();
    await page.getByRole("menuitemcheckbox", { name: chrome.tools.pinyin, exact: true }).click();
    expect((await page.evaluate(() => window.readingHarness.snapshot())).display.showPinyin).toBe(
     false,
    );
    await page.getByRole("menuitemcheckbox", { name: chrome.tools.pinyin, exact: true }).click();
    await page.keyboard.press("Escape");
    const openAnnotation = page.locator(
     `[data-reader-segment="${paragraph.id}"] .reading-highlight`,
    );
    await openAnnotation.first().click();
    await page.getByRole("textbox", { name: chrome.selection.noteAria }).fill("Updated note");
    const beforeSave = stateReads;
    await page.getByRole("button", { name: chrome.selection.saveNote, exact: true }).click();
    await browserExpect.poll(() => writes.length).toBeGreaterThan(0);
    await browserExpect.poll(() => stateReads).toBeGreaterThan(beforeSave);
    await page
     .getByRole("button", { name: messages.Reader.study.completion.markDone, exact: true })
     .click();
    await browserExpect
     .poll(() => writes.some((body) => body.includes('"completed":true')))
     .toBe(true);
    await page.locator('[aria-label^="Kiểm tra pinyin chữ"]').first().click();
    await page.getByRole("button", { name: chrome.pronunciation.confirm, exact: true }).click();
    await browserExpect(
     page.getByText("Không lưu được pinyin override của Reader.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: chrome.pronunciation.close, exact: true }).click();
    await page
     .locator("[data-reader-segment]")
     .first()
     .getByRole("button", { name: chrome.commands.listen, exact: true })
     .click();
    await browserExpect
     .poll(
      async () => (await page.evaluate(() => window.readingHarness.snapshot())).requests.length,
     )
     .toBeGreaterThan(0);
    await page.getByRole("button", { name: chrome.commands.stopReading, exact: true }).click();
    await browserExpect(
     page.getByRole("button", { name: chrome.commands.stopReading, exact: true }),
    ).toBeDisabled();
    await page.goto(
     url +
      "reading-test?source=reader-highlight&document=" +
      encodeURIComponent(first.id) +
      "&paragraph=" +
      encodeURIComponent(second.id) +
      "&start=0&end=2",
    );
    await page.waitForFunction(() => Boolean(window.readingHarness));
    await page.evaluate(() => window.readingHarness.mount());
    await browserExpect(page.locator(`[data-reader-segment="${second.id}"]`)).toHaveAttribute(
     "data-active",
     "true",
    );
    await browserExpect
     .poll(() => page.evaluate(() => window.getSelection()?.toString()))
     .toBe(second.zh.slice(0, 2));
    for (const viewport of [
     { width: 390, height: 844 },
     { width: 820, height: 1180 },
    ]) {
     await page.setViewportSize(viewport);
     expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
     ).toBe(true);
     const outline = page.getByRole("combobox", { name: chrome.outline.aria, exact: true });
     await browserExpect(outline).toHaveAttribute("aria-expanded", "false");
    }
    await page.evaluate(() => window.readingHarness.mountHsk());
    await browserExpect(page.locator('a[href^="/hsk/"]')).toHaveCount(50);
    for (const viewport of [
     { width: 390, height: 844 },
     { width: 820, height: 1180 },
     { width: 1440, height: 900 },
    ]) {
     await page.setViewportSize(viewport);
     await browserExpect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    }
    const hskSlug = hskFirst.slug.replace(/^hsk-/u, "");
    await browserExpect(page.locator(`a[href="/hsk/${hskSlug}"]`)).toBeVisible();
    await page.evaluate((slug) => window.readingHarness.mountHsk(slug), hskSlug);
    await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(
     hskResource.paragraphs.length,
    );
    expect(hskResource.paragraphs).toHaveLength(1);
    await browserExpect(
     page.getByRole("button", { name: chrome.commands.next, exact: true }),
    ).toBeDisabled();
    const beforeHskSpeech = (await page.evaluate(() => window.readingHarness.snapshot())).requests
     .length;
    await page
     .locator("[data-reader-segment]")
     .first()
     .getByRole("button", { name: chrome.commands.listen, exact: true })
     .click();
    await browserExpect
     .poll(
      async () => (await page.evaluate(() => window.readingHarness.snapshot())).requests.length,
     )
     .toBeGreaterThan(beforeHskSpeech);
    await page.getByRole("button", { name: chrome.commands.stopReading, exact: true }).click();
    const daily = dailyReadingSchema.parse({
     schemaVersion: "2.0.0",
     id: "daily:2026-08-28:1234abcd",
     publishedDate: "2026-08-28",
     capturedAt: "2026-08-28T02:00:00.000Z",
     releaseKind: "manual",
     provenance: "source-captured",
     source: {
      titleZh: "城市文化活动",
      publisher: "中国新闻网",
      url: "https://www.chinanews.com.cn/cul/2026/08-28/example.shtml",
      publishedAt: "2026-08-28T01:00:00.000Z",
      capturedAt: "2026-08-28T02:00:00.000Z",
     },
     article: {
      titleZh: "城市文化活动",
      paragraphs: [
       { id: "source-p1", order: 1, zh: "城市举办文化活动。" },
       { id: "source-p2", order: 2, zh: "年轻读者来到现场。" },
       { id: "source-p3", order: 3, zh: "学校也参与了活动。" },
      ],
      hanCharacterCount: 30,
      fingerprint: "1234abcd",
     },
     classification: { topic: "culture", targetLevel: "HSK5", estimatedLevel: null },
     estimatedMinutes: 3,
     enrichment: {
      translation: { status: "idle" },
      vocabulary: { status: "idle" },
      grammar: { status: "idle" },
      questions: { status: "idle" },
     },
    });
    await page.evaluate((article) => window.readingHarness.mountDaily(article), daily);
    await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(3);
    await browserExpect(page.locator('[aria-label^="Kiểm tra pinyin chữ"]')).toHaveCount(0);
    await page.evaluate((article) => window.readingHarness.mountDaily(article, true), daily);
    await page.getByRole("button", { name: chrome.commands.next, exact: true }).click();
    await browserExpect(page.locator('[data-reader-segment="source-p2"]')).toHaveAttribute(
     "data-active",
     "true",
    );
    await page.locator('[aria-label^="Kiểm tra pinyin chữ"]').first().click();
    await page
     .getByRole("button", { name: chrome.pronunciation.applySession, exact: true })
     .click();
    await page.locator('[aria-label^="Kiểm tra pinyin chữ"]').first().click();
    await browserExpect(
     page.getByRole("button", { name: chrome.pronunciation.resetSession, exact: true }),
    ).toBeVisible();
    await page
     .getByRole("button", { name: chrome.pronunciation.resetSession, exact: true })
     .click();
    for (const viewport of [
     { width: 390, height: 844 },
     { width: 820, height: 1180 },
    ]) {
     await page.setViewportSize(viewport);
     await browserExpect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    }
    await page.evaluate(() => window.readingHarness.mountTextbook());
    await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(2);
    await browserExpect(page.locator('[data-reader-segment="textbook-p1"]')).toHaveAttribute(
     "data-active",
     "true",
    );
    await page.getByRole("button", { name: chrome.tools.title, exact: true }).click();
    await browserExpect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await browserExpect(
     page.getByRole("button", { name: chrome.tools.title, exact: true }),
    ).toBeFocused();
    const touchPage = await browser.newPage({
     viewport: { width: 820, height: 1180 },
     hasTouch: true,
    });
    touchPage.on("pageerror", (error) => errors.push(error.message));
    await touchPage.goto(url + "reading-test");
    await touchPage.waitForFunction(() => Boolean(window.readingHarness));
    await touchPage.evaluate(() => window.readingHarness.mountTextbook());
    const touchTools = touchPage.getByRole("button", { name: chrome.tools.title, exact: true });
    await touchTools.click();
    await browserExpect(touchPage.getByRole("dialog")).toBeVisible();
    await touchPage.keyboard.press("Escape");
    await browserExpect(touchTools).toBeFocused();
    await browserExpect
     .poll(() => touchPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
     .toBe(true);
    await touchPage.close();
    expect(errors).toEqual([]);
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 60_000,
);
