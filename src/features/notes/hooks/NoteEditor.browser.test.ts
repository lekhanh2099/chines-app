import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";
import type {} from "./NoteEditor.browser.fixture";

// Same opt-in browser tier as Reader/Reading. Default Node gate does not launch a browser.
it.runIf(process.env.NOTES_BROWSER_TEST === "1")(
 "preserves latest Notes intent, retries a failed pane and recovers an IndexedDB draft",
 async () => {
  const fixture = fileURLToPath(new URL("./NoteEditor.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/notes-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/services/notes/notes.service", replacement: fixture },
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "notes-editor-test-page",
     configureServer(instance) {
      instance.middlewares.use("/notes-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/notes-audit",
         '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script type="module" src="/src/features/notes/hooks/NoteEditor.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Missing Notes fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url + "notes-audit");
    const content = page.getByRole("textbox", { name: "Content", exact: true });
    const reading = page.getByRole("textbox", { name: "Reading", exact: true });
    const status = page.getByRole("status");
    const evidence = page.locator("#fixture-evidence");
    const serverState = page.locator("#server-notes");
    await browserExpect(content).toHaveValue("server");
    await page.getByRole("button", { name: "Hold transport", exact: true }).click();
    await content.fill("A pending");
    await browserExpect(evidence).toContainText('"held": 1');
    await content.fill("B newest");
    await page.getByRole("button", { name: "Resume transport", exact: true }).click();
    await browserExpect(status).toHaveText("success");
    await browserExpect(content).toHaveValue("B newest");
    await browserExpect(serverState).toContainText('"text": "B newest"');
    await browserExpect(serverState).not.toContainText("A pending");
    await page.getByRole("button", { name: "Read local draft", exact: true }).click();
    await browserExpect(page.locator("#local-draft")).toHaveText("null");

    await page.getByRole("button", { name: "Fail next transport", exact: true }).click();
    await reading.fill("reading failed");
    await browserExpect(status).toHaveText("error");
    await page.getByRole("button", { name: "Read local draft", exact: true }).click();
    await browserExpect(page.locator("#local-draft")).toContainText("reading failed");
    await page.getByRole("button", { name: "Retry save", exact: true }).click();
    await browserExpect(status).toHaveText("success");
    await browserExpect(content).toHaveValue("B newest");
    await browserExpect(serverState).toContainText('"text": "reading failed"');

    await page.getByRole("button", { name: "Hold transport", exact: true }).click();
    await content.fill("recover after reload");
    await page.getByRole("button", { name: "Read local draft", exact: true }).click();
    await browserExpect(page.locator("#local-draft")).toContainText("recover after reload");
    await page.reload();
    await browserExpect(content).toHaveValue("recover after reload");
    await browserExpect(status).toHaveText("success");
    await page.getByRole("button", { name: "Read local draft", exact: true }).click();
    await browserExpect(page.locator("#local-draft")).toHaveText("null");

    await content.fill("flush before unmount");
    await page.getByRole("button", { name: "Unmount", exact: true }).click();
    await browserExpect(serverState).toContainText('"text": "flush before unmount"');
    await page.getByRole("button", { name: "Remount", exact: true }).click();
    await browserExpect(content).toHaveValue("flush before unmount");
    await page.getByRole("button", { name: "Mount Lexical split", exact: true }).click();
    const noteEditor = page.locator(".split-view-pane-right [contenteditable]");
    const readingEditor = page.locator(".split-view-pane-left [contenteditable]");
    await browserExpect(noteEditor).toHaveText("lexical server");
    await browserExpect(readingEditor).toHaveText("reading server");
    await noteEditor.fill("lexical latest before debounce");
    await page.getByRole("button", { name: "Export latest", exact: true }).click();
    await browserExpect(page.locator("#exported-note")).toContainText(
     "lexical latest before debounce",
    );
    await page.getByRole("button", { name: "Import A", exact: true }).click();
    await browserExpect(noteEditor).toHaveText("import A");
    await browserExpect(readingEditor).toHaveText("import reading");
    await browserExpect(status).toHaveText("success");
    await readingEditor.fill("reading latest after import");
    await browserExpect(status).toHaveText("success");
    await browserExpect(serverState).toContainText('"text": "reading latest after import"');
    await page.getByRole("button", { name: "Export latest", exact: true }).click();
    await browserExpect(page.locator("#exported-note")).toContainText(
     "reading latest after import",
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
