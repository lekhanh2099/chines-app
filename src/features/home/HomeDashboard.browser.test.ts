import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";

import type { HanziHomeCatalogData } from "@/features/hanzihome/types";
import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";
import type { NoteListItem } from "@/services/notes/notes.service";
import type { HanziHomeSearchIndexItem } from "@/features/hanzihome/search/types";
import type { PracticeAttemptRow } from "@/features/hanzihome/practice/practice-attempt.schemas";
import { appLocales } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import type {} from "./HomeDashboard.browser.fixture";

it.runIf(process.env.HOME_BROWSER_TEST === "1")(
 "distinguishes Home Notes and Search errors from empty results, retries and retains cached data",
 async () => {
  const fixture = fileURLToPath(new URL("./HomeDashboard.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
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
    await searchInput.focus();
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

const sourceCases = appLocales.flatMap((locale) =>
 [
  { viewportName: "desktop", viewport: { width: 1440, height: 900 } },
  { viewportName: "tablet", viewport: { width: 820, height: 1180 } },
  { viewportName: "phone", viewport: { width: 412, height: 915 } },
 ].flatMap((viewportCase) =>
  ["overview", "activity", "count"].map((source) => ({ locale, ...viewportCase, source })),
 ),
);

it.runIf(process.env.HOME_BROWSER_TEST === "1").each(sourceCases)(
 "keeps failed $source source for $locale at $viewportName distinct from valid zero/empty and retries only that source",
 async ({ locale, viewport, source }) => {
  const messages = await loadAppMessages(locale);
  const fixture = fileURLToPath(new URL("./HomeDashboard.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
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
    const requests: string[] = [];
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
    const attempts: PracticeAttemptRow[] = [
     {
      id: "00000000-0000-4000-8000-000000004201",
      user_id: "00000000-0000-4000-8000-000000000001",
      surface: "review",
      content_id: "vocab:audit",
      direction: null,
      answer: { kind: "review", itemType: "vocab", result: "known", label: "学习" },
      score: null,
      response_ms: null,
      created_at: "2026-10-10T00:00:00Z",
     },
    ];
    let status = 503;
    let hold = true;
    let release = () => {};
    let empty = false;
    await page.route(url + "api/**", async (route) => {
     const request = new URL(route.request().url());
     const resource =
      request.pathname === "/api/home/learning-overview"
       ? "overview"
       : request.pathname === "/api/hanzihome/practice/attempts"
         ? request.searchParams.get("mode") === "count"
          ? "count"
          : "activity"
         : request.pathname;
     requests.push(resource);
     if (resource === source) {
      if (hold)
       await new Promise<void>((resolve) => {
        release = resolve;
       });
      if (status !== 200)
       return route.fulfill({ status, json: { error: "Controlled Home error" } });
     }
     if (resource === "overview")
      return route.fulfill({
       json: {
        overview: {
         srsDueCount: empty && source === "overview" ? 0 : 3,
         learningLoopDueCount: empty && source === "overview" ? 0 : 2,
         readerCompletedCount: empty && source === "overview" ? 0 : 1,
         readerDocumentCount: empty && source === "overview" ? 0 : 4,
        },
       },
      });
     if (resource === "activity")
      return route.fulfill({ json: { attempts: empty && source === "activity" ? [] : attempts } });
     if (resource === "count")
      return route.fulfill({ json: { count: empty && source === "count" ? 0 : 7 } });
     if (resource === "/api/hanzihome/catalog") return route.fulfill({ json: { catalog } });
     if (resource === "/api/learning-state")
      return route.fulfill({ json: { state: emptyLearningState, updatedAt: null } });
     if (resource === "/api/hanzihome/memory-tips") return route.fulfill({ json: { items: [] } });
     unexpected.push(resource);
     return route.abort();
    });
    await page.route(url + "rest/v1/**", (route) => {
     requests.push(new URL(route.request().url()).pathname);
     return route.fulfill({ json: [] });
    });
    await page.goto(url + `home-audit?full&locale=${locale}`);
    await browserExpect.poll(() => requests.filter((item) => item === source).length).toBe(1);
    await browserExpect(
     page.getByLabel(messages.Home.page.loading, { exact: true }),
    ).toHaveAttribute("aria-busy", "true");
    await browserExpect(page.locator("#today-focus-heading")).toHaveCount(0);
    hold = false;
    release();
    const pulse = page.locator('section[aria-labelledby="home-learning-pulse-title"]');
    const activity = page.locator('section[aria-labelledby="recent-learning-activity-title"]');
    const panel = source === "activity" ? activity : pulse;
    await browserExpect
     .poll(() =>
      page.evaluate(
       () =>
        window.homeDashboardHarness
         .querySnapshots()
         .filter((query) => query.status === "error" && query.fetchStatus === "idle").length,
      ),
     )
     .toBe(1);
    await browserExpect(panel.getByRole("alert")).toBeVisible();
    await browserExpect(panel.getByRole("alert")).toContainText(
     source === "overview"
      ? messages.Home.pulse.overviewErrorTitle
      : source === "activity"
        ? messages.Home.activity.loadErrorTitle
        : messages.Home.pulse.reviewedTodayErrorTitle,
    );
    await browserExpect(page.getByRole("alert")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
     true,
    );
    await browserExpect(page.getByLabel(messages.Home.page.loading, { exact: true })).toHaveCount(
     0,
    );
    expect(requests.filter((item) => item === source)).toHaveLength(2);
    const srsValue = pulse
     .getByText(messages.Home.pulse.srsDueCount, { exact: true })
     .locator("..")
     .locator("p")
     .last();
    const loopValue = pulse
     .getByText(messages.Home.pulse.learningLoopDueCount, { exact: true })
     .locator("..")
     .locator("p")
     .last();
    const readerValue = pulse
     .getByText(messages.Home.pulse.readerCompletedCount, { exact: true })
     .locator("..")
     .locator("p")
     .last();
    const todayValue = pulse
     .getByText(messages.Home.pulse.reviewedTodayCount, { exact: true })
     .locator("..")
     .locator("p")
     .last();
    await browserExpect(srsValue).toHaveText(source === "overview" ? "—" : "3");
    await browserExpect(loopValue).toHaveText(source === "overview" ? "—" : "2");
    await browserExpect(readerValue).toHaveText(source === "overview" ? "—" : "1/4");
    await browserExpect(todayValue).toHaveText(source === "count" ? "—" : "7");
    await browserExpect(
     activity.getByText(messages.Home.activity.empty, { exact: true }),
    ).toHaveCount(0);
    if (source === "overview")
     await browserExpect(page.locator("#today-focus-heading")).toHaveText(
      messages.Home.focus.overviewUnknownTitle,
     );
    else await browserExpect(page.locator("#today-focus-heading")).toContainText("3 thẻ từ vựng");
    const independentRequests = requests.filter((item) => item !== source);
    status = 200;
    hold = true;
    const retry = panel.getByRole("button", { name: messages.Common.actions.retry, exact: true });
    await retry.focus();
    await browserExpect(retry).toBeFocused();
    await retry.press("Enter");
    await browserExpect.poll(() => requests.filter((item) => item === source).length).toBe(3);
    await browserExpect(page.getByLabel(messages.Home.page.loading, { exact: true })).toHaveCount(
     0,
    );
    await browserExpect(page.locator("#home-learning-pulse-title")).toBeVisible();
    await browserExpect(page.locator("#recent-notes-title")).toHaveCount(1);
    await browserExpect(panel).toHaveAttribute("aria-busy", "true");
    await browserExpect(
     panel.getByText(
      source === "overview"
       ? messages.Home.pulse.overviewLoading
       : source === "activity"
         ? messages.Home.activity.loading
         : messages.Home.pulse.reviewedTodayLoading,
      { exact: true },
     ),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
     true,
    );
    await browserExpect(srsValue).toHaveText(source === "overview" ? "—" : "3");
    await browserExpect(todayValue).toHaveText(source === "count" ? "—" : "7");
    await browserExpect(
     activity.getByText(messages.Home.activity.empty, { exact: true }),
    ).toHaveCount(0);
    expect(requests.filter((item) => item !== source)).toEqual(independentRequests);
    hold = false;
    release();
    await browserExpect(panel.getByRole("alert")).toHaveCount(0);
    await browserExpect(srsValue).toHaveText("3");
    await browserExpect(loopValue).toHaveText("2");
    await browserExpect(readerValue).toHaveText("1/4");
    await browserExpect(todayValue).toHaveText("7");
    await browserExpect(activity.getByText("学习", { exact: true })).toBeVisible();
    status = 503;
    await page.evaluate((selected) => {
     const harness = window.homeDashboardHarness;
     return selected === "overview"
      ? harness.refreshOverview()
      : selected === "activity"
        ? harness.refreshActivity()
        : harness.refreshReviewedToday();
    }, source);
    await browserExpect(panel.getByRole("alert")).toBeVisible();
    await browserExpect(srsValue).toHaveText("3");
    await browserExpect(todayValue).toHaveText("7");
    await browserExpect(loopValue).toHaveText("2");
    await browserExpect(readerValue).toHaveText("1/4");
    await browserExpect(activity.getByText("学习", { exact: true })).toBeVisible();
    await browserExpect(page.locator("#today-focus-heading")).toContainText("3 thẻ từ vựng");
    expect(requests.filter((item) => item === source)).toHaveLength(5);
    expect(requests.filter((item) => item !== source)).toEqual(independentRequests);
    const failedQueries = await page.evaluate(() =>
     window.homeDashboardHarness.querySnapshots().filter((query) => query.status === "error"),
    );
    expect(failedQueries).toHaveLength(1);
    expect(failedQueries[0]?.hash).toContain(
     source === "overview" ? "home-learning-overview" : "practice-attempts",
    );
    status = 200;
    empty = true;
    hold = true;
    await retry.focus();
    await retry.press("Enter");
    await browserExpect.poll(() => requests.filter((item) => item === source).length).toBe(6);
    await browserExpect(panel).toHaveAttribute("aria-busy", "true");
    await browserExpect(srsValue).toHaveText("3");
    await browserExpect(todayValue).toHaveText("7");
    await browserExpect(activity.getByText("学习", { exact: true })).toBeVisible();
    hold = false;
    release();
    await browserExpect(panel.getByRole("alert")).toHaveCount(0);
    await browserExpect(srsValue).toHaveText(source === "overview" ? "0" : "3");
    await browserExpect(todayValue).toHaveText(source === "count" ? "0" : "7");
    if (source === "overview") {
     await browserExpect(loopValue).toHaveText("0");
     await browserExpect(readerValue).toHaveText("0/0");
     await browserExpect(page.locator("#today-focus-heading")).toContainText(
      "hoàn thành toàn bộ thẻ",
     );
    }
    if (source === "activity") {
     await browserExpect(
      activity.getByText(messages.Home.activity.empty, { exact: true }),
     ).toBeVisible();
     await browserExpect(activity.getByText("学习", { exact: true })).toHaveCount(0);
    }
    expect(requests.filter((item) => item !== source)).toEqual(independentRequests);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
     true,
    );
    expect(await page.locator("main").innerText()).not.toMatch(/Home\.(pulse|activity|focus)/);
    await page.evaluate(() => window.homeDashboardHarness.close());
    if (source === "count") {
     requests.length = 0;
     await page.goto(url + `home-audit?full&guest&locale=${locale}`);
     await browserExpect(page.locator("#today-focus-heading")).toHaveText(
      messages.Home.focus.overviewUnknownTitle,
     );
     await browserExpect(srsValue).toHaveText("—");
     await browserExpect(todayValue).toHaveText("—");
     await browserExpect(page.getByRole("alert")).toHaveCount(0);
     await browserExpect
      .poll(() =>
       page.evaluate(() =>
        window.homeDashboardHarness.querySnapshots().every((query) => query.fetchStatus === "idle"),
       ),
      )
      .toBe(true);
     expect(
      requests.filter((item) =>
       ["overview", "activity", "count", "/rest/v1/notes", "/api/learning-state"].includes(item),
      ),
     ).toEqual([]);
     await page.evaluate(() => window.homeDashboardHarness.close());
    }
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
