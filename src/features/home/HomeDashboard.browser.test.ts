import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";

import type { HanziHomeCatalogData } from "@/features/hanzihome/types";
import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";
import type { NoteListItem } from "@/services/notes/notes.service";
import type { HanziHomeSearchIndexItem } from "@/features/hanzihome/search/types";
import type {} from "./HomeDashboard.browser.fixture";

it.runIf(process.env.HOME_BROWSER_TEST === "1")(
 "distinguishes Home Notes and Search errors from empty results, retries and retains cached data",
 async () => {
  const fixture = fileURLToPath(new URL("./HomeDashboard.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   define: { "process.env.__NEXT_IMAGE_OPTS": "undefined" },
   cacheDir: "node_modules/.vite/home-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@/i18n/navigation", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "home-test-page",
     configureServer(instance) {
      instance.middlewares.use("/home-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/home-audit",
         '<!doctype html><script type="module" src="/src/features/home/HomeDashboard.browser.fixture.tsx"></script>',
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
   if (!url) throw new Error("Missing Home fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const catalog: HanziHomeCatalogData = {
     source: "empty",
     courses: [],
     books: [],
     lessons: [],
     radicals: [],
     meta: {
      app: "hanzihome",
      dataset: "empty",
      version: "0",
      generatedAt: "",
      sourceFiles: [],
      counts: { lessons: 0, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
     },
    };
    await page.route("**/api/hanzihome/catalog**", (route) => route.fulfill({ json: { catalog } }));
    await page.route("**/api/learning-state", (route) =>
     route.fulfill({
      json: {
       state: emptyLearningState,
       updatedAt: null,
      },
     }),
    );
    await page.route("**/api/home/learning-overview", (route) =>
     route.fulfill({
      json: {
       overview: {
        srsDueCount: 0,
        learningLoopDueCount: 0,
        readerCompletedCount: 0,
        readerDocumentCount: 0,
       },
      },
     }),
    );
    await page.route("**/api/hanzihome/practice/attempts**", (route) =>
     route.fulfill({
      json:
       new URL(route.request().url()).searchParams.get("mode") === "count"
        ? { count: 0 }
        : { attempts: [] },
     }),
    );
    let status = 400;
    const notes: NoteListItem[] = [
     {
      id: "00000000-0000-4000-8000-000000000002",
      revision: 0,
      title: "Cached study note",
      tags: [],
      status: "draft",
      category: "general",
      short_id: null,
      updated_at: "2026-10-08T00:00:00Z",
      linked_lesson_id: null,
      folder_id: null,
      reading_status: null,
      source_url: null,
      source_host: null,
      source_label: null,
      source_author: null,
      source_published_at: null,
      source_captured_at: null,
      links: [],
     },
    ];
    const requests: string[] = [];
    let holdNotes = true;
    let releaseNotes = () => {};
    await page.route("**/rest/v1/notes?**", async (route) => {
     requests.push(route.request().url());
     if (holdNotes)
      await new Promise<void>((resolve) => {
       releaseNotes = resolve;
      });
     return route.fulfill({
      status,
      json:
       status === 200
        ? notes
        : {
           code: "42703",
           message: "column notes.revision does not exist",
           details: null,
           hint: null,
          },
     });
    });
    await page.route("**/rest/v1/lesson_note_links?**", (route) => route.fulfill({ json: [] }));
    const searchItems: HanziHomeSearchIndexItem[] = [
     { id: "hope-vocab", kind: "vocab", title: "希望", searchText: "希望 hy vọng" },
     { id: "hope-lesson", kind: "lesson_text", title: "希望工程", searchText: "希望工程" },
    ];
    const searchRequests: string[] = [];
    let searchStatus = 503;
    let holdSearch = true;
    let releaseSearch = () => {};
    let malformedSearch = false;
    await page.route("**/api/hanzihome/search-index**", async (route) => {
     searchRequests.push(route.request().url());
     if (holdSearch)
      await new Promise<void>((resolve) => {
       releaseSearch = resolve;
      });
     return route.fulfill({
      status: searchStatus,
      json:
       searchStatus !== 200
        ? { error: "Could not load search index", code: "SEARCH_INDEX_UNAVAILABLE" }
        : malformedSearch
          ? { items: [{ id: "invalid-index-item" }] }
          : { items: searchItems },
     });
    });
    await page.goto(url + "home-audit");
    await browserExpect(
     page.getByLabel("Đang tải ghi chú gần đây", { exact: true }),
    ).toHaveAttribute("aria-busy", "true");
    await browserExpect(page.locator("[data-home-loading]")).toHaveCount(0);
    await browserExpect(page.getByText("Chưa có ghi chú gần đây", { exact: true })).toHaveCount(0);
    await browserExpect.poll(() => requests.length).toBe(1);
    holdNotes = false;
    releaseNotes();
    await browserExpect(page.getByRole("alert")).toContainText("Không tải được ghi chú gần đây");
    await browserExpect(page.getByText("Chưa có ghi chú gần đây", { exact: true })).toHaveCount(0);
    expect(requests).toHaveLength(2);
    status = 200;
    holdNotes = true;
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await browserExpect(
     page.getByLabel("Đang tải ghi chú gần đây", { exact: true }),
    ).toHaveAttribute("aria-busy", "true");
    await browserExpect(page.locator("[data-home-loading]")).toHaveCount(0);
    await browserExpect.poll(() => requests.length).toBe(3);
    holdNotes = false;
    releaseNotes();
    await browserExpect(page.getByRole("link", { name: /Cached study note/ })).toBeVisible();
    await browserExpect(page.getByRole("alert")).toHaveCount(0);
    expect(requests).toHaveLength(3);
    status = 503;
    await page.evaluate(() => window.homeDashboardHarness.refreshNotes());
    await browserExpect(page.getByRole("alert")).toBeVisible();
    await browserExpect(page.getByRole("link", { name: /Cached study note/ })).toBeVisible();
    await browserExpect(page.getByText("Chưa có ghi chú gần đây", { exact: true })).toHaveCount(0);
    status = 200;
    notes.length = 0;
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await browserExpect(page.getByText("Chưa có ghi chú gần đây", { exact: true })).toBeVisible();
    await browserExpect(page.getByRole("alert")).toHaveCount(0);
    for (const request of requests) {
     const params = new URL(request).searchParams;
     expect(params.get("limit")).toBe("3");
     expect(params.get("user_id")).toBe("eq.00000000-0000-4000-8000-000000000001");
     expect(params.get("select")).toContain("revision");
    }
    await browserExpect(page.locator("[data-progress-count]")).toHaveText("0");
    await browserExpect(page.locator("html")).toHaveAttribute("data-hanzi-reader-font", "kaiti");
    for (let repetition = 0; repetition < 5; repetition += 1) {
     await page.evaluate(() => window.homeDashboardHarness.resetFontCommits());
     for (let tick = 1; tick <= 30; tick += 1) {
      await page.evaluate(
       (id) => window.homeDashboardHarness.updateProgress(id),
       `progress-${repetition}-${tick}`,
      );
      await browserExpect(page.locator("[data-progress-count]")).toHaveText(
       String(repetition * 30 + tick),
      );
     }
     expect(await page.evaluate(() => window.homeDashboardHarness.fontCommits())).toBe(0);
    }
    await page.evaluate(() => {
     window.homeDashboardHarness.resetFontCommits();
     window.homeDashboardHarness.updateFont("songti");
    });
    await browserExpect(page.locator("html")).toHaveAttribute("data-hanzi-reader-font", "songti");
    expect(await page.evaluate(() => window.homeDashboardHarness.fontCommits())).toBe(1);
    expect(searchRequests).toHaveLength(0);
    await page.getByRole("button", { name: "Open search fixture", exact: true }).click();
    const searchDialog = page.getByRole("dialog", { name: "Tìm kiếm HanziHome", exact: true });
    const searchInput = searchDialog.getByRole("combobox");
    await browserExpect(searchInput).toBeFocused();
    await browserExpect(searchInput).toHaveValue("希望");
    await browserExpect.poll(() => searchRequests.length).toBe(1);
    await browserExpect(searchDialog.getByText(/Không tìm thấy kết quả/)).toHaveCount(0);
    holdSearch = false;
    releaseSearch();
    await browserExpect(searchDialog.getByRole("alert")).toContainText(
     "Không thể tải chỉ mục tìm kiếm",
    );
    expect(searchRequests).toHaveLength(2);
    await browserExpect(searchDialog.getByText(/Không tìm thấy kết quả/)).toHaveCount(0);
    searchStatus = 200;
    await searchDialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await browserExpect(searchDialog.getByRole("option")).toHaveCount(2);
    await browserExpect(searchDialog.getByRole("alert")).toHaveCount(0);
    // Keep pointer selection separate from the query-reset and keyboard assertions.
    await page.mouse.move(0, 0);
    await searchInput.fill("");
    await searchInput.fill("希望");
    await browserExpect(searchDialog.getByRole("option").first()).toHaveAttribute(
     "aria-selected",
     "true",
    );
    await searchInput.press("ArrowDown");
    await browserExpect(searchDialog.getByRole("option").nth(1)).toHaveAttribute(
     "aria-selected",
     "true",
    );
    await searchInput.press("Enter");
    await browserExpect(page.locator("[data-opened-search-result]")).toHaveText("hope-lesson");
    await browserExpect(searchDialog).toHaveCount(0);
    await page.getByRole("button", { name: "Open search fixture", exact: true }).click();
    await browserExpect(searchDialog.getByRole("option")).toHaveCount(2);
    searchStatus = 503;
    await page.evaluate(() => window.homeDashboardHarness.refreshSearch());
    await browserExpect(searchDialog.getByRole("alert")).toBeVisible();
    await browserExpect(searchDialog.getByRole("option")).toHaveCount(2);
    await browserExpect(searchInput).toHaveValue("希望");
    searchStatus = 200;
    malformedSearch = true;
    await searchDialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await browserExpect(searchDialog.getByRole("alert")).toBeVisible();
    await browserExpect(searchDialog.getByRole("option")).toHaveCount(2);
    malformedSearch = false;
    searchItems.length = 0;
    await searchDialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await browserExpect(searchDialog.getByText(/Không tìm thấy kết quả/)).toBeVisible();
    await browserExpect(searchDialog.getByRole("alert")).toHaveCount(0);
    await browserExpect(searchDialog.getByRole("option")).toHaveCount(0);
    await searchInput.press("Escape");
    await browserExpect(searchDialog).toHaveCount(0);
    for (const request of searchRequests) {
     expect(new URL(request).searchParams.get("v")).toBe("2");
    }
    await page.evaluate(() => window.homeDashboardHarness.close());
    await browserExpect(page.locator("html")).not.toHaveAttribute("data-hanzi-reader-font");
    expect(errors).toEqual([]);
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 30_000,
);

const dashboardViewportCases = [
 { viewportName: "desktop", viewport: { width: 1440, height: 900 } },
 { viewportName: "tablet", viewport: { width: 820, height: 1180 } },
 { viewportName: "phone", viewport: { width: 412, height: 915 } },
];

it.runIf(process.env.HOME_BROWSER_TEST === "1").each(dashboardViewportCases)(
 "renders the unified vocabulary hub without the legacy learning pulse at $viewportName",
 async ({ viewport }) => {
  const fixture = fileURLToPath(new URL("./HomeDashboard.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   define: { "process.env.__NEXT_IMAGE_OPTS": "undefined" },
   cacheDir: "node_modules/.vite/home-full-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@/i18n/navigation", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "home-full-test-page",
     configureServer(instance) {
      instance.middlewares.use("/home-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/home-audit",
         '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><script type="module" src="/src/features/home/HomeDashboard.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Missing full Home fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage({ viewport });
    const errors: string[] = [];
    const unexpected: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const catalog: HanziHomeCatalogData = {
     source: "empty",
     courses: [],
     books: [],
     lessons: [],
     radicals: [],
     meta: {
      app: "hanzihome",
      dataset: "empty",
      version: "0",
      generatedAt: "",
      sourceFiles: [],
      counts: { lessons: 0, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
     },
    };
    await page.route("**/api/**", (route) => {
     const pathname = new URL(route.request().url()).pathname;
     if (pathname === "/api/hanzihome/catalog") return route.fulfill({ json: { catalog } });
     if (pathname === "/api/learning-state")
      return route.fulfill({ json: { state: emptyLearningState, updatedAt: null } });
     if (pathname === "/api/home/learning-overview")
      return route.fulfill({
       json: {
        overview: {
         srsDueCount: 0,
         learningLoopDueCount: 0,
         readerCompletedCount: 0,
         readerDocumentCount: 0,
        },
       },
      });
     if (pathname === "/api/hanzihome/practice/attempts")
      return route.fulfill({
       json:
        new URL(route.request().url()).searchParams.get("mode") === "count"
         ? { count: 0 }
         : { attempts: [] },
      });
     if (pathname === "/api/hanzihome/memory-tips") return route.fulfill({ json: { items: [] } });
     unexpected.push(pathname);
     return route.abort();
    });
    await page.route("**/rest/v1/**", (route) => route.fulfill({ json: [] }));
    await page.goto(url + "home-audit?full&locale=vi");

    const hub = page.locator('section[aria-labelledby="unified-vocab-hub-heading"]');
    await browserExpect(hub).toBeVisible();
    await browserExpect(hub.locator("#unified-vocab-hub-heading")).toHaveText(
     "IT / Làm Web · 20 từ cốt lõi ngày đầu · 20 từ, 35 bài tập",
    );
    await browserExpect(hub.getByRole("combobox", { name: "Chọn nguồn từ vựng" })).toBeVisible();
    await browserExpect(
     hub.getByRole("button", { name: "Mở PiP học ngay", exact: true }),
    ).toBeEnabled();
    await browserExpect(page.locator("#home-learning-pulse-title")).toHaveCount(0);
    await browserExpect(page.locator("#today-focus-heading")).toHaveCount(0);
    await page.getByRole("button", { name: "Bookmark lesson fixture", exact: true }).click();
    const sourceSelector = hub.getByRole("combobox", { name: "Chọn nguồn từ vựng" });
    await browserExpect(sourceSelector).toHaveText("Bài đã mark (1)");
    await sourceSelector.click();
    await page.getByRole("option", { name: /^Học nhanh IT/ }).click();
    await sourceSelector.click();
    await page.getByRole("option", { name: "Bài đã mark (1)", exact: true }).click();
    await browserExpect(hub.locator("#unified-vocab-hub-heading")).toContainText("· 60 từ,");
    await page.getByRole("button", { name: "Clear bookmarks fixture", exact: true }).click();
    await browserExpect(sourceSelector).toHaveText("Bài đã mark (0)");
    await browserExpect(hub.locator("#unified-vocab-hub-heading")).toHaveText(
     "Bài đã đánh dấu · 0 từ, 0 bài tập",
    );
    await browserExpect(
     hub.getByRole("button", { name: "Mở PiP học ngay", exact: true }),
    ).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
     true,
    );
    expect(await page.locator("main").innerText()).not.toMatch(/Home\.(pulse|activity|focus)/);

    await page.evaluate(() => window.homeDashboardHarness.close());
    let releaseAudio = () => {};
    let audioRequested = false;
    let audioReleased = false;
    await page.route("**/api/tts", async (route) => {
     audioRequested = true;
     await new Promise<void>((resolve) => {
      releaseAudio = resolve;
     });
     await route.fulfill({ contentType: "audio/mpeg", body: "fixture audio" });
     audioReleased = true;
    });
    await page.goto(url + "home-audit?audio");
    await browserExpect(page.locator("[data-audio-pack]")).toHaveText("idle:0/1");
    await page.getByRole("button", { name: "Download audio fixture", exact: true }).click();
    await browserExpect.poll(() => audioRequested).toBe(true);
    await page.getByRole("button", { name: "Switch to cached voice fixture", exact: true }).click();
    await browserExpect(page.locator("[data-audio-pack]")).toHaveText("ready:1/1");
    releaseAudio();
    await browserExpect.poll(() => audioReleased).toBe(true);
    await browserExpect(page.locator("[data-audio-download-finished]")).toHaveText("true");
    await browserExpect(page.locator("[data-audio-pack]")).toHaveText("ready:1/1");
    await page.evaluate(() => window.homeDashboardHarness.close());
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 30_000,
);
