import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { it } from "vitest";
import type {} from "./TtsAudioPreview.browser.fixture";

it.runIf(process.env.TTS_BROWSER_TEST === "1")(
 "isolates Reader speech, fences Studio playback and releases preview resources on unmount",
 async () => {
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/tts-browser",
   optimizeDeps: { entries: ["src/features/hanzihome/tts/TtsAudioPreview.browser.fixture.tsx"] },
   resolve: { alias: { "@": fileURLToPath(new URL("../../../", import.meta.url)) } },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "tts-preview-test-page",
     configureServer(instance) {
      instance.middlewares.use("/tts-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/tts-audit",
         '<!doctype html><html><body><script type="module" src="/src/features/hanzihome/tts/TtsAudioPreview.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Missing TTS preview fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    await page.goto(url + "tts-audit");
    await page.getByRole("button", { name: "Set fixture rate 1.25", exact: true }).click();
    await page.evaluate(
     () =>
      new Promise<void>((resolve) =>
       requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    await page.getByRole("button", { name: "Reset context commits", exact: true }).click();
    await page.getByRole("button", { name: "Set fixture rate 1.5", exact: true }).click();
    await page.getByRole("button", { name: "Set fixture rate 1.25", exact: true }).click();
    await browserExpect(page.locator("#tts-context-evidence")).toHaveText(
     '{"full":2,"reader":0,"button":2}',
    );
    const playback = page.getByRole("region", { name: "Playback lifecycle probe" });
    const playbackProof = page.locator("#tts-playback-evidence");
    await playback.getByRole("button", { name: "Enable advance", exact: true }).click();
    await playback.getByRole("button", { name: "Play first segment", exact: true }).click();
    await playback.getByRole("button", { name: "Complete playback", exact: true }).click();
    await browserExpect(playback.getByText("Active segment: 1", { exact: true })).toBeVisible();
    await browserExpect(playbackProof).toContainText('"spoken":[["你好。"],["谢谢！"]]');
    await playback.getByRole("button", { name: "Complete playback", exact: true }).click();
    await playback.getByRole("button", { name: "Enable loop", exact: true }).click();
    await playback.getByRole("button", { name: "Play passage", exact: true }).click();
    await playback.getByRole("button", { name: "Stop playback", exact: true }).click();
    const stopped = await playbackProof.textContent();
    await playback.getByRole("button", { name: "Complete playback", exact: true }).click();
    await browserExpect(playbackProof).toHaveText(stopped ?? "");
    await playback.getByRole("button", { name: "Play first segment", exact: true }).click();
    await playback.getByRole("button", { name: "Complete playback", exact: true }).click();
    await browserExpect(playbackProof).toContainText('["你好。","谢谢！"],["你好。"],["你好。"]');
    await playback.getByRole("textbox", { name: "Playback source" }).fill("再见。");
    await browserExpect(playbackProof).toContainText('"stops":3');
    const replaced = await playbackProof.textContent();
    await playback.getByRole("button", { name: "Complete playback", exact: true }).click();
    await browserExpect(playbackProof).toHaveText(replaced ?? "");
    const source = playback.getByRole("textbox", { name: "Playback source" });
    await source.press("Control+Enter");
    await browserExpect(playbackProof).toContainText('["再见。"]');
    await source.press("Escape");
    await browserExpect(playbackProof).toContainText('"stops":4');
    const escaped = await playbackProof.textContent();
    await playback.getByRole("button", { name: "Complete playback", exact: true }).click();
    await browserExpect(playbackProof).toHaveText(escaped ?? "");
    const dictation = page.getByRole("region", { name: "Dictation lifecycle probe" });
    const dictationProof = page.locator("#dictation-playback-evidence");
    await dictation.getByRole("button", { name: "Dictation loop", exact: true }).click();
    await dictation.getByRole("button", { name: "Dictation play", exact: true }).click();
    await dictation.getByRole("button", { name: "Dictation complete", exact: true }).click();
    await browserExpect(dictationProof).toHaveText('[["你好。"],["你好。"]]');
    await dictation.getByRole("button", { name: "Dictation reset", exact: true }).click();
    await dictation.getByRole("button", { name: "Dictation complete", exact: true }).click();
    await browserExpect(dictationProof).toHaveText('[["你好。"],["你好。"]]');
    await browserExpect(
     dictation.getByText("Dictation active: first", { exact: true }),
    ).toBeVisible();
    await dictation.getByRole("button", { name: "Dictation advance", exact: true }).click();
    await browserExpect(
     dictation.getByText("Dictation loop: false, advance: true", { exact: true }),
    ).toBeVisible();
    await dictation.getByRole("button", { name: "Dictation play", exact: true }).click();
    await dictation.getByRole("button", { name: "Dictation complete", exact: true }).click();
    await browserExpect(
     dictation.getByText("Dictation active: second", { exact: true }),
    ).toBeVisible();
    await browserExpect(dictationProof).toHaveText('[["你好。"],["你好。"],["你好。"],["谢谢！"]]');
    await page.keyboard.press("1");
    await browserExpect(
     dictation.getByText("Dictation active: first", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("4");
    await browserExpect(
     dictation.getByText("Dictation active: second", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Generate preview", exact: true }).click();
    await page.getByRole("button", { name: "Complete generation", exact: true }).click();
    await browserExpect(page.getByText("Preview available", { exact: true })).toBeVisible();
    await browserExpect(page.locator("#audio-evidence")).toHaveText(
     '{"created":1,"revoked":0,"pending":0}',
    );
    await page.getByRole("button", { name: "Generate preview", exact: true }).click();
    await page.getByRole("button", { name: "Unmount preview", exact: true }).click();
    await page.getByRole("button", { name: "Complete generation", exact: true }).click();
    await browserExpect(page.locator("#audio-evidence")).toHaveText(
     '{"created":1,"revoked":1,"pending":0}',
    );
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 30_000,
);
