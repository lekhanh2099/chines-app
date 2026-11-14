import { chromium, expect as browserExpect, type Route } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, it } from "vitest";

import type { User } from "@supabase/supabase-js";
import type { NoteDetail } from "@/services/notes/notes.service";
import type {} from "./NoteOwner.browser.fixture";

it.runIf(process.env.NOTES_BROWSER_TEST === "1").each([true, false])(
 "isolates actual Notes provider/cache/drafts across logout and a late response (acknowledged=%s)",
 async (acknowledged) => {
  const fixture = fileURLToPath(new URL("./NoteOwner.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/notes-owner-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/lib/supabase/client", replacement: fixture },
     { find: "@/i18n/navigation", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "@", replacement: fileURLToPath(new URL("../../../", import.meta.url)) },
    ],
   },
   esbuild: { jsx: "automatic" },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "notes-owner-test-page",
     configureServer(instance) {
      instance.middlewares.use("/notes-owner-audit", async (_request, response) => {
       response.setHeader("Content-Type", "text/html");
       response.end(
        await instance.transformIndexHtml(
         "/notes-owner-audit",
         '<!doctype html><html><body><script type="module" src="/src/features/notes/hooks/NoteOwner.browser.fixture.tsx"></script></body></html>',
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
   if (!url) throw new Error("Missing Notes owner fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    const page = await browser.newPage();
    const errors: string[] = [];
    const unexpected: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const userA: User = {
     id: "00000000-0000-4000-8000-000000003001",
     aud: "authenticated",
     app_metadata: {},
     user_metadata: {},
     created_at: "2026-10-10T00:00:00Z",
    };
    const userB: User = { ...userA, id: "00000000-0000-4000-8000-000000003002" };
    let authUser = userA;
    const noteA: NoteDetail = {
     id: "00000000-0000-4000-8000-000000003101",
     user_id: userA.id,
     title: "A private note",
     category: "general",
     tags: [],
     content: { text: "A server" },
     reading_content: null,
     folder_id: null,
     split_view_enabled: false,
     reading_status: null,
     linked_lesson_id: null,
     is_published: false,
     status: "draft",
     short_id: null,
     source_url: null,
     source_host: null,
     source_label: null,
     source_author: null,
     source_published_at: null,
     source_captured_at: null,
     revision: 0,
     created_at: "2026-10-10T00:00:00Z",
     updated_at: "2026-10-10T00:00:00Z",
     links: [],
    };
    const noteB: NoteDetail = {
     ...noteA,
     id: "00000000-0000-4000-8000-000000003102",
     user_id: userB.id,
     title: "B private note",
     content: { text: "B server" },
    };
    const notes = new Map([
     [noteA.id, noteA],
     [noteB.id, noteB],
    ]);
    const writes: Route[] = [];
    const legacyTabs = JSON.stringify({
     version: 1,
     data: { tabs: [{ noteId: noteA.id, title: "Legacy private title" }], activeNoteId: noteA.id },
    });
    await page.addInitScript((value) => localStorage.setItem("note-tabs", value), legacyTabs);
    await page.route("**/auth/v1/user", (route) => route.fulfill({ json: authUser }));
    await page.route("**/auth/v1/logout**", (route) => route.fulfill({ status: 204 }));
    await page.route("**/rest/v1/**", async (route) => {
     const request = route.request();
     const requestUrl = new URL(request.url());
     if (requestUrl.pathname.endsWith("/rpc/update_note_with_revision")) {
      writes.push(route);
      return;
     }
     if (request.method() !== "GET") {
      unexpected.push(`${request.method()} ${requestUrl.pathname}`);
      await route.abort();
      return;
     }
     if (requestUrl.pathname.endsWith("/notes")) {
      const id = requestUrl.searchParams.get("id")?.slice(3) ?? "";
      const owner = requestUrl.searchParams.get("user_id")?.slice(3);
      const note = notes.get(id);
      await route.fulfill({
       json: id
        ? note?.user_id === owner
         ? note
         : null
        : [...notes.values()].filter((item) => item.user_id === owner),
      });
     } else if (
      requestUrl.pathname.endsWith("/lesson_note_links") ||
      requestUrl.pathname.endsWith("/note_folders")
     ) {
      await route.fulfill({ json: [] });
     } else {
      unexpected.push(requestUrl.pathname);
      await route.abort();
     }
    });
    await page.goto(url + "notes-owner-audit");
    await browserExpect(page.locator("#owner")).toHaveText("guest");
    await browserExpect(page.getByRole("tab")).toHaveCount(0);
    await page.evaluate(() => window.notesOwnerHarness.login(window.notesOwnerHarness.userA));
    const content = page.getByRole("textbox", { name: "Content", exact: true });
    await browserExpect(content).toHaveValue("A server");
    await page.evaluate(() =>
     window.notesOwnerHarness.openTab(window.notesOwnerHarness.noteA, "A private note"),
    );
    await browserExpect(
     page.getByRole("tab", { name: "A private note", exact: true }),
    ).toBeVisible();
    await content.fill("A pending");
    await browserExpect.poll(() => writes.length).toBe(1);
    const writeA = writes[0];
    if (!writeA) throw new Error("Missing held A write");
    expect(writeA.request().postData()).toBe(
     JSON.stringify({
      p_note_id: noteA.id,
      p_expected_owner: userA.id,
      p_expected_revision: 0,
      p_changes: { content: { text: "A pending" } },
     }),
    );
    await page.evaluate(() => window.notesOwnerHarness.logout());
    await browserExpect(page.locator("#owner")).toHaveText("guest");
    await browserExpect(content).toHaveValue("");
    await browserExpect(content).toBeDisabled();
    await browserExpect(page.getByRole("tab")).toHaveCount(0);
    await page.evaluate(() =>
     window.notesOwnerHarness.openTab(window.notesOwnerHarness.noteA, "Guest must not open"),
    );
    await browserExpect(page.getByRole("tab")).toHaveCount(0);
    authUser = userB;
    await page.evaluate(() => window.notesOwnerHarness.login(window.notesOwnerHarness.userB));
    await browserExpect(page.locator("#owner")).toHaveText(userB.id);
    await browserExpect(content).toHaveValue("B server");
    await browserExpect(page.getByRole("tab", { name: "A private note", exact: true })).toHaveCount(
     0,
    );
    await page.evaluate(() =>
     window.notesOwnerHarness.openTab(window.notesOwnerHarness.noteB, "B private note"),
    );
    await browserExpect(
     page.getByRole("tab", { name: "B private note", exact: true }),
    ).toBeVisible();
    await content.fill("B pending");
    await browserExpect.poll(() => writes.length).toBe(2);
    const before = await page.evaluate(async () => ({
     a: await window.notesOwnerHarness.draft(
      window.notesOwnerHarness.userA,
      window.notesOwnerHarness.noteA,
     ),
     b: await window.notesOwnerHarness.draft(
      window.notesOwnerHarness.userB,
      window.notesOwnerHarness.noteB,
     ),
    }));
    expect(before.a?.content).toEqual({ text: "A pending" });
    expect(before.b?.content).toEqual({ text: "B pending" });
    // A same-owner auth event must retain the current provider and pending B intent.
    const tabsBefore = await page.evaluate(() => window.notesOwnerHarness.tabs());
    await page.evaluate(() => window.notesOwnerHarness.login(window.notesOwnerHarness.userB));
    expect(await page.evaluate(() => window.notesOwnerHarness.tabs())).toEqual(tabsBefore);
    if (acknowledged) {
     const savedA = { ...noteA, content: { text: "A pending" }, revision: 1 };
     notes.set(noteA.id, savedA);
     await writeA.fulfill({ json: savedA });
    } else {
     await writeA.fulfill({ status: 403, json: { code: "42501", message: "Owner rejected" } });
    }
    await browserExpect
     .poll(() => page.evaluate(() => window.notesOwnerHarness.retiredMutationStatuses()))
     .toEqual([acknowledged ? "success" : "error"]);
    await browserExpect(content).toHaveValue("B pending");
    const after = await page.evaluate(async () => ({
     a: await window.notesOwnerHarness.draft(
      window.notesOwnerHarness.userA,
      window.notesOwnerHarness.noteA,
     ),
     b: await window.notesOwnerHarness.draft(
      window.notesOwnerHarness.userB,
      window.notesOwnerHarness.noteB,
     ),
     clients: window.notesOwnerHarness.snapshots(),
    }));
    expect(after.b).toEqual(before.b);
    if (acknowledged) expect(after.a).toBeNull();
    else expect(after.a).toEqual(before.a);
    expect(after.clients.length).toBe(4);
    expect(after.clients.slice(0, -1).every((snapshot) => snapshot.keys.length === 0)).toBe(true);
    expect(after.clients.at(-1)?.keys.every((key) => key[1] === userB.id)).toBe(true);
    const writeB = writes[1];
    if (!writeB) throw new Error("Missing held B write");
    expect(writeB.request().postData()).toBe(
     JSON.stringify({
      p_note_id: noteB.id,
      p_expected_owner: userB.id,
      p_expected_revision: 0,
      p_changes: { content: { text: "B pending" } },
     }),
    );
    const savedB = { ...noteB, content: { text: "B pending" }, revision: 1 };
    notes.set(noteB.id, savedB);
    await writeB.fulfill({ json: savedB });
    await browserExpect(page.locator("#save-status")).toHaveText("success");
    await browserExpect
     .poll(() =>
      page.evaluate(() =>
       window.notesOwnerHarness.draft(
        window.notesOwnerHarness.userB,
        window.notesOwnerHarness.noteB,
       ),
      ),
     )
     .toBeNull();
    await page.evaluate(() => window.notesOwnerHarness.logout());
    await browserExpect(page.locator("#owner")).toHaveText("guest");
    await browserExpect(page.getByRole("tab")).toHaveCount(0);
    authUser = userA;
    await page.evaluate(() => window.notesOwnerHarness.login(window.notesOwnerHarness.userA));
    await browserExpect(content).toHaveValue("A pending");
    await browserExpect(
     page.getByRole("tab", { name: "A private note", exact: true }),
    ).toBeVisible();
    await browserExpect(page.getByRole("tab", { name: "B private note", exact: true })).toHaveCount(
     0,
    );
    if (!acknowledged) {
     await browserExpect.poll(() => writes.length).toBe(3);
     const retryA = writes[2];
     if (!retryA) throw new Error("Missing recovered A draft write");
     expect(retryA.request().postData()).toBe(writeA.request().postData());
     const savedA = { ...noteA, content: { text: "A pending" }, revision: 1 };
     notes.set(noteA.id, savedA);
     await retryA.fulfill({ json: savedA });
     await browserExpect(page.locator("#save-status")).toHaveText("success");
    }
    await browserExpect
     .poll(() =>
      page.evaluate(() =>
       window.notesOwnerHarness.draft(
        window.notesOwnerHarness.userA,
        window.notesOwnerHarness.noteA,
       ),
      ),
     )
     .toBeNull();
    await page.reload();
    await browserExpect(page.locator("#owner")).toHaveText(userA.id);
    await browserExpect(
     page.getByRole("tab", { name: "A private note", exact: true }),
    ).toBeVisible();
    await browserExpect(content).toHaveValue("A pending");
    await page.evaluate(() => window.notesOwnerHarness.logout());
    authUser = userB;
    await page.evaluate(() => window.notesOwnerHarness.login(window.notesOwnerHarness.userB));
    await browserExpect(
     page.getByRole("tab", { name: "B private note", exact: true }),
    ).toBeVisible();
    await browserExpect(page.getByRole("tab", { name: "A private note", exact: true })).toHaveCount(
     0,
    );
    await page.reload();
    await browserExpect(page.locator("#owner")).toHaveText(userB.id);
    await browserExpect(
     page.getByRole("tab", { name: "B private note", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("note-tabs"))).toBe(legacyTabs);
    // A direct route also has to open after initial session resolution with no scoped tabs.
    await page.evaluate(() => window.notesOwnerHarness.logout());
    authUser = userA;
    await page.evaluate(() => window.notesOwnerHarness.login(window.notesOwnerHarness.userA));
    await page.evaluate(() =>
     localStorage.removeItem(`note-tabs:${window.notesOwnerHarness.userA}`),
    );
    await page.goto(url + "notes-owner-audit?direct=1");
    await browserExpect(page.locator("[data-editor-wrapper]")).toHaveCount(1);
    await browserExpect(
     page.getByRole("tab", { name: "A private note", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.notesOwnerHarness.unmount());
    expect(writes.length).toBe(acknowledged ? 2 : 3);
    expect(unexpected).toEqual([]);
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
