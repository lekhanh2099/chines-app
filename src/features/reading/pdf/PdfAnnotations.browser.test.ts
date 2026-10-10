import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it, vi } from "vitest";
import { annotationPayloadSchema } from "./pdf-annotation-api";
import type { PdfAnnotationRow } from "./pdf-annotations";
import type {} from "./PdfAnnotations.browser.fixture";

it.runIf(process.env.PDF_BROWSER_TEST === "1")(
 "recovers PDF edits after reload, reconciles lost acknowledgements and retains conflicts without overwriting other devices",
 async () => {
  const fixture = fileURLToPath(new URL("./PdfAnnotations.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/pdf-outbox-browser",
   optimizeDeps: { entries: [fixture] },
   esbuild: { jsx: "automatic" },
   resolve: {
    alias: [
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "pdf-outbox-test-page",
     configureServer(instance) {
      instance.middlewares.use("/pdf-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/pdf-audit",
         '<!doctype html><script type="module" src="/src/features/reading/pdf/PdfAnnotations.browser.fixture.tsx"></script>',
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
   if (!url) throw new Error("Missing PDF fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const owner = "22222222-2222-4222-8222-222222222222";
    const otherOwner = "33333333-3333-4333-8333-333333333333";
    const query = { assetId: "asset-1", pageNumber: 1 };
    const rows = new Map<string, PdfAnnotationRow>();
    let status = 200;
    let loseNextAck = false;
    let hold = false;
    let release = () => {};
    const writes: { owner: string; revision: number; absent: boolean }[] = [];
    await context.route("**/api/reading/pdf/annotations**", async (route) => {
     const request = route.request();
     const requestOwner = request.headers()["x-hanzihome-owner-id"] ?? "";
     if (status !== 200) {
      await route.fulfill({ status, json: { error: "fixture failure" } });
      return;
     }
     if (request.method() === "GET") {
      const asset = new URL(request.url()).searchParams.get("assetId");
      await route.fulfill({
       json: {
        annotation:
         rows.get(asset === "asset-1" ? requestOwner : `${requestOwner}:${asset}`) ?? null,
       },
      });
      return;
     }
     const input = annotationPayloadSchema.parse(request.postDataJSON());
     writes.push({
      owner: requestOwner,
      revision: input.expectedRevision,
      absent: input.expectedAbsent,
     });
     if (hold)
      await new Promise<void>((resolve) => {
       release = resolve;
      });
     const rowKey = input.assetId === "asset-1" ? requestOwner : `${requestOwner}:${input.assetId}`;
     const old = rows.get(rowKey);
     if (
      input.expectedAbsent
       ? old !== undefined
       : old === undefined || old.revision !== input.expectedRevision
     ) {
      await route.fulfill({ status: 409, json: { annotation: old ?? null } });
      return;
     }
     const annotation: PdfAnnotationRow = {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: requestOwner,
      asset_id: input.assetId,
      page_number: input.pageNumber,
      payload: input.payload,
      revision: old ? input.expectedRevision + 1 : 0,
      created_at: "2026-10-08T00:00:00Z",
      updated_at: "2026-10-08T00:00:00Z",
     };
     rows.set(rowKey, annotation);
     if (loseNextAck) {
      loseNextAck = false;
      await route.abort("failed");
     } else await route.fulfill({ json: { annotation } });
    });
    await page.goto(url + "pdf-audit");
    await browserExpect(page.getByRole("button", { name: "Add stroke" })).toBeEnabled();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Add stroke" }).click();
    await browserExpect(page.locator("#pdf-status")).toHaveText("queued");
    expect(
     await page.evaluate(({ query, owner }) => window.pdfOutboxHarness.pending(query, owner), {
      query,
      owner,
     }),
    ).toMatchObject({ input: { payload: { strokes: [{ tool: "pen" }] } } });
    await context.setOffline(false);
    status = 503;
    await page.reload();
    await browserExpect(page.locator("#pdf-strokes")).toContainText('"tool":"pen"');
    expect(writes).toHaveLength(0);
    status = 200;
    loseNextAck = true;
    await page.reload();
    await browserExpect(page.locator("#pdf-status")).toHaveText("failed");
    expect(rows.get(owner)?.revision).toBe(0);
    expect(writes).toHaveLength(1);
    await page.reload();
    await vi.waitFor(async () =>
     expect(
      await page.evaluate(({ query, owner }) => window.pdfOutboxHarness.pending(query, owner), {
       query,
       owner,
      }),
     ).toBeNull(),
    );
    expect(rows.get(owner)?.revision).toBe(0);
    expect(writes).toHaveLength(1);

    // Direct queue tests use an unmounted page so no hook drain competes with the controlled requests.
    await page.goto(url + "pdf-audit?unmounted=1");
    await page.waitForFunction(() => Boolean(window.pdfOutboxHarness));
    loseNextAck = true;
    await page.evaluate(
     async ({ query, owner }) => {
      await window.pdfOutboxHarness.enqueue(
       { ...query, payload: { strokes: [] }, expectedRevision: 0, expectedAbsent: false },
       owner,
      );
      await window.pdfOutboxHarness.flush(query, owner).catch(() => {});
     },
     { query, owner },
    );
    expect(rows.get(owner)?.revision).toBe(1);
    expect(
     await page.evaluate(({ query, owner }) => window.pdfOutboxHarness.pending(query, owner), {
      query,
      owner,
     }),
    ).toMatchObject({ submittedInput: { expectedRevision: 0 } });
    await page.evaluate(
     ({ query, owner }) =>
      window.pdfOutboxHarness.enqueue(
       {
        ...query,
        payload: {
         strokes: [
          { id: "latest", tool: "pen", color: "#ff0000", width: 4, points: [{ x: 0.4, y: 0.5 }] },
         ],
        },
        expectedRevision: 0,
        expectedAbsent: false,
       },
       owner,
      ),
     { query, owner },
    );
    await page.reload();
    await page.waitForFunction(() => Boolean(window.pdfOutboxHarness));
    await page.evaluate(({ query, owner }) => window.pdfOutboxHarness.flush(query, owner), {
     query,
     owner,
    });
    expect(rows.get(owner)?.revision).toBe(2);
    expect(rows.get(owner)?.payload.strokes[0]?.id).toBe("latest");
    expect(writes.at(-1)?.revision).toBe(1);

    const remote = rows.get(owner);
    if (!remote) throw new Error("Missing server annotation");
    rows.set(owner, { ...remote, revision: 4, payload: { strokes: [] } });
    await page.evaluate(
     ({ query, owner }) =>
      window.pdfOutboxHarness.enqueue(
       {
        ...query,
        payload: {
         strokes: [
          {
           id: "local-conflict",
           tool: "pen",
           color: "#ff0000",
           width: 4,
           points: [{ x: 0.7, y: 0.8 }],
          },
         ],
        },
        expectedRevision: 3,
        expectedAbsent: false,
       },
       owner,
      ),
     { query, owner },
    );
    await page.evaluate(
     ({ query, owner }) => window.pdfOutboxHarness.flush(query, owner).catch(() => {}),
     { query, owner },
    );
    const afterConflict = writes.length;
    await page.evaluate(
     ({ query, owner }) => window.pdfOutboxHarness.flush(query, owner).catch(() => {}),
     { query, owner },
    );
    expect(writes).toHaveLength(afterConflict);
    expect(rows.get(owner)?.payload.strokes).toEqual([]);
    expect(
     await page.evaluate(({ query, owner }) => window.pdfOutboxHarness.pending(query, owner), {
      query,
      owner,
     }),
    ).toMatchObject({ input: { payload: { strokes: [{ id: "local-conflict" }] } } });
    status = 412;
    expect(await page.evaluate((owner) => window.pdfOutboxHarness.sync(owner), owner)).toBe(0);
    expect(
     await page.evaluate(
      ({ query, otherOwner }) => window.pdfOutboxHarness.pending(query, otherOwner),
      { query, otherOwner },
     ),
    ).toBeNull();
    status = 200;
    // An old acknowledgement advances the base of a newer generation rather than deleting it.
    hold = true;
    await page.evaluate(
     ({ query, otherOwner }) =>
      window.pdfOutboxHarness.enqueue(
       { ...query, payload: { strokes: [] }, expectedRevision: 0, expectedAbsent: true },
       otherOwner,
      ),
     { query, otherOwner },
    );
    const beforeHeld = writes.length;
    await page.evaluate(
     ({ query, otherOwner }) => {
      void window.pdfOutboxHarness.flush(query, otherOwner);
     },
     { query, otherOwner },
    );
    await vi.waitFor(() => expect(writes).toHaveLength(beforeHeld + 1));
    await page.evaluate(
     ({ query, otherOwner }) =>
      window.pdfOutboxHarness.enqueue(
       {
        ...query,
        payload: {
         strokes: [
          {
           id: "new-generation",
           tool: "pen",
           color: "#ff0000",
           width: 4,
           points: [{ x: 0.1, y: 0.1 }],
          },
         ],
        },
        expectedRevision: 0,
        expectedAbsent: false,
       },
       otherOwner,
      ),
     { query, otherOwner },
    );
    hold = false;
    release();
    await vi.waitFor(async () =>
     expect(
      await page.evaluate(
       ({ query, otherOwner }) => window.pdfOutboxHarness.pending(query, otherOwner),
       { query, otherOwner },
      ),
     ).toBeNull(),
    );
    expect(rows.get(otherOwner)?.revision).toBe(1);
    expect(rows.get(otherOwner)?.payload.strokes[0]?.id).toBe("new-generation");
    // Undo/redo can replace the operation while restoring the submitted snapshot.
    hold = true;
    await page.evaluate(
     ({ query, otherOwner }) =>
      window.pdfOutboxHarness.enqueue(
       { ...query, payload: { strokes: [] }, expectedRevision: 1, expectedAbsent: false },
       otherOwner,
      ),
     { query, otherOwner },
    );
    const beforeSameSnapshot = writes.length;
    await page.evaluate(
     ({ query, otherOwner }) => {
      void window.pdfOutboxHarness.flush(query, otherOwner);
     },
     { query, otherOwner },
    );
    await vi.waitFor(() => expect(writes).toHaveLength(beforeSameSnapshot + 1));
    await page.evaluate(
     async ({ query, otherOwner }) => {
      const row = await window.pdfOutboxHarness.pending(query, otherOwner);
      if (!row || row.input.expectedAbsent === undefined)
       throw new Error("Missing held snapshot base");
      await window.pdfOutboxHarness.enqueue(
       { ...row.input, expectedAbsent: row.input.expectedAbsent, payload: { strokes: [] } },
       otherOwner,
      );
     },
     { query, otherOwner },
    );
    hold = false;
    release();
    await vi.waitFor(async () =>
     expect(
      await page.evaluate(
       ({ query, otherOwner }) => window.pdfOutboxHarness.pending(query, otherOwner),
       { query, otherOwner },
      ),
     ).toBeNull(),
    );
    expect(writes).toHaveLength(beforeSameSnapshot + 1);
    expect(rows.get(otherOwner)?.revision).toBe(2);

    // A persisted pre-absence-flag draft must not guess that revision zero means
    // no row. Render the actual PDF workspace and require an explicit choice.
    const viewerQuery = {
     assetId: "hanzihome-studio-asset:public/resources/fixture.pdf",
     pageNumber: 1,
    };
    const serverStroke: PdfAnnotationRow["payload"]["strokes"][number] = {
     id: "remote-create",
     tool: "pen",
     color: "#2563eb",
     width: 4,
     points: [
      { x: 0.2, y: 0.25 },
      { x: 0.7, y: 0.25 },
     ],
    };
    const localPayload: PdfAnnotationRow["payload"] = {
     strokes: [
      {
       ...serverStroke,
       id: "legacy-local-1",
       color: "#ff0000",
       points: [
        { x: 0.2, y: 0.5 },
        { x: 0.7, y: 0.5 },
       ],
      },
      {
       ...serverStroke,
       id: "legacy-local-2",
       color: "#ff0000",
       points: [
        { x: 0.2, y: 0.75 },
        { x: 0.7, y: 0.75 },
       ],
      },
     ],
    };
    const serverRow: PdfAnnotationRow = {
     ...remote,
     asset_id: viewerQuery.assetId,
     page_number: 1,
     revision: 0,
     payload: { strokes: [serverStroke] },
    };
    rows.set(`${owner}:${viewerQuery.assetId}`, serverRow);
    await page.evaluate(
     ({ viewerQuery, owner, localPayload }) =>
      window.pdfOutboxHarness.seedLegacy(
       { ...viewerQuery, payload: localPayload, expectedRevision: 0 },
       owner,
       false,
      ),
     { viewerQuery, owner, localPayload },
    );
    const beforeLegacy = writes.length;
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(url + "pdf-audit?viewer=1");
    const dialog = page.getByRole("dialog", { name: "Ghi chú PDF đã thay đổi" });
    await browserExpect(dialog).toBeVisible();
    await browserExpect(dialog).toHaveCSS("opacity", "1");
    await browserExpect(
     dialog.getByRole("img", { name: "Bản trên thiết bị này", exact: true }).locator("path"),
    ).toHaveCount(2);
    await browserExpect(
     dialog.getByRole("img", { name: "Bản đã lưu trên server", exact: true }).locator("path"),
    ).toHaveCount(1);
    expect(writes).toHaveLength(beforeLegacy);
    await page.screenshot({ path: "/tmp/chines-app-pdf-cas-legacy-conflict-desktop-20261008.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await browserExpect(
     dialog.getByRole("button", { name: "Dùng bản server", exact: true }),
    ).toBeVisible();
    await browserExpect(
     dialog.getByRole("button", { name: "Giữ nét của tôi và lưu tiếp", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: "/tmp/chines-app-pdf-cas-legacy-conflict-mobile-20261008.png" });
    await page.keyboard.press("Escape");
    await browserExpect(dialog).toHaveCount(0);
    await browserExpect(page.getByRole("button", { name: "Bút vẽ", exact: true })).toBeDisabled();
    await page.reload();
    await browserExpect(dialog).toBeVisible();
    expect(writes).toHaveLength(beforeLegacy);
    await dialog.getByRole("button", { name: "Dùng bản server", exact: true }).click();
    await browserExpect(dialog).toHaveCount(0);
    await browserExpect(
     page.getByRole("img", { name: "Lớp ghi chú PDF", exact: true }).locator("path"),
    ).toHaveCount(1);
    expect(writes).toHaveLength(beforeLegacy);
    expect(
     await page.evaluate(
      ({ viewerQuery, owner }) => window.pdfOutboxHarness.pending(viewerQuery, owner),
      { viewerQuery, owner },
     ),
    ).toBeNull();

    await page.goto(url + "pdf-audit?unmounted=1");
    await page.waitForFunction(() => Boolean(window.pdfOutboxHarness));
    await page.evaluate(
     ({ viewerQuery, owner, localPayload }) =>
      window.pdfOutboxHarness.enqueue(
       { ...viewerQuery, payload: localPayload, expectedRevision: 0, expectedAbsent: true },
       owner,
      ),
     { viewerQuery, owner, localPayload },
    );
    await page.goto(url + "pdf-audit?viewer=1");
    await browserExpect(dialog).toBeVisible();
    expect(writes.at(-1)).toEqual({ owner, revision: 0, absent: true });
    await dialog.getByRole("button", { name: "Giữ nét của tôi và lưu tiếp", exact: true }).click();
    await browserExpect(dialog).toHaveCount(0);
    await vi.waitFor(() => expect(rows.get(`${owner}:${viewerQuery.assetId}`)?.revision).toBe(1));
    expect(rows.get(`${owner}:${viewerQuery.assetId}`)?.payload).toEqual(localPayload);
    expect(writes.at(-1)).toEqual({ owner, revision: 0, absent: false });
    await page.reload();
    await browserExpect(
     page.getByRole("img", { name: "Lớp ghi chú PDF", exact: true }).locator("path"),
    ).toHaveCount(2);

    await page.goto(url + "pdf-audit?unmounted=1");
    await page.waitForFunction(() => Boolean(window.pdfOutboxHarness));
    // Previously submitted legacy base zero can reconcile an exact lost ack,
    // but no unmatched legacy revision-zero draft is automatically rebased.
    rows.set(`${owner}:${viewerQuery.assetId}`, { ...serverRow, payload: localPayload });
    await page.evaluate(
     ({ viewerQuery, owner, localPayload }) =>
      window.pdfOutboxHarness.seedLegacy(
       { ...viewerQuery, payload: localPayload, expectedRevision: 0 },
       owner,
       true,
      ),
     { viewerQuery, owner, localPayload },
    );
    const beforeLegacyAck = writes.length;
    await page.evaluate(
     ({ viewerQuery, owner }) => window.pdfOutboxHarness.flush(viewerQuery, owner),
     { viewerQuery, owner },
    );
    expect(writes).toHaveLength(beforeLegacyAck);
    expect(
     await page.evaluate(
      ({ viewerQuery, owner }) => window.pdfOutboxHarness.pending(viewerQuery, owner),
      { viewerQuery, owner },
     ),
    ).toBeNull();
    await page.evaluate(
     ({ viewerQuery, otherOwner, localPayload }) =>
      window.pdfOutboxHarness.seedLegacy(
       { ...viewerQuery, payload: localPayload, expectedRevision: 0 },
       otherOwner,
       false,
      ),
     { viewerQuery, otherOwner, localPayload },
    );
    await page.evaluate(
     ({ viewerQuery, otherOwner }) => window.pdfOutboxHarness.flush(viewerQuery, otherOwner),
     { viewerQuery, otherOwner },
    );
    expect(rows.get(`${otherOwner}:${viewerQuery.assetId}`)?.revision).toBe(0);
    expect(writes.at(-1)).toEqual({ owner: otherOwner, revision: 0, absent: true });
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
