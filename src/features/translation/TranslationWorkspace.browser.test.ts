import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { createServer } from "vite";
import { expect, it } from "vitest";
import type { PracticeAttemptPayload } from "@/features/hanzihome/practice/practice-attempt-api";
import type { PracticeAttemptRow } from "@/features/hanzihome/practice/practice-attempt.schemas";
import { appLocales } from "@/i18n/config";
import vietnameseMessages from "../../../messages/vi/humanities-practice.json";
import englishMessages from "../../../messages/en/humanities-practice.json";
import chineseMessages from "../../../messages/zh-CN/humanities-practice.json";
import type {} from "./TranslationWorkspace.browser.fixture";

it.runIf(process.env.TRANSLATION_BROWSER_TEST === "1")(
 "keeps preparation scoped to segment/direction and saves recordings to their starting segment",
 async () => {
  const fixture = fileURLToPath(
   new URL("./TranslationWorkspace.browser.fixture.tsx", import.meta.url),
  );
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/translation-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "next/navigation", replacement: fixture },
     { find: "@/i18n/navigation", replacement: fixture },
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@/components/ui/display/typography", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "translation-test-page",
     configureServer(instance) {
      instance.middlewares.use("/translation-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/translation-audit",
         '<!doctype html><script type="module" src="/src/features/translation/TranslationWorkspace.browser.fixture.tsx"></script>',
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
   if (!url) throw new Error("Missing Translation fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    const recordings: string[] = [];
    let historyFails = false;
    let writesFail = false;
    const history: PracticeAttemptRow[] = [];
    let releaseHistory = () => {};
    const initialHistory = new Promise<void>((resolve) => {
     releaseHistory = resolve;
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install({ time: new Date("2026-10-08T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-08T00:00:01Z"));
    await page.route("**/api/hanzihome/practice/attempts**", async (route) => {
     if (route.request().method() === "GET") {
      await initialHistory;
      return historyFails
       ? route.fulfill({ status: 500, json: { error: "History unavailable" } })
       : route.fulfill({ json: { attempts: history } });
     }
     const body = route.request().postData();
     if (body === null) throw new Error("Missing recording submission");
     recordings.push(body);
     if (writesFail) return route.fulfill({ status: 500, json: { error: "Attempt rejected" } });
     return route.fulfill({
      json: {
       attempt: {
        id: "00000000-0000-4000-8000-000000000003",
        user_id: "00000000-0000-4000-8000-000000000001",
        surface: "translation",
        content_id: "paragraph-1",
        direction: "zh-vi",
        answer: { kind: "interpreting-recording" },
        score: null,
        response_ms: 2000,
        created_at: "2026-10-08T00:00:00Z",
       },
      },
     });
    });
    await page.goto(url + "translation-audit");
    await browserExpect(page.getByRole("status")).toHaveText("Đang tải lịch sử đoạn này…");
    releaseHistory();
    await page.clock.runFor(0);
    await browserExpect(page.getByText("Chuẩn bị 3s", { exact: true })).toBeVisible();
    await page.clock.runFor(1000);
    await browserExpect(page.getByText("Chuẩn bị 2s", { exact: true })).toBeVisible();
    await page.evaluate(() => window.translationHarness.refresh());
    await browserExpect(page.locator("[data-render]")).toHaveAttribute("data-render", "1");
    await browserExpect(page.getByText("Chuẩn bị 2s", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đoạn sau", exact: true }).click();
    await browserExpect(page.getByText("Chuẩn bị 3s", { exact: true })).toBeVisible();
    await page.clock.runFor(1000);
    await browserExpect(page.getByText("Chuẩn bị 2s", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tiếng Việt → 中文", exact: true }).click();
    await browserExpect(page.getByText("Chuẩn bị 2s", { exact: true })).toHaveCount(0);
    await page.clock.runFor(1000);
    await page.getByRole("button", { name: "中文 → Tiếng Việt", exact: true }).click();
    await browserExpect(page.getByText("Chuẩn bị 2s", { exact: true })).toBeVisible();
    await page.clock.runFor(1000);
    await browserExpect(page.getByText("Chuẩn bị 1s", { exact: true })).toBeVisible();
    await page.clock.runFor(1000);
    await browserExpect(page.getByText("Sẵn sàng", { exact: true })).toBeVisible();
    await page.clock.runFor(1000);
    await browserExpect(page.getByText("Sẵn sàng", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đoạn trước", exact: true }).click();
    await browserExpect(page.getByText("Chuẩn bị 3s", { exact: true })).toBeVisible();
    await page.evaluate(() => window.translationHarness.unmount());
    await page.clock.runFor(5000);
    await browserExpect(page.locator("main")).toBeEmpty();
    await page.reload();
    await browserExpect(page.getByText("Chuẩn bị 3s", { exact: true })).toBeVisible();
    await page
     .getByRole("textbox", { name: "Ghi chú interpreting", exact: true })
     .fill("Ghi ý chính");
    await page
     .getByRole("textbox", { name: "Transcript interpreting", exact: true })
     .fill("Lời phiên dịch");
    await page.getByRole("button", { name: "Bắt đầu ghi", exact: true }).click();
    await browserExpect(
     page.getByRole("button", { name: "Dừng ghi (0s)", exact: true }),
    ).toBeVisible();
    await page.clock.runFor(2000);
    await page.getByRole("button", { name: "Đoạn sau", exact: true }).click();
    await page.getByRole("button", { name: "Dừng ghi (2s)", exact: true }).click();
    await browserExpect(page.locator("audio")).toBeVisible();
    await browserExpect.poll(() => recordings.length).toBe(1);
    const firstRecording: PracticeAttemptPayload = {
     surface: "translation",
     contentId: "paragraph-1",
     direction: "zh-vi",
     answer: {
      kind: "interpreting-recording",
      transcript: "Lời phiên dịch",
      notes: "Ghi ý chính",
      unitMarks: {},
      durationSeconds: 2,
     },
     scorePercent: null,
     responseMs: 2000,
    };
    expect(recordings[0]).toBe(JSON.stringify(firstRecording));
    await page
     .getByRole("textbox", { name: "Transcript interpreting", exact: true })
     .fill("Lần thứ hai");
    await page.getByRole("button", { name: "Bắt đầu ghi", exact: true }).click();
    await browserExpect(
     page.getByRole("button", { name: "Dừng ghi (0s)", exact: true }),
    ).toBeVisible();
    await page.clock.runFor(1000);
    await page.getByRole("button", { name: "Dừng ghi (1s)", exact: true }).click();
    await browserExpect.poll(() => recordings.length).toBe(2);
    expect(recordings[1]).toBe(
     JSON.stringify({
      ...firstRecording,
      contentId: "paragraph-2",
      answer: { ...firstRecording.answer, transcript: "Lần thứ hai", durationSeconds: 1 },
      responseMs: 1000,
     }),
    );
    await page.evaluate(() => window.translationHarness.refresh());
    await browserExpect(page.locator("[data-render]")).toHaveAttribute("data-render", "1");
    expect(recordings).toHaveLength(2);
    await page.clock.resume();
    await page.getByRole("button", { name: "Đủ", exact: true }).click();
    await browserExpect.poll(() => recordings.length).toBe(3);
    const selfMark: PracticeAttemptPayload = {
     surface: "translation",
     contentId: "paragraph-2",
     direction: "zh-vi",
     answer: { kind: "interpreting-self-mark", unitMarks: { greeting: "kept" } },
     scorePercent: null,
     responseMs: null,
    };
    expect(recordings[2]).toBe(JSON.stringify(selfMark));
    const answer = page.getByRole("textbox", { name: "Câu trả lời Humanities", exact: true });
    await answer.fill("Xin chào");
    await page.getByRole("button", { name: "Lưu lần sửa", exact: true }).click();
    await browserExpect.poll(() => recordings.length).toBe(4);
    const revision: PracticeAttemptPayload = {
     surface: "translation",
     contentId: "paragraph-2",
     direction: "zh-vi",
     answer: { answer: "Xin chào", reference: null, missingUnitIds: [] },
     scorePercent: null,
     responseMs: null,
    };
    expect(recordings[3]).toBe(JSON.stringify(revision));
    await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await browserExpect(page.getByText("Điểm: 100/100", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đoạn trước", exact: true }).click();
    await answer.fill("Không có ý bắt buộc");
    await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await browserExpect(page.getByText("Điểm: 0/100", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đoạn sau", exact: true }).click();
    await browserExpect(answer).toHaveValue("Xin chào");
    await browserExpect(page.getByText("Điểm: 100/100", { exact: true })).toBeVisible();
    await browserExpect(
     page.getByText("✓ Đã nhận diện ý: Xin chào.", { exact: true }),
    ).toBeVisible();
    history.push({
     id: "00000000-0000-4000-8000-000000000004",
     user_id: "00000000-0000-4000-8000-000000000001",
     surface: "translation",
     content_id: "paragraph-2",
     direction: "zh-vi",
     answer: { answer: "Xin chào" },
     score: 1,
     response_ms: 1000,
     created_at: "2026-10-08T00:00:00Z",
    });
    await page.evaluate(() => window.translationHarness.refetchHistory());
    await browserExpect(page.getByText("Lịch sử đoạn này: 1 lần", { exact: true })).toBeVisible();
    historyFails = true;
    await page.evaluate(() => window.translationHarness.refetchHistory());
    await browserExpect(page.getByRole("alert")).toContainText("Không tải được lịch sử đoạn này");
    await browserExpect(page.getByText("Lịch sử đoạn này: 1 lần", { exact: true })).toBeVisible();
    await browserExpect(answer).toHaveValue("Xin chào");
    historyFails = false;
    await page.getByRole("button", { name: "Thử tải lại", exact: true }).click();
    await browserExpect(page.getByRole("alert")).toHaveCount(0);
    writesFail = true;
    await page.getByRole("button", { name: "Lưu lần sửa", exact: true }).click();
    await browserExpect(page.getByText("Attempt rejected", { exact: true })).toBeVisible();
    await browserExpect(answer).toHaveValue("Xin chào");
    await browserExpect(page.getByText("Lịch sử đoạn này: 1 lần", { exact: true })).toBeVisible();
    const localizedMessages = {
     vi: vietnameseMessages,
     en: englishMessages,
     "zh-CN": chineseMessages,
    };
    for (const locale of appLocales) {
     historyFails = true;
     const strings = localizedMessages[locale];
     await page.goto(`${url}translation-audit?locale=${locale}`);
     await browserExpect(page.getByRole("alert")).toContainText(strings.detail.historyError);
     const retry = page.getByRole("button", { name: strings.detail.historyRetry, exact: true });
     await retry.focus();
     historyFails = false;
     await retry.press("Enter");
     await browserExpect(page.getByRole("alert")).toHaveCount(0);
     await browserExpect(
      page.getByRole("textbox", { name: strings.answer.translationAria, exact: true }),
     ).toBeVisible();
    }
    writesFail = false;
    const timerSamples: {
     length: number;
     repetition: number;
     workspace: number;
     source: number;
    }[] = [];
    for (const length of [1000, 10000, 50000]) {
     for (let repetition = 0; repetition < 5; repetition++) {
      await page.clock.pauseAt(
       new Date(`2026-10-08T01:${String(timerSamples.length).padStart(2, "0")}:00Z`),
      );
      await page.goto(`${url}translation-audit?measure=1`);
      await page.evaluate((size) => window.translationHarness.setSourceLength(size), length);
      await browserExpect(page.locator("[data-source-length]")).toHaveAttribute(
       "data-source-length",
       String(length),
      );
      await page.clock.runFor(0);
      await page.evaluate(() => window.translationHarness.clearMeasurements());
      for (let tick = 1; tick <= 30; tick++) {
       await page.clock.runFor(1000);
       await browserExpect(
        page.getByText(tick === 30 ? "Sẵn sàng" : `Chuẩn bị ${30 - tick}s`, { exact: true }),
       ).toBeVisible();
      }
      const measured = await page.evaluate(() => window.translationHarness.measurements());
      expect(measured.workspace).toBeGreaterThanOrEqual(30);
      expect(measured.source).toBe(0);
      timerSamples.push({ length, repetition, ...measured });
     }
    }
    writeFileSync(
     "/tmp/chines-app-non-pdf-translation-timer-samples-20261008.json",
     JSON.stringify(timerSamples),
    );
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
