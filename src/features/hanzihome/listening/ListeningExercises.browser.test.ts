import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { it } from "vitest";
import type {} from "./ListeningExercises.browser.fixture";

it.runIf(process.env.LISTENING_BROWSER_TEST === "1")(
 "clears checked feedback when a learner edits an answer or resets matching",
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
     { find: "@/features/hanzihome/context/selectors", replacement: fixture },
     { find: "@/features/hanzihome/context/actions", replacement: fixture },
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
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 30_000,
);
