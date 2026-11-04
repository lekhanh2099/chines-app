import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";
import type {} from "./UnsavedDraftNavigationGuard.browser.fixture";

it.runIf(process.env.NAVIGATION_BROWSER_TEST === "1")(
 "restores Back while confirmation is open and removes guard entries after drafts become clean",
 async () => {
  const fixture = fileURLToPath(
   new URL("./UnsavedDraftNavigationGuard.browser.fixture.tsx", import.meta.url),
  );
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/navigation-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "next/navigation", replacement: fixture },
     { find: "@", replacement: root },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "navigation-guard-test-page",
     configureServer(instance) {
      instance.middlewares.use("/navigation-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/navigation-audit",
         '<!doctype html><script type="module" src="/src/components/layout/navigation/UnsavedDraftNavigationGuard.browser.fixture.tsx"></script>',
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
   if (!url) throw new Error("Missing navigation guard fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url + "navigation-audit");
    await browserExpect(page.getByTestId("draft-state")).toHaveText("dirty");

    await page.evaluate(() => window.history.back());
    await browserExpect(page.getByRole("dialog")).toBeVisible();
    await browserExpect
     .poll(() => page.evaluate(() => window.location.pathname))
     .toBe("/navigation-audit");
    await browserExpect(page.getByTestId("popstate-bubbles")).toHaveText("0");

    await page.evaluate(() => window.history.back());
    await browserExpect(page.getByRole("dialog")).toBeVisible();
    await browserExpect
     .poll(() => page.evaluate(() => window.location.pathname))
     .toBe("/navigation-audit");
    await browserExpect(page.getByTestId("popstate-bubbles")).toHaveText("0");
    await page.getByText("Ở lại", { exact: true }).click();
    await browserExpect(page.getByRole("dialog")).toHaveCount(0);

    await page.evaluate(() => window.history.back());
    await browserExpect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Rời đi", exact: true }).click();
    await browserExpect.poll(() => page.evaluate(() => window.location.pathname)).toBe("/previous");
    await browserExpect(page.getByTestId("popstate-bubbles")).toHaveText("1");

    await page.goto(url + "navigation-audit");
    await browserExpect(page.getByTestId("draft-state")).toHaveText("dirty");
    let popstateCount = Number(await page.getByTestId("popstate-events").textContent());
    await page.getByRole("button", { name: "Toggle draft", exact: true }).click();
    await browserExpect(page.getByTestId("draft-state")).toHaveText("clean");
    await browserExpect
     .poll(async () => Number(await page.getByTestId("popstate-events").textContent()))
     .toBe(popstateCount + 1);

    await page.getByRole("button", { name: "Toggle draft", exact: true }).click();
    await page.evaluate(() => window.history.back());
    await browserExpect(page.getByRole("dialog")).toBeVisible();
    await page.getByText("Ở lại", { exact: true }).click();
    popstateCount = Number(await page.getByTestId("popstate-events").textContent());
    await page.getByRole("button", { name: "Toggle draft", exact: true }).click();
    await browserExpect(page.getByTestId("draft-state")).toHaveText("clean");
    await browserExpect
     .poll(async () => Number(await page.getByTestId("popstate-events").textContent()))
     .toBe(popstateCount + 1);

    await page.evaluate(() => window.history.back());
    await browserExpect.poll(() => page.evaluate(() => window.location.pathname)).toBe("/previous");
    await browserExpect(page.getByTestId("popstate-bubbles")).toHaveText("1");
    expect(errors).toEqual([]);
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
);
