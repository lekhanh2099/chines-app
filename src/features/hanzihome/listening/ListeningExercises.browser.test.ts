import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";
import type {} from "./ListeningExercises.browser.fixture";
import { writeFile } from "node:fs/promises";
import type { ListeningLessonBundle } from "./listening.types";

it.runIf(process.env.LISTENING_BROWSER_TEST === "1")(
 "keeps dictation timing and clears checked feedback after edits or matching reset",
 async () => {
  const fixture = fileURLToPath(
   new URL("./ListeningExercises.browser.fixture.tsx", import.meta.url),
  );
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/listening-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@/features/hanzihome/context/selectors", replacement: fixture },
     { find: "@/features/hanzihome/context/actions", replacement: fixture },
     { find: "@/i18n/navigation", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "@/lib/pronunciation/pinyin-engine", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "listening-exercises-test-page",
     configureServer(instance) {
      instance.middlewares.use("/listening-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/listening-audit",
         '<!doctype html><html><body><script type="module" src="/src/features/hanzihome/listening/ListeningExercises.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Missing Listening fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    await page.goto(url + "listening-audit");
    const blank = page.getByRole("region", { name: "Fill answer fixture", exact: true });
    const answer = blank.getByRole("textbox", { name: "Đáp án câu 1", exact: true });
    await answer.fill("学习");
    await blank.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await browserExpect(blank.getByText("✓ Chính xác", { exact: true })).toBeVisible();
    await answer.fill("学");
    await browserExpect(blank.getByText("✓ Chính xác", { exact: true })).toHaveCount(0);
    await blank.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await browserExpect(blank.getByText("✕ 学习", { exact: true })).toBeVisible();

    const matching = page.getByRole("region", { name: "Matching fixture", exact: true });
    await matching.getByRole("button", { name: "河SôngChưa nối", exact: true }).click();
    await matching.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await browserExpect(matching.getByText("✓ Nối chính xác", { exact: true })).toBeVisible();
    await matching.getByRole("button", { name: "Làm lại", exact: true }).click();
    await browserExpect(matching.getByText("✓ Nối chính xác", { exact: true })).toHaveCount(0);
    await browserExpect(
     matching.getByRole("button", { name: "Kiểm tra", exact: true }),
    ).toBeDisabled();

    await page.evaluate(() => window.listeningHarness.mountDictation("sentence"));
    const dictation = page.getByRole("region", { name: "Dictation fixture", exact: true });
    const answerOne = dictation.getByRole("textbox", {
     name: "Bài chép chính tả đoạn 1",
     exact: true,
    });
    const answerTwo = dictation.getByRole("textbox", {
     name: "Bài chép chính tả đoạn 2",
     exact: true,
    });
    const firstCard = dictation.locator('[data-slot="card"]').filter({
     has: page.getByRole("textbox", { name: "Bài chép chính tả đoạn 1", exact: true }),
    });
    const secondCard = dictation.locator('[data-slot="card"]').filter({
     has: page.getByRole("textbox", { name: "Bài chép chính tả đoạn 2", exact: true }),
    });
    await browserExpect(
     firstCard.getByRole("button", { name: "Kiểm tra", exact: true }),
    ).toBeDisabled();
    await firstCard.getByRole("button", { name: "Nghe câu", exact: true }).click();
    await page.evaluate(() => window.listeningHarness.setTime(2500));
    await answerOne.fill("你好。");
    await firstCard.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await browserExpect(firstCard.getByText("Chính xác", { exact: true })).toBeVisible();
    expect((await page.evaluate(() => window.listeningHarness.snapshot())).attempts).toMatchObject([
     { entryId: "one", score: 100, responseMs: 1500 },
    ]);
    await answerOne.fill("你。");
    await browserExpect(firstCard.getByText("Chính xác", { exact: true })).toHaveCount(0);
    await page.evaluate(() => window.listeningHarness.setTime(3000));
    await firstCard.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    expect(
     (await page.evaluate(() => window.listeningHarness.snapshot())).attempts[1],
    ).toMatchObject({
     entryId: "one",
     answer: "你。",
     responseMs: 500,
    });
    await page.evaluate(() => window.listeningHarness.setTime(4000));
    await answerTwo.fill("谢谢！");
    await page.evaluate(() => window.listeningHarness.setTime(4500));
    await secondCard.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    expect(
     (await page.evaluate(() => window.listeningHarness.snapshot())).attempts[2],
    ).toMatchObject({
     entryId: "two",
     score: 100,
     responseMs: 500,
    });
    await page.evaluate(() => window.listeningHarness.mountDictation("paragraph", "two"));
    await browserExpect(answerOne).toHaveCount(0);
    await browserExpect(answerTwo).toHaveValue("谢谢！");
    await secondCard.getByRole("button", { name: "Nghe đoạn", exact: true }).click();
    expect((await page.evaluate(() => window.listeningHarness.snapshot())).speeches).toEqual([
     ["你好。"],
     ["你好。", "谢谢！"],
    ]);

    await page.clock.install({ time: new Date("2026-10-08T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-08T00:00:01Z"));
    await page.evaluate(() => window.listeningHarness.mountStudio());
    const studio = page.getByRole("region", { name: "Studio editor fixture", exact: true });
    const studioAnswer = studio.getByRole("textbox");
    await browserExpect(studioAnswer).toBeFocused();
    await browserExpect(studio.getByRole("button", { name: /^Kiểm tra/ })).toBeDisabled();
    await studioAnswer.fill("你。");
    await studioAnswer.press("Control+Enter");
    await browserExpect(studio.getByText("50%", { exact: true })).toBeVisible();
    expect((await page.evaluate(() => window.listeningHarness.studioSnapshot())).attempts).toEqual([
     {
      entryId: "one",
      expectedText: "你好。",
      answer: "你。",
      score: 50,
      mistakeCount: 1,
      responseMs: null,
     },
    ]);
    await page.clock.runFor(1000);
    expect(
     (await page.evaluate(() => window.listeningHarness.studioSnapshot())).navigation,
    ).toEqual([]);
    await studio.getByRole("button", { name: "Sửa lại", exact: true }).click();
    await browserExpect(studioAnswer).toBeFocused();
    await studioAnswer.fill("你好。");
    await studioAnswer.press("Control+Enter");
    await browserExpect(studio.getByText("100%", { exact: true })).toBeVisible();
    await page.evaluate(() => window.listeningHarness.mountStudio());
    await page.clock.runFor(899);
    await browserExpect(studio.getByText("Phần 1/2", { exact: true })).toBeVisible();
    await page.clock.runFor(1);
    await browserExpect(studio.getByText("Phần 2/2", { exact: true })).toBeVisible();
    await browserExpect(studioAnswer).toHaveValue("");
    await studio.getByRole("button", { name: /^←/ }).click();
    await browserExpect(studio.getByText("100%", { exact: true })).toBeVisible();
    await studio.getByRole("button", { name: "Sửa lại", exact: true }).click();
    await browserExpect(studioAnswer).toHaveValue("你好。");
    await studioAnswer.press("Control+Enter");
    await studio.getByRole("button", { name: /^Phần sau →/ }).click();
    await page.clock.runFor(1000);
    expect(
     (await page.evaluate(() => window.listeningHarness.studioSnapshot())).navigation,
    ).toEqual(["next:one", "previous:two", "next:one"]);
    await studio.getByRole("button", { name: /^←/ }).click();
    await studio.getByRole("button", { name: "Sửa lại", exact: true }).click();
    await studioAnswer.press("Control+Enter");
    await page.evaluate(() => window.listeningHarness.unmount());
    await browserExpect(studio).toHaveCount(0);
    await page.clock.runFor(1000);
    const studioSnapshot = await page.evaluate(() => window.listeningHarness.studioSnapshot());
    expect(studioSnapshot.navigation).toEqual([
     "next:one",
     "previous:two",
     "next:one",
     "previous:two",
    ]);
    expect(studioSnapshot.attempts).toHaveLength(4);
    expect(studioSnapshot.attempts.slice(1).every((attempt) => attempt.score === 100)).toBe(true);
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 30_000,
);

it.runIf(process.env.LISTENING_BROWSER_TEST === "1")(
 "keeps lesson feedback source-specific and measures custom Dictation pinyin work",
 async () => {
  const fixture = fileURLToPath(
   new URL("./ListeningExercises.browser.fixture.tsx", import.meta.url),
  );
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/listening-workspace-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@/features/hanzihome/context/selectors", replacement: fixture },
     { find: "@/features/hanzihome/context/actions", replacement: fixture },
     { find: "@/i18n/navigation", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "@/lib/pronunciation/pinyin-engine", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "dictation-workspace-test-page",
     configureServer(instance) {
      instance.middlewares.use("/dictation-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/dictation-audit",
         '<!doctype html><script type="module" src="/src/features/hanzihome/listening/ListeningExercises.browser.fixture.tsx"></script>',
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
   if (!url) throw new Error("Missing Dictation workspace fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/tts", (route) =>
     route.fulfill({
      json: [
       { name: "Xiaoxiao", shortName: "zh-CN-XiaoxiaoNeural", gender: "Female", locale: "zh-CN" },
      ],
     }),
    );
    await page.goto(url + "dictation-audit");
    const lessonBundle: ListeningLessonBundle = {
     lesson: { id: "fixture", titleZh: "朋友" },
     sections: [],
     items: [],
    };
    let lessonReads = 0;
    let releaseLesson = () => {};
    await page.route("**/api/hanzihome/listening/lessons/**", async (route) => {
     lessonReads += 1;
     const requestNumber = lessonReads;
     await new Promise<void>((resolve) => {
      releaseLesson = resolve;
     });
     await route.fulfill(
      requestNumber <= 2
       ? { status: 500, json: { error: "Controlled lesson failure" } }
       : { json: { bundle: lessonBundle } },
     );
    });
    await page.route("**/api/hanzihome/tts/library", (route) =>
     route.fulfill({ json: { folders: [], clips: [] } }),
    );
    await page.evaluate(() => window.listeningHarness.mountWorkspace(false));
    const lessonLoading = page.getByText("Đang tải bài nghe chép…", { exact: true });
    const lessonError = page.getByRole("alert");
    const lessonSource = page.getByRole("button", { name: "Bài học / bài đọc HSK", exact: true });
    const customSource = page.getByRole("button", { name: "Dán nội dung", exact: true });
    await page.getByRole("button", { name: "Fixture book", exact: true }).click();
    await browserExpect.poll(() => lessonReads).toBe(1);
    await browserExpect(lessonLoading).toBeVisible();
    await customSource.click();
    await browserExpect(lessonLoading).toHaveCount(0);
    await browserExpect(lessonError).toHaveCount(0);
    await lessonSource.click();
    await browserExpect(lessonLoading).toBeVisible();
    releaseLesson();
    await browserExpect(lessonError).toContainText("Không tải được nội dung luyện");
    await lessonError.getByRole("button", { name: "Thử lại", exact: true }).click();
    await browserExpect.poll(() => lessonReads).toBe(2);
    await browserExpect(lessonLoading).toBeVisible();
    releaseLesson();
    await browserExpect(lessonError).toContainText("Không tải được nội dung luyện");
    await customSource.click();
    await browserExpect(lessonLoading).toHaveCount(0);
    await browserExpect(lessonError).toHaveCount(0);
    await page.getByRole("button", { name: "Từ thư viện giọng đọc", exact: true }).click();
    await browserExpect(
     page.getByText("Chưa có bản ghi giọng đọc. Hãy tạo bản ghi trước khi luyện.", { exact: true }),
    ).toBeVisible();
    await browserExpect(lessonLoading).toHaveCount(0);
    await browserExpect(lessonError).toHaveCount(0);
    await lessonSource.click();
    await browserExpect.poll(() => lessonReads).toBe(3);
    await browserExpect(lessonLoading).toBeVisible();
    releaseLesson();
    await browserExpect(lessonLoading).toHaveCount(0);
    await browserExpect(lessonError).toHaveCount(0);
    await browserExpect(
     page.getByRole("button", { name: "Vào luyện nghe chép", exact: true }),
    ).toHaveCount(0);
    await page.evaluate(() => window.listeningHarness.mountWorkspace(false, true));
    await browserExpect(
     page.getByText("Chưa có nội dung chép chính tả trong thư viện.", { exact: true }),
    ).toBeVisible();
    await browserExpect(lessonLoading).toHaveCount(0);
    await browserExpect(lessonError).toHaveCount(0);
    expect(lessonReads).toBe(3);
    await page.evaluate(() => window.listeningHarness.unmount());
    await browserExpect(
     page.getByText("Chưa có nội dung chép chính tả trong thư viện.", { exact: true }),
    ).toHaveCount(0);
    await page.evaluate(() => window.listeningHarness.mountWorkspace());
    await page.getByRole("button", { name: "Dán nội dung", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Nội dung nghe chép tự dán", exact: true });
    await input.fill("你好。");
    await browserExpect(input).toHaveValue("你好。");
    await page.evaluate(() => window.listeningHarness.resetPinyinSamples());
    for (let repetition = 0; repetition < 5; repetition += 1) {
     for (const characters of [1000, 10_000, 50_000]) {
      const text = "你好。".repeat(Math.ceil(characters / 3)).slice(0, characters);
      await input.fill(text);
      await browserExpect(input).toHaveValue(text);
     }
    }
    const samples = await page.evaluate(() => window.listeningHarness.pinyinSamples());
    expect(samples).toEqual([]);
    await writeFile(
     "/tmp/chines-app-dictation-input-after-20261008.json",
     JSON.stringify(samples, null, 2) + "\n",
    );
    await input.fill(" \n ");
    await browserExpect(
     page.getByRole("button", { name: "Vào luyện nghe chép", exact: true }),
    ).toHaveCount(0);
    await input.fill(" 你好。 \n");
    await page.evaluate(() => window.listeningHarness.resetPinyinSamples());
    await page.getByRole("button", { name: "Vào luyện nghe chép", exact: true }).click();
    await page.getByRole("button", { name: "Bắt đầu luyện", exact: true }).click();
    await page.getByRole("button", { name: "Pinyin", exact: true }).click();
    await browserExpect(page.getByText("nǐ hǎo 。", { exact: true })).toBeVisible();
    expect(
     (await page.evaluate(() => window.listeningHarness.pinyinSamples())).map(
      (sample) => sample.characters,
     ),
    ).toEqual([3]);
    await page.evaluate(() => window.listeningHarness.resetPinyinSamples());
    await input.fill("谢谢。");
    await browserExpect(page.getByText("Luyện nghe chép", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => window.listeningHarness.pinyinSamples())).toEqual([]);
    await page.getByRole("button", { name: "Vào luyện nghe chép", exact: true }).click();
    await page.getByRole("button", { name: "Bắt đầu luyện", exact: true }).click();
    await page.getByRole("button", { name: "Pinyin", exact: true }).click();
    await browserExpect(page.getByText("xiè xie 。", { exact: true })).toBeVisible();
    expect(
     (await page.evaluate(() => window.listeningHarness.pinyinSamples())).map(
      (sample) => sample.characters,
     ),
    ).toEqual([3]);
    await page.evaluate(() => window.listeningHarness.unmount());
    await browserExpect(input).toHaveCount(0);
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
