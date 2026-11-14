import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";
import { convertProseMirrorToLexical } from "@/lib/editor/editor-document";
import type { DbNote } from "@/types/database";
import { LessonAnnotationNoteUpdateSchema, type LessonTextAnnotation } from "./types";
import type {} from "./LessonAnnotations.browser.fixture";

it.runIf(process.env.LESSON_ANNOTATIONS_BROWSER_TEST === "1")(
 "preserves explicit Reader CAS choices and fences annotation work across account changes and unmount",
 async () => {
  const fixture = fileURLToPath(
   new URL("./LessonAnnotations.browser.fixture.tsx", import.meta.url),
  );
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/lesson-annotations-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "next/link", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "lesson-annotations-test-page",
     configureServer(instance) {
      instance.middlewares.use("/annotations-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/annotations-audit",
         '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script type="module" src="/src/features/hanzihome/annotations/LessonAnnotations.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Missing annotation fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const note: DbNote = {
     id: "00000000-0000-4000-8000-000000002011",
     user_id: "00000000-0000-4000-8000-000000002001",
     revision: 0,
     title: "Shared annotation note",
     content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Original note" }] }],
     },
     reading_content: null,
     split_view_enabled: false,
     tags: ["annotation"],
     linked_lesson_id: null,
     is_published: false,
     category: "general",
     status: "draft",
     short_id: null,
     created_at: "2026-10-08T00:00:00Z",
     updated_at: "2026-10-08T00:00:00Z",
     folder_id: null,
     reading_status: null,
     source_url: null,
     source_host: null,
     source_label: null,
     source_author: null,
     source_published_at: null,
     source_captured_at: null,
    };
    let annotation: LessonTextAnnotation = {
     id: "00000000-0000-4000-8000-000000002021",
     lessonId: "lesson-1",
     nodeType: "paragraph",
     nodeId: "paragraph-1",
     startOffset: 0,
     endOffset: 2,
     selectedText: "你好",
     prefixText: "",
     suffixText: "",
     tone: "focus",
     noteId: note.id,
     note,
     noteText: "Original note",
     createdAt: "2026-10-08T00:00:00Z",
     updatedAt: "2026-10-08T00:00:00Z",
    };
    const writes: ReturnType<typeof LessonAnnotationNoteUpdateSchema.parse>[] = [];
    let holdWrite = false;
    let releaseWrite = () => {};
    await page.route("**/api/hanzihome/lesson-annotations**", async (route) => {
     const request = route.request();
     expect(request.headers()["x-hanzihome-owner-id"]).toBe(note.user_id);
     if (request.method() === "GET") {
      await route.fulfill({ json: { annotations: [annotation] } });
      return;
     }
     const body = LessonAnnotationNoteUpdateSchema.omit({ annotationId: true }).parse(
      request.postDataJSON(),
     );
     writes.push({ annotationId: annotation.id, ...body });
     if (holdWrite)
      await new Promise<void>((resolve) => {
       releaseWrite = resolve;
      });
     if (body.expectedRevision !== annotation.note?.revision) {
      await route.fulfill({ status: 409, json: { saved: false, annotation } });
      return;
     }
     note.revision += 1;
     note.content = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: body.noteText }] }],
     };
     annotation = { ...annotation, note: { ...note }, noteText: body.noteText };
     await route.fulfill({ json: { saved: true, annotation } });
    });
    await page.goto(url + "annotations-audit");
    await page.getByRole("button", { name: "Open saved annotation", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Nội dung ghi chú", exact: true });
    await browserExpect(input).toHaveValue("Original note");
    await input.fill("My unsent local note");
    note.revision = 1;
    note.content = convertProseMirrorToLexical({
     type: "doc",
     content: [
      { type: "paragraph", content: [{ type: "text", text: "Server first paragraph" }] },
      { type: "paragraph", content: [{ type: "text", text: "Server full second paragraph" }] },
     ],
    });
    note.reading_content = convertProseMirrorToLexical({
     type: "doc",
     content: [{ type: "paragraph", content: [{ type: "text", text: "Server reading pane" }] }],
    });
    annotation = {
     ...annotation,
     note: { ...note },
     noteText: "Server first paragraph\nServer full second paragraph",
    };
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await browserExpect(page.getByRole("alert")).toBeVisible();
    await browserExpect(input).toHaveValue("My unsent local note");
    await browserExpect(
     page.getByText("Server full second paragraph", { exact: true }),
    ).toBeVisible();
    await browserExpect(page.getByText("Server reading pane", { exact: true })).toBeVisible();
    await page.screenshot({
     path: "/tmp/chines-app-reader-linked-cas-conflict-20261008.png",
     fullPage: true,
    });
    expect(writes).toHaveLength(1);
    expect(writes[0]?.expectedRevision).toBe(0);
    await page.getByRole("button", { name: "Giữ bản của tôi và lưu tiếp", exact: true }).click();
    await browserExpect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toHaveLength(2);
    expect(writes[1]).toEqual({
     annotationId: annotation.id,
     noteText: "My unsent local note",
     expectedRevision: 1,
    });
    expect(note.reading_content).toEqual(
     convertProseMirrorToLexical({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Server reading pane" }] }],
     }),
    );
    await page.getByRole("button", { name: "Open saved annotation", exact: true }).click();
    await input.fill("Draft I explicitly discard");
    note.revision = 3;
    note.content = convertProseMirrorToLexical({
     type: "doc",
     content: [{ type: "paragraph", content: [{ type: "text", text: "New server winner" }] }],
    });
    annotation = { ...annotation, note: { ...note }, noteText: "New server winner" };
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await browserExpect(page.getByText("New server winner", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Dùng bản server", exact: true }).click();
    await browserExpect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toHaveLength(3);
    await page.getByRole("button", { name: "Open saved annotation", exact: true }).click();
    await browserExpect(input).toHaveValue("New server winner");

    // A disposed UI continuation must not clear the new account's browser selection.
    await input.fill("Old account in-flight note");
    holdWrite = true;
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await browserExpect.poll(() => writes.length).toBe(4);
    await page.evaluate(() => window.lessonAnnotationsHarness.enterOwnerProbe());
    await browserExpect(page.locator("#owner-selection")).toBeVisible();
    await page.evaluate(() => {
     const node = document.querySelector("#owner-selection");
     if (!node) throw new Error("Missing selection probe");
     const range = document.createRange();
     range.selectNodeContents(node);
     window.getSelection()?.removeAllRanges();
     window.getSelection()?.addRange(range);
    });
    releaseWrite();
    await browserExpect
     .poll(() => page.evaluate(() => window.lessonAnnotationsHarness.retiredMutationStatuses()))
     .toEqual(["success"]);
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
     "New account selection",
    );

    await page.unroute("**/api/hanzihome/lesson-annotations**");
    const ownerA = note.user_id;
    const ownerB = "00000000-0000-4000-8000-000000002002";
    const accountB: LessonTextAnnotation = {
     ...annotation,
     id: "00000000-0000-4000-8000-000000002022",
     note: { ...note, user_id: ownerB },
     noteText: "Account B private note",
    };
    let pendingWrites = 0;
    const owners: string[] = [];
    await page.route("**/api/hanzihome/lesson-annotations**", async (route) => {
     const request = route.request();
     const owner = request.headers()["x-hanzihome-owner-id"];
     owners.push(owner);
     if (request.method() === "GET") {
      await route.fulfill({ json: { annotations: owner === ownerA ? [annotation] : [accountB] } });
      return;
     }
     expect(owner).toBe(ownerA);
     pendingWrites += 1;
     await new Promise<void>((resolve) => {
      releaseWrite = resolve;
     });
     if (request.method() === "POST") {
      await route.fulfill({ json: { annotation } });
     } else if (request.method() === "PATCH") {
      await route.fulfill({ status: 409, json: { saved: false, annotation } });
     } else {
      await route.fulfill({ status: 503, json: { error: "Unavailable" } });
     }
    });
    await page.evaluate((owner) => window.lessonAnnotationsHarness.switchOwner(owner), ownerB);
    await browserExpect(page.locator("#owner-annotations")).toContainText(accountB.noteText);
    for (const action of ["create", "update", "delete"]) {
     await page.evaluate((owner) => window.lessonAnnotationsHarness.switchOwner(owner), ownerA);
     await browserExpect(page.locator("#owner-annotations")).toContainText(annotation.noteText);
     const beforeWrites = pendingWrites;
     const mutation = page.evaluate(
      async ({ action, annotationId }) => {
       const harness = window.lessonAnnotationsHarness;
       try {
        if (action === "create") await harness.create();
        else if (action === "update")
         await harness.update({ annotationId, noteText: "Old draft", expectedRevision: 4 });
        else await harness.remove(annotationId);
        return "resolved";
       } catch {
        return "rejected";
       }
      },
      { action, annotationId: annotation.id },
     );
     await browserExpect.poll(() => pendingWrites).toBe(beforeWrites + 1);
     await page.evaluate((owner) => window.lessonAnnotationsHarness.switchOwner(owner), ownerB);
     await browserExpect(page.locator("#owner-annotations")).toContainText(accountB.noteText);
     releaseWrite();
     expect(await mutation).toBe(action === "create" ? "resolved" : "rejected");
     expect(await page.evaluate(() => window.lessonAnnotationsHarness.retiredQueryCount())).toBe(0);
     expect(await page.evaluate(() => window.lessonAnnotationsHarness.annotations())).toEqual([
      accountB,
     ]);
    }

    // Account rotation while onMutate is suspended must not dispatch an old creation intent.
    await page.evaluate((owner) => window.lessonAnnotationsHarness.switchOwner(owner), ownerA);
    await browserExpect(page.locator("#owner-annotations")).toContainText(annotation.noteText);
    await page.evaluate(() => window.lessonAnnotationsHarness.holdNextCancel());
    const beforeCancelWrite = pendingWrites;
    const cancelled = page.evaluate(async () => {
     try {
      await window.lessonAnnotationsHarness.create();
      return "resolved";
     } catch {
      return "rejected";
     }
    });
    await browserExpect
     .poll(() => page.evaluate(() => window.lessonAnnotationsHarness.cancelStarted()))
     .toBe(true);
    await page.evaluate((owner) => window.lessonAnnotationsHarness.switchOwner(owner), ownerB);
    await browserExpect(page.locator("#owner-annotations")).toContainText(accountB.noteText);
    await page.evaluate(() => window.lessonAnnotationsHarness.releaseCancel());
    expect(await cancelled).toBe("rejected");
    expect(pendingWrites).toBe(beforeCancelWrite);
    expect(await page.evaluate(() => window.lessonAnnotationsHarness.retiredQueryCount())).toBe(0);
    expect(await page.evaluate(() => window.lessonAnnotationsHarness.annotations())).toEqual([
     accountB,
    ]);
    expect(new Set(owners)).toEqual(new Set([ownerA, ownerB]));
    await page.evaluate(() => window.lessonAnnotationsHarness.switchOwner(null));
    await browserExpect(page.locator("#owner-annotations")).toHaveText("[]");
    await page.evaluate(() => window.lessonAnnotationsHarness.close());
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
