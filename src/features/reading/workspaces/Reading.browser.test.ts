import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import { createServer } from "vite";
import { expect, it, vi } from "vitest";
import { getReaderDocument, listReaderDocuments } from "../repositories/reading-content.repository";
import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import type { HanziHomeCatalogData } from "@/features/hanzihome/types";
import { groupLibraryCourses } from "@/features/hanzihome/components/library/library-course-groups";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";
import type {} from "./Reading.browser.fixture";
import { dailyReadingSchema } from "@/features/daily-reading/model/daily-reading.schemas";
import {
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 dictationSourcesFromTextbook,
 translationSegmentsFromTextbook,
} from "@/features/hanzihome/practice/translation-practice";
import { buildBusinessChineseReaderDocument } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";

vi.mock("server-only", () => ({}));

it
 .runIf(process.env.READER_BROWSER_TEST === "1")
 .each(["study", "library-state", "library-selection"])(
 "keeps Reading study bindings on the facade runtime (%s)",
 async (mode) => {
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
   cacheDir: "node_modules/.vite/reading-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     ...[
      "@/features/hanzihome/hooks/useLearningState",
      "../hooks/useLearningState",
      "@/components/providers/QueryProvider",
      "@/features/speech/MandarinTtsProvider",
      "@/features/dictionary/hooks/useVocabInspector",
      "@/features/reader/components/Reader",
      "../model/cook-reader-data",
      "@/features/hanzihome/pronunciation/contextual-pronunciation",
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
    if (mode !== "study") {
     const catalog: HanziHomeCatalogData = {
      source: "db",
      courses: [
       {
        id: "course-a",
        slug: "course-a",
        title: "课程甲",
        type: "hanyu",
        order: 1,
        stats: { bookCount: 2, lessonCount: 2, vocabCount: 9, grammarCount: 5 },
       },
       {
        id: "course-b",
        slug: "course-b",
        title: "课程乙",
        type: "custom",
        order: 2,
        stats: { bookCount: 0, lessonCount: 0, vocabCount: 0, grammarCount: 0 },
       },
       {
        id: "course-a-empty",
        slug: "course-a-empty",
        title: "待建级别",
        type: "hanyu",
        order: 3,
        stats: { bookCount: 0, lessonCount: 0, vocabCount: 0, grammarCount: 0 },
       },
       {
        id: "boya-one",
        slug: "boya-one",
        title: "博雅第一版",
        type: "custom",
        order: 4,
        stats: { bookCount: 0, lessonCount: 0, vocabCount: 0, grammarCount: 0 },
       },
       {
        id: "boya-nine-volume-second-edition",
        slug: "boya-nine-volume-second-edition",
        title: "博雅第二版",
        type: "custom",
        order: 5,
        stats: { bookCount: 0, lessonCount: 0, vocabCount: 0, grammarCount: 0 },
       },
       {
        id: "listening-one",
        slug: "listening-one",
        title: "听力第一册",
        type: "listening",
        order: 6,
        stats: { bookCount: 0, lessonCount: 0, vocabCount: 0, grammarCount: 0 },
       },
      ],
      books: [
       { id: "book-a", courseId: "course-a", title: "第一册", order: 1 },
       { id: "book-empty", courseId: "course-a", title: "空册", order: 2 },
      ],
      lessons: [
       {
        id: "lesson-a1",
        courseId: "course-a",
        bookId: "book-a",
        lessonNumber: 1,
        title: "Lesson one",
        titleZh: "第一课",
        vocabCount: 4,
        grammarCount: 2,
        vocabIds: [],
        grammarPointIds: [],
        vocab: [],
        grammar: [],
       },
       {
        id: "lesson-a2",
        courseId: "course-a",
        bookId: "book-a",
        lessonNumber: 2,
        title: "Lesson two",
        titleZh: "第二课",
        vocabCount: 5,
        grammarCount: 3,
        vocabIds: [],
        grammarPointIds: [],
        vocab: [],
        grammar: [],
       },
      ],
      radicals: [],
      meta: {
       app: "hanzihome",
       dataset: "fixture",
       version: "1",
       generatedAt: "2026-10-10",
       sourceFiles: [],
       counts: { lessons: 2, vocab: 9, grammarPoints: 5, radicals: 0, flashcards: 0 },
      },
     };
     let currentCatalog = catalog;
     let failCatalog = false;
     let holdCatalog = false;
     let releaseCatalog = () => {};
     let catalogReads = 0;
     let roleReads = 0;
     let editable = false;
     const detailReads: string[] = [];
     const writes: string[] = [];
     await page.route("**/api/hanzihome/**", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
       writes.push(request.url());
       await route.fulfill({ status: 500, json: { error: "No writes in library test" } });
      } else if (request.url().includes("/catalog?")) {
       catalogReads += 1;
       expect(new URL(request.url()).search).toBe("?includeLessons=1");
       if (holdCatalog)
        await new Promise<void>((resolve) => {
         releaseCatalog = resolve;
        });
       await route.fulfill(
        failCatalog
         ? { status: 500, json: { error: "Catalog read failed" } }
         : { json: { catalog: currentCatalog } },
       );
      } else if (request.url().includes("/lessons/")) {
       detailReads.push(new URL(request.url()).pathname);
       const lesson = catalog.lessons.find((item) => request.url().includes(`/lessons/${item.id}`));
       if (!lesson) throw new Error("Unexpected lesson prefetch target");
       await route.fulfill({
        json: request.url().endsWith("/vocabulary")
         ? { resource: { lessonId: lesson.id, items: [], total: 0 } }
         : { lesson },
       });
      } else await route.fulfill({ status: 500, json: { error: "Unexpected library request" } });
     });
     await page.route("**/rest/v1/hanzihome_content_roles**", async (route) => {
      roleReads += 1;
      await route.fulfill({ json: { role: editable ? "editor" : "read_only" } });
     });
     await page.goto(url + "reading-test");
     await page.waitForFunction(() => Boolean(window.readingHarness));
     if (mode === "library-state") {
      holdCatalog = true;
      await page.evaluate(() => window.readingHarness.mountLibrary());
      await browserExpect.poll(() => catalogReads).toBe(1);
      await browserExpect(page.locator('[aria-busy="true"]')).toBeVisible();
      await browserExpect(page.getByRole("combobox")).toHaveCount(0);
      expect(detailReads).toEqual([]);
      failCatalog = true;
      holdCatalog = false;
      releaseCatalog();
      await browserExpect(page.getByRole("alert")).toBeVisible();
      await browserExpect(
       page.getByRole("heading", { name: "Chưa có giáo trình", exact: true }),
      ).toHaveCount(0);
      failCatalog = false;
      await page.getByRole("alert").getByRole("button").focus();
      await page.keyboard.press("Enter");
      await browserExpect(page.getByRole("combobox")).toHaveCount(1);
      await browserExpect(page.getByRole("heading", { name: "课程甲", exact: true })).toBeVisible();
      await browserExpect(page.getByRole("alert")).toHaveCount(0);
      expect(detailReads).toEqual([]);
      expect(catalogReads).toBe(2);
      await browserExpect.poll(() => roleReads).toBe(1);
      await browserExpect(page.getByRole("button", { name: "Sửa", exact: true })).toHaveCount(0);
      failCatalog = true;
      await page.evaluate(() => window.readingHarness.refreshLibrary());
      await browserExpect(page.getByRole("alert")).toBeVisible();
      // A failed background refresh must preserve the last successful catalog.
      await browserExpect(page.getByRole("combobox")).toHaveCount(1);
      await browserExpect(page.getByRole("heading", { name: "课程甲", exact: true })).toBeVisible();
      failCatalog = false;
      await page.getByRole("alert").getByRole("button").click();
      await browserExpect(page.getByRole("alert")).toHaveCount(0);
      expect(catalogReads).toBe(4);
      const locales: AppLocale[] = ["vi", "en", "zh-CN"];
      for (const locale of locales) {
       const messages = await loadAppMessages(locale);
       currentCatalog = catalog;
       holdCatalog = true;
       const previousReads = catalogReads;
       await page.evaluate((value) => window.readingHarness.mountLibrary(value), locale);
       await browserExpect.poll(() => catalogReads).toBe(previousReads + 1);
       await browserExpect(
        page.getByText(messages.Common.library.loading, { exact: true }),
       ).toHaveCount(1);
       holdCatalog = false;
       releaseCatalog();
       await browserExpect(page.getByRole("combobox")).toHaveCount(1);
       currentCatalog = { ...catalog, courses: [], books: [], lessons: [] };
       await page.evaluate((value) => window.readingHarness.mountLibrary(value), locale);
       await browserExpect(
        page.getByRole("heading", { name: messages.Common.library.noCoursesTitle, exact: true }),
       ).toBeVisible();
       await browserExpect(page.getByRole("combobox")).toHaveCount(0);
       failCatalog = true;
       await page.evaluate(() => window.readingHarness.refreshLibrary());
       await browserExpect(
        page.getByRole("button", { name: messages.Common.actions.retry, exact: true }),
       ).toBeVisible();
       await browserExpect(
        page.getByRole("heading", { name: messages.Common.library.noCoursesTitle, exact: true }),
       ).toBeVisible();
       failCatalog = false;
       currentCatalog = catalog;
       await page.getByRole("alert").getByRole("button").click();
       await browserExpect(page.getByRole("combobox")).toHaveCount(1);
       await browserExpect(
        page.getByRole("heading", {
         name: messages.Common.library.groups.hanyu.title,
         exact: true,
        }),
       ).toBeVisible();
       await browserExpect(
        page.getByText(messages.Common.library.noLessons, { exact: true }),
       ).toBeVisible();
       const copy = messages.Common.library;
       for (const group of groupLibraryCourses(catalog.courses, catalog.books)) {
        const heading = page.getByRole("heading", {
         name: copy.groups[group.key].title,
         exact: true,
        });
        await browserExpect(heading).toHaveCount(1);
        await browserExpect(
         page.getByText(copy.groups[group.key].description, { exact: true }),
        ).toHaveCount(1);
        await browserExpect(
         page.getByText(
          copy.collectionCounts
           .replace("{levels}", String(group.courses.length))
           .replace("{books}", String(group.bookCount))
           .replace("{lessons}", String(group.lessonCount)),
          { exact: true },
         ),
        ).toHaveCount(group.key === "hanyu" ? 1 : 4);
       }
       await browserExpect(page.getByText(copy.missingAdvancedVolume, { exact: true })).toHaveCount(
        1,
       );
       await browserExpect(page.getByText(copy.noBooksTitle, { exact: true })).toHaveCount(1);
       await browserExpect(page.getByText(copy.noBooksDescription, { exact: true })).toHaveCount(1);
       await browserExpect(
        page.getByText(copy.noCollectionBooksTitle, { exact: true }),
       ).toHaveCount(4);
       await browserExpect(
        page.getByText(copy.noCollectionBooksDescription, { exact: true }),
       ).toHaveCount(4);
       await browserExpect(
        page.getByText(copy.contentCounts.replace("{vocab}", "9").replace("{grammar}", "5"), {
         exact: true,
        }),
       ).toHaveCount(1);
       await browserExpect(
        page.getByText(copy.contentCounts.replace("{vocab}", "0").replace("{grammar}", "0"), {
         exact: true,
        }),
       ).toHaveCount(1);
       await browserExpect(page.getByRole("button", { name: copy.edit, exact: true })).toHaveCount(
        0,
       );
       await browserExpect(page.getByRole("combobox")).toHaveAccessibleName(
        copy.selectLessonAria.replace("{book}", "第一册"),
       );
       await browserExpect(
        page.getByRole("link", {
         name: copy.openLessonAria.replace("{title}", "第一课"),
         exact: true,
        }),
       ).toHaveText(copy.open);
       for (const viewport of [
        { width: 1440, height: 900 },
        { width: 820, height: 1180 },
        { width: 412, height: 915 },
       ]) {
        await page.setViewportSize(viewport);
        await browserExpect
         .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
         .toBe(true);
        const select = page.getByRole("combobox");
        await select.focus();
        await page.keyboard.press("Enter");
        await browserExpect(page.getByRole("option")).toHaveCount(2);
        await browserExpect(
         page.getByRole("option", {
          name: copy.lessonLabel.replace("{number}", "2").replace("{title}", "第二课"),
          exact: true,
         }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await browserExpect(select).toBeFocused();
       }
       await page.evaluate(
        (value) => window.readingHarness.mountLibrary(value, true, true),
        locale,
       );
       await browserExpect(page.getByLabel(copy.loadingRecent, { exact: true })).toBeVisible();
       await page.evaluate((value) => window.readingHarness.mountLibrary(value, true), locale);
       await browserExpect(
        page.getByRole("heading", { name: copy.recentTitle, exact: true }),
       ).toBeVisible();
       await browserExpect(
        page.getByText(messages.Home.modules.grammar, { exact: true }),
       ).toHaveCount(1);
       await browserExpect(
        page.getByRole("link", { name: copy.resume, exact: true }),
       ).toHaveAttribute(
        "href",
        "/hanzihome?courseId=course-a&bookId=book-a&lesson=1&module=grammar",
       );
       await browserExpect(page.getByText("课程甲 · 第一册", { exact: true })).toBeVisible();
       expect(errors).toEqual([]);
      }
      expect(detailReads).toEqual([]);
      await page.screenshot({ path: "/tmp/chines-app-library-locale-mobile-20261010.png" });
      editable = true;
      for (const locale of locales) {
       const messages = await loadAppMessages(locale);
       await page.evaluate((value) => window.readingHarness.mountLibrary(value), locale);
       const edit = page.getByRole("button", { name: messages.Common.library.edit, exact: true });
       await browserExpect(edit).toBeVisible();
       await edit.focus();
       await page.keyboard.press("Enter");
       const exitEdit = page.getByRole("button", {
        name: messages.Common.library.exitEdit,
        exact: true,
       });
       await browserExpect(exitEdit).toBeVisible();
       await exitEdit.focus();
       await page.keyboard.press("Enter");
       await browserExpect(edit).toBeFocused();
      }
     } else {
      await page.evaluate(() => window.readingHarness.mountLibrary());
      const select = page.getByRole("combobox");
      await browserExpect(select).toBeVisible();
      expect(detailReads).toEqual([]);
      const open = page.getByRole("link", { name: "Mở 第一课", exact: true });
      await browserExpect(open).toHaveAttribute(
       "href",
       "/hanzihome?courseId=course-a&bookId=book-a&lesson=1",
      );
      await select.click();
      await page.getByRole("option", { name: "Bài 2: 第二课", exact: true }).click();
      await browserExpect
       .poll(async () =>
        (await page.evaluate(() => window.readingHarness.snapshot())).routePrefetches.at(-1),
       )
       .toBe("/hanzihome?courseId=course-a&bookId=book-a&lesson=2");
      await browserExpect.poll(() => detailReads.length).toBe(2);
      expect(detailReads.toSorted()).toEqual([
       "/api/hanzihome/lessons/lesson-a2",
       "/api/hanzihome/lessons/lesson-a2/vocabulary",
      ]);
      const selectedOpen = page.getByRole("link", { name: "Mở 第二课", exact: true });
      await browserExpect(selectedOpen).toHaveAttribute(
       "href",
       "/hanzihome?courseId=course-a&bookId=book-a&lesson=2",
      );
      await selectedOpen.hover();
      await selectedOpen.focus();
      await browserExpect
       .poll(
        async () =>
         (await page.evaluate(() => window.readingHarness.snapshot())).routePrefetches.length,
       )
       .toBeGreaterThan(1);
      expect(detailReads).toHaveLength(2);
      currentCatalog = {
       ...catalog,
       lessons: catalog.lessons.filter((lesson) => lesson.id !== "lesson-a2"),
      };
      await page.evaluate(() => window.readingHarness.refreshLibrary());
      await browserExpect(open).toHaveAttribute(
       "href",
       "/hanzihome?courseId=course-a&bookId=book-a&lesson=1",
      );
      await select.focus();
      await open.focus();
      await browserExpect.poll(() => detailReads.length).toBe(4);
      expect(detailReads.slice(2).toSorted()).toEqual([
       "/api/hanzihome/lessons/lesson-a1",
       "/api/hanzihome/lessons/lesson-a1/vocabulary",
      ]);
      await page.evaluate(() => window.readingHarness.mountLibrary("vi", true));
      const recent = page.getByRole("link", { name: "Học tiếp", exact: true });
      await browserExpect(recent).toHaveAttribute(
       "href",
       "/hanzihome?courseId=course-a&bookId=book-a&lesson=1&module=grammar",
      );
      await recent.focus();
      await browserExpect
       .poll(async () =>
        (await page.evaluate(() => window.readingHarness.snapshot())).routePrefetches.at(-1),
       )
       .toBe("/hanzihome?courseId=course-a&bookId=book-a&lesson=1&module=grammar");
     }
     expect(writes).toEqual([]);
     expect(errors).toEqual([]);
     return;
    }
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
     } else if (request.url().includes("/reading/annotations?") && request.method() === "GET") {
      await route.fulfill({ json: { annotations: [] } });
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
    await browserExpect(page.locator("[data-app-scroll-viewport]")).toHaveCount(1);
    await page.addScriptTag({
     type: "module",
     url: url + "src/features/reading/workspaces/Reading.browser.fixture.tsx?bootstrap-reload=1",
    });
    await browserExpect(page.locator("[data-app-scroll-viewport]")).toHaveCount(1);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.readingHarness));
    await page.evaluate(() => window.readingHarness.mount());
    await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(
     resource.paragraphs.length,
    );
    const navigationSettled = page.locator("[data-app-scroll-viewport]").evaluate(
     (container) =>
      new Promise<void>((resolve) => {
       container.addEventListener("scrollend", () => resolve(), { once: true });
      }),
    );
    await page.getByRole("button", { name: chrome.commands.next, exact: true }).click();
    await navigationSettled;
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
    ).toHaveCount(0);
    await page.getByRole("combobox", { name: chrome.commands.openOutline, exact: true }).click();
    await page.getByRole("option").first().click();
    const beforeContinuous = (await page.evaluate(() => window.readingHarness.snapshot())).requests
     .length;
    await page
     .locator("[data-reader-toolbar]")
     .getByRole("button", { name: chrome.commands.listen, exact: true })
     .click();
    await browserExpect
     .poll(
      async () => (await page.evaluate(() => window.readingHarness.snapshot())).requests.length,
     )
     .toBe(beforeContinuous + 1);
    const beforeRefresh = await page.evaluate(() => window.readingHarness.metrics());
    const beforeRefreshReads = stateReads;
    const beforeRefreshWrites = writes.length;
    const samples: ReturnType<Window["readingHarness"]["metrics"]>[] = [];
    for (let repetition = 0; repetition < 5; repetition += 1) {
     await page.evaluate(() => window.readingHarness.resetMetrics());
     for (let tick = 1; tick <= 30; tick += 1) {
      await page.evaluate(() => window.readingHarness.refresh());
      await browserExpect(page.locator("[data-parent-render]")).toHaveAttribute(
       "data-parent-render",
       String(repetition * 30 + tick),
      );
     }
     const sample = await page.evaluate(() => window.readingHarness.metrics());
     samples.push(sample);
     expect(sample.readerCommits).toHaveLength(0);
     expect(sample.cookerCalls).toBe(0);
     expect(sample.analysisCalls).toBe(0);
     expect(sample.speechStops).toBe(beforeRefresh.speechStops);
     await browserExpect(page.locator(`[data-reader-segment="${paragraph.id}"]`)).toHaveAttribute(
      "data-active",
      "true",
     );
    }
    expect(stateReads).toBe(beforeRefreshReads);
    expect(writes).toHaveLength(beforeRefreshWrites);
    expect((await page.evaluate(() => window.readingHarness.snapshot())).requests).toHaveLength(
     beforeContinuous + 1,
    );
    await writeFile(
     "/tmp/chines-app-reader-parent-20261008.json",
     JSON.stringify(
      {
       mode: "Vite development React StrictMode",
       browser: browser.version(),
       userAgent: await page.evaluate(() => navigator.userAgent),
       viewport: page.viewportSize(),
       documentId: resource.document.id,
       paragraphs: resource.paragraphs.length,
       syntheticParentUpdates: 150,
       samples,
      },
      null,
      2,
     ),
    );
    await page.getByRole("button", { name: chrome.tools.title, exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: chrome.tools.pinyin, exact: true }).click();
    expect((await page.evaluate(() => window.readingHarness.snapshot())).display.showPinyin).toBe(
     false,
    );
    await page.getByRole("menuitemcheckbox", { name: chrome.tools.pinyin, exact: true }).click();
    await page.keyboard.press("Escape");
    expect((await page.evaluate(() => window.readingHarness.metrics())).speechStops).toBe(
     beforeRefresh.speechStops,
    );
    expect((await page.evaluate(() => window.readingHarness.snapshot())).requests).toHaveLength(
     beforeContinuous + 1,
    );
    await page.evaluate(() => window.readingHarness.finish());
    await browserExpect(page.locator(`[data-reader-segment="${second.id}"]`)).toHaveAttribute(
     "data-active",
     "true",
    );
    await browserExpect(
     page.getByRole("button", { name: chrome.commands.stopReading, exact: true }),
    ).toBeVisible();
    expect((await page.evaluate(() => window.readingHarness.snapshot())).requests.at(-1)).toEqual({
     segmentId: second.id,
     startOffset: 0,
    });
    await page.getByRole("button", { name: chrome.commands.stopReading, exact: true }).click();
    await browserExpect(
     page.getByRole("button", { name: chrome.commands.stopReading, exact: true }),
    ).toHaveCount(0);
    await page.getByRole("combobox", { name: chrome.commands.openOutline, exact: true }).click();
    await page.getByRole("option").last().click();
    await page
     .getByRole("button", { name: messages.Reader.study.shadowing.listen, exact: true })
     .click();
    const beforeTakeover = (await page.evaluate(() => window.readingHarness.snapshot())).requests
     .length;
    await page
     .locator("[data-reader-toolbar]")
     .getByRole("button", { name: chrome.commands.listen, exact: true })
     .click();
    await browserExpect
     .poll(
      async () => (await page.evaluate(() => window.readingHarness.snapshot())).requests.length,
     )
     .toBe(beforeTakeover + 1);
    await page.getByRole("button", { name: chrome.tools.shadowing, exact: true }).click();
    await browserExpect(
     page.getByRole("button", { name: messages.Reader.study.shadowing.start, exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: chrome.commands.stopReading, exact: true }).click();
    await browserExpect(
     page.getByRole("button", { name: chrome.commands.stopReading, exact: true }),
    ).toHaveCount(0);
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
     const outline = page.getByRole("combobox", { name: chrome.commands.openOutline, exact: true });
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
    await browserExpect(page.locator('[aria-label^="Kiểm tra pinyin chữ"]').first()).toBeVisible();
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
    const textbook = getTextbookLesson("doc-hieu", 1);
    const textbookBook = getTextbookCatalog().find((book) => book.key === "doc-hieu");
    const answerSection = textbook?.sections.find((section) =>
     section.blocks.some((block) => block.answerColumnIndexes?.length),
    );
    const answerTable = answerSection?.blocks.find((block) => block.answerColumnIndexes?.length);
    if (!textbook || !textbookBook || !answerSection || !answerTable)
     throw new Error("Missing real textbook answer table");
    const textbookSegments = buildBusinessChineseReaderDocument(textbook, "text").segments;
    const translationCount = translationSegmentsFromTextbook(textbook).length;
    const dictationCount = dictationSourcesFromTextbook(textbook).reduce(
     (count, source) => count + source.entries.length,
     0,
    );
    const textbookLocales: AppLocale[] = ["en", "zh-CN", "vi"];
    for (const locale of textbookLocales) {
     const localized = await loadAppMessages(locale);
     const labels = localized.BusinessChinese;
     await page.setViewportSize({ width: 1440, height: 900 });
     await page.evaluate(
      (currentLocale) => window.readingHarness.mountBusiness("doc-hieu", currentLocale),
      locale,
     );
     await browserExpect(
      page.getByRole("button", {
       name: labels.practice.translation.open.replace("{count}", String(translationCount)),
       exact: true,
      }),
     ).toBeVisible();
     await browserExpect(
      page.getByText(labels.practice.translation.description, { exact: true }),
     ).toBeVisible();
     await browserExpect(
      page.getByRole("button", {
       name: labels.practice.dictation.open.replace("{count}", String(dictationCount)),
       exact: true,
      }),
     ).toBeVisible();
     const section = page.locator(`[id="${answerSection.id}"]`);
     const tableControls = section.getByRole("table").locator("..").locator("..");
     const promptCells = answerTable.rows[1]?.length ?? 0;
     const hiddenColumns = answerTable.answerColumnIndexes ?? [];
     await browserExpect(section.locator("td")).toHaveCount(
      (answerTable.rows.length - 1) * (promptCells - hiddenColumns.length),
     );
     await browserExpect(tableControls.getByRole("cell", { name: "-5℃", exact: true })).toHaveCount(
      0,
     );
     await tableControls
      .getByRole("button", { name: labels.actions.showAnswer, exact: true })
      .click();
     await browserExpect(section.locator("td")).toHaveCount(
      (answerTable.rows.length - 1) * promptCells,
     );
     await browserExpect(
      tableControls.getByRole("cell", { name: "-5℃", exact: true }),
     ).toBeVisible();
     await browserExpect(
      tableControls.getByRole("button", { name: labels.actions.hideAnswer, exact: true }),
     ).toHaveAttribute("aria-expanded", "true");
     await tableControls
      .getByRole("button", { name: labels.actions.hideAnswer, exact: true })
      .click();
     await browserExpect(
      tableControls.getByRole("button", { name: labels.actions.showAnswer, exact: true }),
     ).toHaveAttribute("aria-expanded", "false");
     await browserExpect(tableControls.getByRole("cell", { name: "-5℃", exact: true })).toHaveCount(
      0,
     );
     for (const viewport of [
      { width: 820, height: 1180 },
      { width: 412, height: 915 },
     ]) {
      await page.setViewportSize(viewport);
      await browserExpect
       .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
       .toBe(true);
      const nav = page.getByRole("button", {
       name: `${labels.tabsLabel}: ${labels.tabs.practice}`,
       exact: true,
      });
      await nav.click();
      await browserExpect(
       page.getByRole("menu").getByText(labels.utilities, { exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await browserExpect(nav).toBeFocused();
     }
     await page.setViewportSize({ width: 1440, height: 900 });
     await page.getByRole("tab", { name: labels.tabs.text, exact: true }).click();
     await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(
      textbookSegments.length,
     );
     await browserExpect
      .poll(async () =>
       (await page.evaluate(() => window.readingHarness.snapshot())).navigationRequests.at(-1),
      )
      .toBe("/hsk/doc-hieu?lesson=1&tab=text");
     await browserExpect
      .poll(
       async () =>
        (await page.evaluate(() => window.readingHarness.snapshot())).learningState.settings
         .bookResume?.[`static:${textbookBook.id}`],
      )
      .toEqual({ lessonId: textbook.id, module: "text" });
    }
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
