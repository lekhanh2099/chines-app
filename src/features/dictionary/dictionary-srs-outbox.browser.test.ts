import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import { createServer } from "vite";
import { expect, it, vi } from "vitest";
import type {} from "./dictionary-srs-outbox.browser.fixture";
import type { SmartSelectionResult } from "@/types/database";

it.runIf(process.env.SRS_BROWSER_TEST === "1")(
 "retains committed SRS intent across reload, fences owners and protects newer edits from old acknowledgements",
 async () => {
  const fixture = fileURLToPath(
   new URL("./dictionary-srs-outbox.browser.fixture.tsx", import.meta.url),
  );
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/srs-outbox-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../", import.meta.url)) },
    ],
   },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "srs-outbox-test-page",
     configureServer(instance) {
      instance.middlewares.use("/srs-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/srs-audit",
         '<!doctype html><script type="module" src="/src/features/dictionary/dictionary-srs-outbox.browser.fixture.tsx"></script>',
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
   if (!url) throw new Error("Missing SRS fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let status = 200;
    let malformed = false;
    let hold = false;
    let release = () => {};
    const requests: { owner: string; body: string }[] = [];
    await context.route("**/api/dictionary/srs", async (route) => {
     requests.push({
      owner: route.request().headers()["x-hanzihome-owner-id"] ?? "",
      body: route.request().postData() ?? "",
     });
     if (hold)
      await new Promise<void>((resolve) => {
       release = resolve;
      });
     await route.fulfill({
      status,
      json: malformed
       ? { offlineQueued: true }
       : {
          vocabId: "vocab-1",
          dictionaryId: "dictionary-1",
          contextSchemaAvailable: true,
          noteSchemaAvailable: true,
         },
     });
    });
    await page.goto(url + "srs-audit");
    await page.waitForFunction(() => Boolean(window.srsOutboxHarness));
    await context.setOffline(true);
    expect(
     await page.evaluate(() =>
      window.srsOutboxHarness.save({ hanzi: "你好", personalNote: "keep note" }, "owner-a"),
     ),
    ).toBe("queued");
    expect(
     await page.evaluate(() => window.srsOutboxHarness.save({ hanzi: "你好" }, "owner-a")),
    ).toBe("queued");
    expect(
     await page.evaluate(() => window.srsOutboxHarness.save({ hanzi: "再见" }, "owner-b")),
    ).toBe("queued");
    expect(requests).toHaveLength(0);
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toMatchObject([
     { payload: { hanzi: "你好", personalNote: "keep note" } },
    ]);
    await context.setOffline(false);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.srsOutboxHarness));
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toHaveLength(1);
    status = 412;
    expect(await page.evaluate(() => window.srsOutboxHarness.sync("owner-a"))).toBe(0);
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toHaveLength(1);
    expect(requests[0]?.owner).toBe("owner-a");
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-b"))).toHaveLength(1);
    status = 200;
    malformed = true;
    expect(await page.evaluate(() => window.srsOutboxHarness.sync("owner-a"))).toBe(0);
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toHaveLength(1);
    malformed = false;
    hold = true;
    await page.evaluate(() => {
     void window.srsOutboxHarness.sync("owner-a");
    });
    await vi.waitFor(() => expect(requests).toHaveLength(3));
    await context.setOffline(true);
    expect(
     await page.evaluate(() =>
      window.srsOutboxHarness.save({ hanzi: "你好", personalNote: "newest note" }, "owner-a"),
     ),
    ).toBe("queued");
    hold = false;
    release();
    await context.setOffline(false);
    await vi.waitFor(async () =>
     expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toMatchObject([
      { payload: { personalNote: "newest note" } },
     ]),
    );
    expect(await page.evaluate(() => window.srsOutboxHarness.sync("owner-a"))).toBe(1);
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toEqual([]);
    expect(requests.at(-1)?.body).toContain('"personalNote":"newest note"');
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-b"))).toHaveLength(1);
    // Separate tabs use the same Web Lock, so only one drain can send this identity.
    const second = await context.newPage();
    await second.goto(url + "srs-audit");
    await second.waitForFunction(() => Boolean(window.srsOutboxHarness));
    const before = requests.length;
    const drains = await Promise.all([
     page.evaluate(() => window.srsOutboxHarness.sync("owner-b")),
     second.evaluate(() => window.srsOutboxHarness.sync("owner-b")),
    ]);
    expect(drains.reduce((sum, count) => sum + count, 0)).toBe(1);
    expect(requests).toHaveLength(before + 1);
    expect(requests.at(-1)?.owner).toBe("owner-b");
    await second.close();

    // The actual drawer must show a durable warning without marking the lookup
    // saved. Only a successful API acknowledgement may change its Query data.
    let lookupPayload: SmartSelectionResult = {
     mode: "sentence",
     selection: "你好。",
     context_sentence: "你好。",
     entry: { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "Xin chào" },
     radicals: [],
     components: [],
     definitions: [],
     meaning_summary: "Xin chào",
     etymology: "",
     mnemonic_story: "",
     translation: "Xin chào",
     grammar_points: [],
     isSaved: false,
     found: true,
     personal_note: "",
     personal_note_mode: "important",
    };
    let holdLookup = false;
    let releaseLookup = () => {};
    let lookupReads = 0;
    await context.route("**/api/editor/context", async (route) => {
     lookupReads += 1;
     if (holdLookup) {
      await new Promise<void>((resolve) => {
       releaseLookup = resolve;
      });
     }
     await route.fulfill({ json: lookupPayload });
    });
    await page.goto(url + "srs-audit?drawer");
    const drawer = page.getByRole("dialog");
    const saveNote = drawer.getByRole("button", { name: "Lưu note", exact: true });
    await browserExpect(saveNote).toBeEnabled();
    await drawer.getByRole("textbox").fill("Queued drawer note");
    await context.setOffline(true);
    const beforeDrawerSave = requests.length;
    await saveNote.click();
    await browserExpect(page.locator("[data-sonner-toast]")).toContainText("server chưa xác nhận");
    expect(requests).toHaveLength(beforeDrawerSave);
    expect(await page.evaluate(() => window.srsOutboxHarness.selection()?.isSaved)).toBe(false);
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toMatchObject([
     { payload: { hanzi: "你好", personalNote: "Queued drawer note" } },
    ]);
    await context.setOffline(false);
    await saveNote.click();
    await browserExpect(
     page.getByText("Đã lưu câu mẫu vào kho ôn tập", { exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.srsOutboxHarness.selection()?.isSaved)).toBe(true);
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toEqual([]);
    expect(requests).toHaveLength(beforeDrawerSave + 1);

    // Hold each background response so fetching and settled metadata commit
    // separately while the authoritative selection data stays identical.
    const acknowledgedSelection = await page.evaluate(() => window.srsOutboxHarness.selection());
    if (!acknowledgedSelection) throw new Error("Missing acknowledged selection");
    lookupPayload = acknowledgedSelection;
    const beforeMetadataWrites = requests.length;
    const beforeMetadataReads = lookupReads;
    const metadataSamples: number[][] = [];
    holdLookup = true;
    try {
     for (let repetition = 0; repetition < 5; repetition += 1) {
      await page.evaluate(() => window.srsOutboxHarness.resetDrawerMetrics());
      for (let refresh = 1; refresh <= 30; refresh += 1) {
       await page.evaluate(() => {
        void window.srsOutboxHarness.refetchSelection();
       });
       await browserExpect
        .poll(() => lookupReads, { intervals: [10, 25, 50] })
        .toBe(beforeMetadataReads + repetition * 30 + refresh);
       await browserExpect
        .poll(() => page.evaluate(() => window.srsOutboxHarness.drawerMetrics().length), {
         intervals: [10, 25, 50],
        })
        .toBe(refresh * 2 - 1);
       await browserExpect(saveNote).toBeEnabled();
       releaseLookup();
       await browserExpect
        .poll(() => page.evaluate(() => window.srsOutboxHarness.drawerMetrics().length), {
         intervals: [10, 25, 50],
        })
        .toBe(refresh * 2);
       expect(await page.evaluate(() => window.srsOutboxHarness.selection())).toEqual(
        acknowledgedSelection,
       );
      }
      metadataSamples.push(await page.evaluate(() => window.srsOutboxHarness.drawerMetrics()));
     }
    } finally {
     holdLookup = false;
     releaseLookup();
    }
    expect(lookupReads - beforeMetadataReads).toBe(150);
    expect(requests).toHaveLength(beforeMetadataWrites);
    await writeFile(
     "/tmp/chines-app-selection-query-metadata-20261008.json",
     JSON.stringify(
      {
       mode: "Vite development",
       browser: browser.version(),
       viewport: page.viewportSize(),
       samples: metadataSamples,
      },
      null,
      2,
     ),
    );

    // A fresh mounted bridge drains on online boot, without waiting for a new online event.
    await context.setOffline(true);
    await page.evaluate(() => window.srsOutboxHarness.save({ hanzi: "学习" }, "owner-a"));
    await page.evaluate(() => window.srsOutboxHarness.save({ hanzi: "中文" }, "owner-b"));
    await context.setOffline(false);
    await page.goto(url + "srs-audit?bridge=owner-a");
    await page.waitForFunction(() => Boolean(window.srsOutboxHarness));
    await vi.waitFor(
     async () =>
      expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toEqual([]),
     { timeout: 5000 },
    );
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-b"))).toHaveLength(1);
    expect(requests.at(-1)?.owner).toBe("owner-a");
    await page.evaluate(() => window.srsOutboxHarness.mountSyncBridge("owner-b"));
    await vi.waitFor(
     async () =>
      expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-b"))).toEqual([]),
     { timeout: 5000 },
    );
    expect(requests.at(-1)?.owner).toBe("owner-b");

    // Cleanup cancels an old owner's debounce before the replacement owner can drain.
    await context.setOffline(true);
    await page.evaluate(() => window.srsOutboxHarness.save({ hanzi: "保留" }, "owner-a"));
    await page.evaluate(() => window.srsOutboxHarness.save({ hanzi: "同步" }, "owner-b"));
    await context.setOffline(false);
    await page.goto(url + "srs-audit?bridge=owner-a");
    await page.waitForFunction(() => Boolean(window.srsOutboxHarness));
    const beforeOwnerSwitch = requests.length;
    await page.evaluate(() => window.srsOutboxHarness.mountSyncBridge("owner-b"));
    await vi.waitFor(
     async () =>
      expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-b"))).toEqual([]),
     { timeout: 5000 },
    );
    expect(requests.slice(beforeOwnerSwitch).map((request) => request.owner)).toEqual(["owner-b"]);
    expect(await page.evaluate(() => window.srsOutboxHarness.list("owner-a"))).toHaveLength(1);
    await page.evaluate(() => window.srsOutboxHarness.close());
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
