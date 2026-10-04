import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";
import type {} from "./ShadowingRecorder.browser.fixture";

it.runIf(process.env.RECORDER_BROWSER_TEST === "1")(
 "commits only changed displayed seconds and clears its timer on unmount",
 async () => {
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/recorder-browser",
   optimizeDeps: { entries: ["src/features/reading/hooks/ShadowingRecorder.browser.fixture.tsx"] },
   resolve: { alias: { "@": fileURLToPath(new URL("../../../", import.meta.url)) } },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "recorder-test-page",
     configureServer(instance) {
      instance.middlewares.use("/recorder-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/recorder-audit",
         '<!doctype html><html><body><script type="module" src="/src/features/reading/hooks/ShadowingRecorder.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Missing recorder fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    await page.goto(url + "recorder-audit");
    await page.getByRole("button", { name: "Start fixture recording", exact: true }).click();
    await browserExpect(page.locator('p[role="status"]')).toHaveText("recording");
    await page.getByRole("button", { name: "Tick 500", exact: true }).click();
    await browserExpect(page.getByText("Displayed seconds: 1", { exact: true })).toBeVisible();
    const first = await page.locator("#recorder-commits").textContent();
    expect(first).not.toBeNull();
    await page.getByRole("button", { name: "Tick 1000", exact: true }).click();
    await page.evaluate(
     () =>
      new Promise<void>((resolve) =>
       requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    expect(await page.locator("#recorder-commits").textContent()).toBe(first);
    await page.getByRole("button", { name: "Tick 1500", exact: true }).click();
    await browserExpect(page.getByText("Displayed seconds: 2", { exact: true })).toBeVisible();
    const second = await page.locator("#recorder-commits").textContent();
    expect(second).not.toBe(first);
    await page.getByRole("button", { name: "Tick 2000", exact: true }).click();
    await page.evaluate(
     () =>
      new Promise<void>((resolve) =>
       requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    expect(await page.locator("#recorder-commits").textContent()).toBe(second);
    await page.getByRole("button", { name: "Unmount recorder", exact: true }).click();
    await browserExpect(page.locator("#recorder-evidence")).toContainText('"activeTimer":false');
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 30_000,
);
