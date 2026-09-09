import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";

import type { ReaderBrowserHarness } from "./Reader.browser.fixture";
import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

it.runIf(process.env.READER_BROWSER_TEST === "1")(
 "mounts isolated Reader with StrictMode and real DOM subscriptions",
 async () => {
  const server = await createServer({
   configFile: false,
   resolve: { alias: { "@": fileURLToPath(new URL("../../../", import.meta.url)) } },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "reader-test-page",
     configureServer(instance) {
      instance.middlewares.use("/reader-test", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/reader-test",
         '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script type="module" src="/src/features/reader/runtime/Reader.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Reader fixture server did not start");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}reader-test`);
    await page.waitForFunction(() => Boolean(window.readerHarness));
    expect(await page.evaluate(() => window.readerHarness.rubySelection())).toEqual({
     text: "你好",
     start: 0,
     end: 2,
    });
    await page.evaluate(() => window.readerHarness.mount());
    await browserExpect(page.locator("[data-probe]")).toHaveCount(3);
    const initial: ReturnType<ReaderBrowserHarness["snapshot"]> = await page.evaluate(() =>
     window.readerHarness.snapshot(),
    );
    await page.evaluate(() => window.readerHarness.select("b"));
    await browserExpect(page.locator('[data-probe="b"]')).toHaveAttribute("data-active", "true");
    const selected = await page.evaluate(() => window.readerHarness.snapshot());
    expect(selected.counts.c).toBe(initial.counts.c);
    expect(selected.counts.a).toBeGreaterThan(initial.counts.a ?? 0);
    expect(selected.counts.b).toBeGreaterThan(initial.counts.b ?? 0);
    await page.evaluate(() => window.readerHarness.play());
    await page.evaluate(() => window.readerHarness.progress(0, 0.4));
    await browserExpect(page.locator('[data-probe="b"]')).toHaveAttribute("data-progress", "0.4");
    const progressed = await page.evaluate(() => window.readerHarness.snapshot());
    expect(progressed.counts.a).toBe(selected.counts.a);
    expect(progressed.counts.c).toBe(selected.counts.c);
    await page.evaluate(() => window.readerHarness.mount(true));
    await page.waitForFunction(() => window.readerHarness.snapshot().stops.first === 1);
    await page.evaluate(() => window.readerHarness.play());
    await page.evaluate(() => window.readerHarness.finish(0));
    expect((await page.evaluate(() => window.readerHarness.snapshot())).pending).toBe(2);
    await page.evaluate(() => window.readerHarness.unmount());
    const ended = await page.evaluate(() => window.readerHarness.snapshot());
    expect(ended.stops).toEqual({ first: 1, second: 1 });
    expect(ended.state?.playback.status).toBe("idle");
    await page.reload();
    await page.waitForFunction(() => Boolean(window.readerHarness));
    await page.evaluate(() => window.readerHarness.mount());
    await browserExpect(page.locator("[data-probe]")).toHaveCount(3);
    await page.evaluate(() => window.readerHarness.play());
    await page.evaluate(() => window.readerHarness.replaceContent([{ id: "new", zh: "新内容。" }]));
    await browserExpect(page.locator('[data-probe="new"]')).toHaveText("新内容。");
    const replaced = await page.evaluate(() => window.readerHarness.snapshot());
    expect(replaced.stops.first).toBe(1);
    expect(replaced.state?.navigation.activeSegmentId).toBe("new");
    await page.evaluate(() => window.readerHarness.finish(0));
    expect((await page.evaluate(() => window.readerHarness.snapshot())).pending).toBe(1);
    for (const viewport of [
     { width: 390, height: 844 },
     { width: 820, height: 1180 },
     { width: 1440, height: 900 },
    ]) {
     await page.reload();
     await page.setViewportSize(viewport);
     await page.waitForFunction(() => Boolean(window.readerHarness));
     await page.evaluate(() => window.readerHarness.facade("你好。"));
     await browserExpect(page.locator("[data-reader-source]")).toHaveText("你好。");
     await page.evaluate(() =>
      window.readerHarness.facade({
       id: "article",
       language: "zh-CN",
       source: { kind: "article", sourceId: "article" },
       title: "朋友",
       sections: [{ id: "dialogue", title: "对话", segmentIds: ["turn"] }],
       segments: [
        {
         id: "turn",
         sectionId: "dialogue",
         kind: "dialogue-turn",
         zh: "你好。",
         speaker: { id: "speaker", label: "小明" },
        },
       ],
       metadata: [],
       capabilities: [],
      }),
     );
     await browserExpect(page.locator('[data-edit-section="dialogue"]')).toBeVisible();
     await browserExpect(page.locator('[data-edit-segment="turn"]')).toContainText("小明");
     await page.evaluate(() =>
      window.readerHarness.facade(
       Array.from({ length: 100 }, (_, index) => ({
        id: `segment-${index}`,
        zh: "你好，中国。",
        pinyin: "nǐ hǎo, zhōng guó",
        vi: "Xin chào, Trung Quốc.",
       })),
      ),
     );
     await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(100);
     await page.getByRole("button", { name: "Hiện pinyin", exact: true }).click();
     await browserExpect(page.locator('[lang="zh-Latn-pinyin"]')).toHaveCount(0);
     await page.getByRole("button", { name: "Đoạn sau", exact: true }).click();
     await browserExpect(page.locator('[data-reader-segment="segment-1"]')).toHaveAttribute(
      "data-active",
      "true",
     );
     await browserExpect(page.locator("[data-workspace-active]")).toHaveAttribute(
      "data-workspace-active",
      "segment-1",
     );
     const outline = page.getByRole("combobox", { name: "Mục lục bài đọc", exact: true });
     await browserExpect(outline).toHaveAttribute("aria-expanded", "false");
     expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
     ).toBe(true);
    }
    await page.reload();
    await page.waitForFunction(() => Boolean(window.readerHarness));
    await page.evaluate(() =>
     window.readerHarness.facade([{ id: "source", zh: "你好。", pinyin: "nǐ hǎo" }], true),
    );
    await browserExpect(page.locator('[data-reader-segment="source"]')).toBeVisible();
    const glyph = page.getByRole("button", { name: "Đọc từ chữ 好", exact: true });
    await glyph.focus();
    await page.keyboard.press("Enter");
    expect((await page.evaluate(() => window.readerHarness.snapshot())).inputs).toEqual([
     { segmentId: "source", text: "你好。", startOffset: 1 },
    ]);
    await page.locator("[data-reader-source]").evaluate((source) => {
     const range = document.createRange();
     range.selectNodeContents(source);
     const selection = window.getSelection();
     selection?.removeAllRanges();
     selection?.addRange(range);
     source.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
    expect((await page.evaluate(() => window.readerHarness.snapshot())).lookups).toEqual([
     "你好。",
    ]);
    const touch = await browser.newPage({
     viewport: { width: 820, height: 1180 },
     hasTouch: true,
     isMobile: true,
    });
    touch.on("pageerror", (error) => errors.push(error.message));
    const locales: AppLocale[] = ["vi", "en", "zh-CN"];
    for (const locale of locales) {
     const messages = await loadAppMessages(locale);
     const labels = messages.Reader.study.chrome.tools;
     await touch.goto(`${url}reader-test`);
     await touch.waitForFunction(() => Boolean(window.readerHarness));
     await touch.evaluate(
      (language) =>
       window.readerHarness.facade(
        [{ id: "tap", zh: "你好。", pinyin: "nǐ hǎo", vi: "Xin chào." }],
        false,
        language,
       ),
      locale,
     );
     const toolsButton = touch.getByRole("button", { name: labels.title, exact: true });
     await toolsButton.tap();
     await browserExpect(touch.getByRole("dialog")).toHaveCount(1);
     await browserExpect(
      touch.getByRole("heading", { name: labels.font, exact: true }),
     ).toBeVisible();
     await touch.getByRole("button", { name: labels.fonts.songti, exact: true }).tap();
     await browserExpect(
      touch.getByRole("button", { name: labels.fonts.songti, exact: true }),
     ).toHaveAttribute("aria-pressed", "true");
     await touch.getByRole("button", { name: labels.sizes["3xl"], exact: true }).tap();
     await touch.getByRole("button", { name: labels.revealModes.tap, exact: true }).tap();
     await touch.keyboard.press("Escape");
     await browserExpect(toolsButton).toBeFocused();
     await browserExpect(
      touch.getByRole("button", { name: labels.showPinyin, exact: true }),
     ).toBeDisabled();
     await touch.getByRole("button", { name: labels.revealNext, exact: true }).tap();
     await browserExpect(touch.locator("[data-reader-source]")).toBeHidden();
     await browserExpect(touch.locator('[lang="zh-Latn-pinyin"]')).toHaveText("nǐ hǎo");
     await touch.getByRole("button", { name: labels.revealNext, exact: true }).tap();
     await browserExpect(touch.getByText("Xin chào.", { exact: true })).toBeVisible();
     expect(
      await touch.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
     ).toBe(true);
    }
    await touch.close();
    await page.reload();
    await page.waitForFunction(() => Boolean(window.readerHarness));
    await page.evaluate(async () => {
     window.readerHarness.useViewport();
     await window.readerHarness.facade(
      Array.from({ length: 30 }, (_, index) => ({
       id: `viewport-${index}`,
       zh: "你好，中国。",
      })),
     );
    });
    await browserExpect(page.locator("[data-reader-segment]")).toHaveCount(30);
    await page.evaluate(() => window.readerHarness.scrollWithDefaultOptions("viewport-20"));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.getByRole("button", { name: "Mục lục bài đọc", exact: true }).click();
    await page.getByRole("option").nth(20).click();
    await browserExpect(page.locator('[data-reader-segment="viewport-20"]')).toHaveAttribute(
     "data-active",
     "true",
    );
    await browserExpect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await browserExpect(page.locator('[data-reader-segment="viewport-20"]')).toBeInViewport();
    await page.reload();
    await page.waitForFunction(() => Boolean(window.readerHarness));
    await page.evaluate(() =>
     window.readerHarness.facade(
      [{ id: "source", zh: "你好。", pinyin: "nǐ hǎo" }],
      true,
      "vi",
      true,
     ),
    );
    await browserExpect(page.locator("ruby")).toHaveCount(2);
    await page.getByRole("button", { name: "Mở ghi chú cho 你", exact: true }).click();
    await page.getByRole("button", { name: "Pinyin chữ 好 cần kiểm tra", exact: true }).click();
    expect((await page.evaluate(() => window.readerHarness.snapshot())).annotationActions).toEqual([
     "annotation",
    ]);
    expect((await page.evaluate(() => window.readerHarness.snapshot())).reviews).toEqual(["好"]);
    await page.locator("[data-reader-source]").evaluate((source) => {
     const range = document.createRange();
     range.selectNodeContents(source);
     window.getSelection()?.removeAllRanges();
     window.getSelection()?.addRange(range);
     source.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
    const selectedRuby = await page.evaluate(() => window.readerHarness.snapshot());
    expect(selectedRuby.annotationActions).toEqual(["annotation", "你好。"]);
    expect(selectedRuby.lookups).toEqual([]);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.readerHarness));
    await page.evaluate(() => window.readerHarness.pair());
    await browserExpect(page.locator("[data-reader]")).toHaveCount(2);
    const firstReader = page.locator("[data-reader]").nth(0);
    const secondReader = page.locator("[data-reader]").nth(1);
    await firstReader.getByRole("button", { name: "Hiện pinyin", exact: true }).click();
    await browserExpect(firstReader.locator('[lang="zh-Latn-pinyin"]')).toHaveCount(0);
    await browserExpect(secondReader.locator('[lang="zh-Latn-pinyin"]')).toHaveText("zài jiàn");
    await firstReader.getByRole("button", { name: "Nghe bài", exact: true }).click();
    await secondReader.getByRole("button", { name: "Nghe bài", exact: true }).click();
    await browserExpect(
     firstReader.getByRole("button", { name: "Dừng đọc", exact: true }),
    ).toBeDisabled();
    await browserExpect(
     secondReader.getByRole("button", { name: "Dừng đọc", exact: true }),
    ).toBeEnabled();
    expect(
     (await page.evaluate(() => window.readerHarness.snapshot())).inputs.map((input) => input.text),
    ).toEqual(["你好。", "再见。"]);
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
