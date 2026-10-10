import { chromium, expect as browserExpect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";
import { expect, it } from "vitest";
import type {} from "./NoteEditor.browser.fixture";
import { appLocales } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import { NoteExportPayloadSchema } from "../note-export.schema";

// Same opt-in browser tier as Reader/Reading. Default Node gate does not launch a browser.
it
 .runIf(process.env.NOTES_BROWSER_TEST === "1")
 .each([
  "editor",
  "library",
  "create-import",
  "quick",
  "metadata",
  "folders",
  "folder-navigation",
  "mobile-export",
 ])(
 "preserves Notes intent, drafts and bounded library/editor resources (%s)",
 async (mode) => {
  const fixture = fileURLToPath(new URL("./NoteEditor.browser.fixture.tsx", import.meta.url));
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/notes-browser",
   optimizeDeps: { entries: [fixture] },
   resolve: {
    alias: [
     { find: "@/services/notes/notes.service", replacement: fixture },
     { find: "@/components/providers/QueryProvider", replacement: fixture },
     { find: "@/lib/supabase/client", replacement: fixture },
     { find: "@/lib/supabase/client-session", replacement: fixture },
     { find: "@/features/notes/components/NoteEditorPanel", replacement: fixture },
     { find: "@/features/notes/hooks/useNoteEditor", replacement: fixture },
     { find: "@/i18n/navigation", replacement: fixture },
     { find: "next/navigation", replacement: fixture },
     { find: "next/link", replacement: fixture },
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
    try {
     await page.goto(url + "notes-audit");
     if (mode === "mobile-export") {
      const messages = await loadAppMessages("vi");
      for (const width of [820, 412]) {
       await page.setViewportSize({ width, height: width === 820 ? 1180 : 915 });
       await page.reload();
       await page.waitForFunction(() => Boolean(window.notesTabHarness));
       await page.evaluate(() => {
        window.notesTabHarness.mount(true);
        window.notesTabHarness.open(1);
       });
       const options = page.getByRole("button", {
        name: messages.Notes.editor.options,
        exact: true,
       });
       await options.focus();
       await page.keyboard.press("Enter");
       await browserExpect(page.getByRole("dialog")).toBeVisible();
       await page.keyboard.press("Escape");
       await browserExpect(page.getByRole("dialog")).toHaveCount(0);
       await browserExpect(options).toBeFocused();
       await options.click();
       await page
        .getByRole("button", { name: messages.Notes.editor.openSplit, exact: true })
        .click();
       await browserExpect(page.getByRole("dialog")).toHaveCount(0);
       await browserExpect(options).toBeFocused();
       if (width === 412) {
        await browserExpect(page.locator('[contenteditable="true"]')).toHaveCount(0);
        await options.click();
        await page
         .getByRole("button", { name: messages.Notes.editor.editMode, exact: true })
         .click();
        await browserExpect(page.getByRole("dialog")).toHaveCount(0);
        await browserExpect(options).toBeFocused();
       }
       const content = page.locator('.split-view-pane-right [contenteditable="true"]:visible');
       const reading = page.locator('.split-view-pane-left [contenteditable="true"]:visible');
       await browserExpect(content).toHaveText("audit-scale-note-1");
       await page
        .getByRole("button", { name: "Hold transport", exact: true })
        .evaluate((button) => {
         if (!(button instanceof HTMLButtonElement)) throw new Error("Expected transport button");
         button.click();
        });
       const expectedContent = `native content ${width}`;
       const expectedReading = `native reading ${width}`;
       await content.fill(expectedContent);
       await reading.fill(expectedReading);
       await browserExpect
        .poll(async () => {
         const draft = await page.evaluate(() =>
          window.notesTabHarness.draft("audit-scale-note-1"),
         );
         const serialized = JSON.stringify(draft);
         return (
          Boolean(draft) &&
          serialized.includes(expectedContent) &&
          serialized.includes(expectedReading)
         );
        })
        .toBe(true);
       await options.click();
       const downloaded = page.waitForEvent("download", { timeout: 5000 });
       await page
        .getByRole("button", { name: messages.Notes.editor.exportAction, exact: true })
        .click();
       const download = await downloaded;
       const path = await download.path();
       if (!path) throw new Error("Missing native Notes download");
       expect(await download.failure()).toBeNull();
       expect(download.suggestedFilename()).toBe("audit-scale-note-1.json");
       const payload = NoteExportPayloadSchema.parse(JSON.parse(await readFile(path, "utf8")));
       expect(payload.version).toBe(2);
       expect(JSON.stringify(payload.note.content)).toContain(expectedContent);
       expect(JSON.stringify(payload.note.readingContent)).toContain(expectedReading);
       expect(payload.note.splitViewEnabled).toBe(true);
       await browserExpect(page.getByRole("dialog")).toHaveCount(0);
       await browserExpect(options).toBeFocused();
       expect(
        await page.evaluate(() => window.notesTabHarness.draft("audit-scale-note-1")),
       ).not.toBeNull();
       await page
        .getByRole("button", { name: "Resume transport", exact: true })
        .evaluate((button) => {
         if (!(button instanceof HTMLButtonElement)) throw new Error("Expected transport button");
         button.click();
        });
       await browserExpect
        .poll(() => page.evaluate(() => window.notesTabHarness.draft("audit-scale-note-1")))
        .toBeNull();
       await page.evaluate(() => window.notesTabHarness.closeAll());
      }
      expect(errors).toEqual([]);
      return;
     }
     if (mode === "folder-navigation") {
      const messages = await loadAppMessages("vi");
      await page.setViewportSize({ width: 1440, height: 900 });
      for (const navigate of [true, false]) {
       await page.waitForFunction(() => Boolean(window.notesLibraryHarness));
       await page.evaluate(() => window.notesLibraryHarness.mount(61));
       await browserExpect(page.locator("article")).toHaveCount(25);
       await page.evaluate(() => window.notesLibraryHarness.configureFolderWrites(true));
       const nav = page.getByRole("navigation", { name: messages.Notes.library, exact: true });
       const folder = nav.getByRole("button", { name: /^Reading folder/ });
       await folder.click();
       await page.getByRole("button", { name: messages.Notes.list.next, exact: true }).click();
       await browserExpect(page.locator("article")).toHaveCount(5);
       await nav
        .getByRole("button", {
         name: messages.Notes.folders.options.replace("{name}", "Reading folder"),
         exact: true,
        })
        .click();
       await page
        .getByRole("menuitem", { name: messages.Notes.folders.delete, exact: true })
        .click();
       const dialog = page.getByRole("dialog");
       const remove = dialog.getByRole("button", {
        name: messages.Notes.folders.delete,
        exact: true,
       });
       await remove.click();
       await browserExpect(remove).toBeDisabled();
       await page.waitForFunction(
        () => window.notesLibraryHarness.folderWrites().deletes.length === 1,
       );
       await dialog
        .getByRole("button", { name: messages.Common.actions.cancel, exact: true })
        .click();
       if (navigate) {
        await nav.getByRole("button", { name: new RegExp(messages.Notes.views.recent) }).click();
        await page.getByRole("button", { name: messages.Notes.list.next, exact: true }).click();
        await page.getByRole("button", { name: messages.Notes.list.next, exact: true }).click();
        await browserExpect(page.locator("article")).toHaveCount(11);
       }
       await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
       await browserExpect(folder).toHaveCount(0);
       await browserExpect(
        nav.getByRole("button", {
         name: new RegExp(navigate ? messages.Notes.views.recent : messages.Notes.views.unfiled),
        }),
       ).toHaveAttribute("aria-pressed", "true");
       await browserExpect(page.locator("article")).toHaveCount(navigate ? 11 : 25);
       await browserExpect(page.locator("article").first()).toContainText(
        navigate ? "Library note 50" : "Library note 0",
       );
       await browserExpect(dialog).toHaveCount(0);
       expect(await page.evaluate(() => window.notesLibraryHarness.folderWrites())).toEqual({
        updates: [],
        deletes: ["reading-folder"],
       });
       expect(
        await page.evaluate(() => window.notesLibraryHarness.creationSnapshot()),
       ).toMatchObject({ notes: [], folders: [], held: 0 });
       await page.reload();
      }
      expect(errors).toEqual([]);
      return;
     }
     if (mode === "folders") {
      const messages = await loadAppMessages("vi");
      await page.waitForFunction(() => Boolean(window.notesLibraryHarness));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.evaluate(() => window.notesLibraryHarness.mount(1));
      await browserExpect(page.locator("article")).toHaveCount(1);
      await page.evaluate(() => window.notesLibraryHarness.configureCreation(true, true));
      const nav = page.getByRole("navigation", {
       name: messages.Notes.library,
       exact: true,
       includeHidden: true,
      });
      const create = nav.getByRole("button", { name: messages.Notes.folders.create, exact: true });
      await create.click();
      const dialog = page.getByRole("dialog");
      const name = dialog.getByLabel(messages.Notes.folders.name, { exact: true });
      const save = dialog.getByRole("button", { name: messages.Common.actions.save, exact: true });
      await name.fill(" First folder ");
      await dialog.getByRole("combobox").click();
      await page
       .getByRole("option", { name: messages.Notes.folders.colors.green, exact: true })
       .click();
      await save.focus();
      await page.keyboard.press("Enter");
      await browserExpect(save).toBeDisabled();
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(
       page.getByText(messages.Notes.folders.saveError, { exact: true }),
      ).toBeVisible();
      await browserExpect(name).toHaveValue(" First folder ");
      await browserExpect(dialog.getByRole("combobox")).toContainText(
       messages.Notes.folders.colors.green,
      );
      await browserExpect(save).toBeEnabled();
      await page.evaluate(() => window.notesLibraryHarness.configureCreation(true));
      await save.click();
      await browserExpect(save).toBeDisabled();
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).folders,
      ).toEqual([{ name: " First folder ", color: "green", parentId: null, position: 1 }]);
      await dialog
       .getByRole("button", { name: messages.Common.actions.cancel, exact: true })
       .click();
      await browserExpect(dialog).toHaveCount(0);
      await create.click();
      await name.fill("Second draft");
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(
       nav.getByRole("button", { name: /^First folder/, includeHidden: true }),
      ).toBeVisible();
      await browserExpect(dialog).toBeVisible();
      await browserExpect(name).toHaveValue("Second draft");
      await browserExpect(save).toBeEnabled();
      await save.click();
      await browserExpect(save).toBeDisabled();
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(dialog).toHaveCount(0);
      await browserExpect(nav.getByRole("button", { name: /^Second draft/ })).toBeVisible();

      await page.evaluate(() => window.notesLibraryHarness.configureFolderWrites(true, true));
      await nav
       .getByRole("button", {
        name: messages.Notes.folders.options.replace("{name}", "First folder"),
        exact: true,
       })
       .click();
      await page
       .getByRole("menuitem", { name: messages.Notes.folders.rename, exact: true })
       .click();
      await name.fill("Renamed folder");
      await save.click();
      await browserExpect(save).toBeDisabled();
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(name).toHaveValue("Renamed folder");
      await browserExpect(save).toBeEnabled();
      await page.evaluate(() => window.notesLibraryHarness.configureFolderWrites(true));
      await save.click();
      await browserExpect(save).toBeDisabled();
      await dialog
       .getByRole("button", { name: messages.Common.actions.cancel, exact: true })
       .click();
      await create.click();
      await name.fill("After rename draft");
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      const renamed = nav.getByRole("button", { name: /^Renamed folder/, includeHidden: true });
      await browserExpect(renamed).toBeVisible();
      await browserExpect(dialog).toBeVisible();
      await browserExpect(name).toHaveValue("After rename draft");
      await dialog
       .getByRole("button", { name: messages.Common.actions.cancel, exact: true })
       .click();
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.folderWrites())).updates,
      ).toEqual([{ id: "created-folder-1", changes: { name: "Renamed folder", color: "green" } }]);

      await renamed.click();
      await browserExpect(renamed).toHaveAttribute("aria-pressed", "true");
      await page.evaluate(() =>
       window.notesLibraryHarness.configureFolderWrites(true, false, true),
      );
      await nav
       .getByRole("button", {
        name: messages.Notes.folders.options.replace("{name}", "Renamed folder"),
        exact: true,
       })
       .click();
      await page
       .getByRole("menuitem", { name: messages.Notes.folders.delete, exact: true })
       .click();
      const remove = dialog.getByRole("button", {
       name: messages.Notes.folders.delete,
       exact: true,
      });
      await remove.click();
      await browserExpect(remove).toBeDisabled();
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(
       page.getByText(messages.Notes.folders.deleteError, { exact: true }),
      ).toBeVisible();
      await browserExpect(remove).toBeEnabled();
      await browserExpect(renamed).toHaveAttribute("aria-pressed", "true");
      await page.evaluate(() => window.notesLibraryHarness.configureFolderWrites(true));
      await remove.click();
      await browserExpect(remove).toBeDisabled();
      await dialog
       .getByRole("button", { name: messages.Common.actions.cancel, exact: true })
       .click();
      await create.click();
      await name.fill("After delete draft");
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(renamed).toHaveCount(0);
      await browserExpect(
       nav.getByRole("button", {
        name: new RegExp(messages.Notes.views.unfiled),
        includeHidden: true,
       }),
      ).toHaveAttribute("aria-pressed", "true");
      await browserExpect(dialog).toBeVisible();
      await browserExpect(name).toHaveValue("After delete draft");
      await dialog
       .getByRole("button", { name: messages.Common.actions.cancel, exact: true })
       .click();
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.folderWrites())).deletes,
      ).toEqual(["created-folder-1"]);
      expect(errors).toEqual([]);
      return;
     }
     if (mode === "metadata") {
      await page.waitForFunction(() => Boolean(window.notesLibraryHarness));
      const viewports = [
       { width: 1440, height: 900 },
       { width: 820, height: 1180 },
       { width: 412, height: 915 },
      ];
      for (const [index, locale] of appLocales.entries()) {
       const messages = await loadAppMessages(locale);
       const viewport = viewports[index];
       if (!viewport) throw new Error("Missing metadata viewport");
       await page.setViewportSize(viewport);
       await page.evaluate((value) => window.notesLibraryHarness.mount(1, value), locale);
       await browserExpect(page.locator("article")).toHaveCount(1);
       await page.evaluate(() => window.notesLibraryHarness.configureMetadata(true, true));
       const before = await page.evaluate(() => window.notesLibraryHarness.metadataSnapshot());
       await page.locator("article").getByRole("button").click();
       await page.getByRole("menuitem", { name: messages.Notes.row.editMetadata }).click();
       const dialog = page.getByRole("dialog");
       const title = dialog.getByLabel(messages.Notes.metadata.titleLabel, { exact: true });
       const url = dialog.getByLabel(messages.Notes.metadata.sourceUrl, { exact: true });
       await title.fill("   Metadata title   ");
       await url.fill("https://Example.com/article?id=2#section");
       await dialog.getByLabel(messages.Notes.metadata.sourceLabel, { exact: true }).fill("   ");
       await dialog
        .getByLabel(messages.Notes.metadata.sourceAuthor, { exact: true })
        .fill("  Author  ");
       await dialog
        .getByLabel(messages.Notes.metadata.publishedAt, { exact: true })
        .fill("2026-01-02");
       const save = dialog.getByRole("button", { name: messages.Common.actions.save, exact: true });
       await save.focus();
       await page.keyboard.press("Enter");
       await browserExpect(save).toBeDisabled();
       await browserExpect(dialog).toBeVisible();
       let snapshot = await page.evaluate(() => window.notesLibraryHarness.metadataSnapshot());
       expect(snapshot.writes).toHaveLength(1);
       expect(snapshot.server?.revision).toBe(0);
       expect(snapshot.draft).toEqual(before.draft);
       await page.evaluate(() => window.notesLibraryHarness.releaseMetadata());
       await browserExpect(
        page.getByText(messages.Notes.metadata.error, { exact: true }),
       ).toBeVisible();
       await browserExpect(save).toBeEnabled();
       await browserExpect(title).toHaveValue("   Metadata title   ");
       await browserExpect(url).toHaveValue("https://Example.com/article?id=2#section");
       snapshot = await page.evaluate(() => window.notesLibraryHarness.metadataSnapshot());
       expect(snapshot.cached).toEqual(before.cached);
       expect(snapshot.draft).toEqual(before.draft);
       await save.click();
       await browserExpect(dialog).toHaveCount(0);
       await browserExpect(page.locator("article")).toContainText("Metadata title");
       snapshot = await page.evaluate(() => window.notesLibraryHarness.metadataSnapshot());
       expect(snapshot.writes).toHaveLength(2);
       expect(snapshot.writes[1]).toMatchObject({
        noteId: "library-note-0",
        revision: 0,
        owner: "audit-notes-owner-20261004",
        input: {
         title: "Metadata title",
         folderId: "reading-folder",
         readingStatus: "reading",
         source: {
          url: "https://example.com/article?id=2",
          host: "example.com",
          label: "example.com",
          author: "Author",
          publishedAt: "2026-01-02",
         },
        },
       });
       expect(snapshot.server?.revision).toBe(1);
       expect(snapshot.server?.content).toEqual(before.server?.content);
       expect(snapshot.server?.reading_content).toEqual(before.server?.reading_content);
       expect(snapshot.cached?.content).toEqual(before.cached?.content);
       expect(snapshot.cached?.reading_content).toEqual(before.cached?.reading_content);
       expect(snapshot.cached?.revision).toBe(1);
       expect(snapshot.draft).toEqual({ ...before.draft, baseRevision: 1 });
       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
       );
      }
      const messages = await loadAppMessages("vi");
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.evaluate(() => window.notesLibraryHarness.mount(1));
      await browserExpect(page.locator("article")).toHaveCount(1);
      await page.evaluate(() => window.notesLibraryHarness.configureMetadata());
      await page.locator("article").getByRole("button").click();
      await page.getByRole("menuitem", { name: messages.Notes.row.editMetadata }).click();
      const dialog = page.getByRole("dialog");
      const title = dialog.getByLabel(messages.Notes.metadata.titleLabel, { exact: true });
      const save = dialog.getByRole("button", { name: messages.Common.actions.save, exact: true });
      await title.fill("Local choice");
      await page.evaluate(() =>
       window.notesLibraryHarness.writeMetadataFromOtherDevice("Other device title"),
      );
      await save.click();
      await browserExpect(dialog.getByRole("alert")).toContainText("Other device title");
      await browserExpect(title).toHaveValue("Local choice");
      await browserExpect(save).toBeDisabled();
      await dialog
       .getByRole("button", { name: messages.Notes.editor.conflict.useServer, exact: true })
       .click();
      await browserExpect(title).toHaveValue("Other device title");
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.metadataSnapshot())).writes,
      ).toHaveLength(1);
      await title.fill("After server choice");
      await save.click();
      await browserExpect(dialog).toHaveCount(0);
      let snapshot = await page.evaluate(() => window.notesLibraryHarness.metadataSnapshot());
      expect(snapshot.writes[1]?.revision).toBe(1);
      expect(snapshot.server?.title).toBe("After server choice");
      expect(snapshot.server?.source_captured_at).toBe("2026-10-09T00:00:00Z");
      await page.locator("article").getByRole("button").click();
      await page.getByRole("menuitem", { name: messages.Notes.row.editMetadata }).click();
      await title.fill("Keep this local title");
      await page.evaluate(() =>
       window.notesLibraryHarness.writeMetadataFromOtherDevice("New other device title"),
      );
      await save.click();
      await browserExpect(dialog.getByRole("alert")).toContainText("New other device title");
      await dialog
       .getByRole("button", { name: messages.Notes.editor.conflict.keepLocal, exact: true })
       .click();
      await browserExpect(dialog).toHaveCount(0);
      snapshot = await page.evaluate(() => window.notesLibraryHarness.metadataSnapshot());
      expect(snapshot.writes.map((write) => write.revision)).toEqual([0, 1, 2, 3]);
      expect(snapshot.server?.title).toBe("Keep this local title");
      expect(snapshot.server?.revision).toBe(4);
      expect(errors).toEqual([]);
      return;
     }
     if (mode === "quick") {
      await page.waitForFunction(() => Boolean(window.notesLibraryHarness));
      for (const locale of appLocales) {
       const messages = await loadAppMessages(locale);
       await page.evaluate((value) => window.notesLibraryHarness.mount(1, value), locale);
       await browserExpect(page.locator("article")).toHaveCount(1);
       await page.evaluate(() => window.notesLibraryHarness.configureQuick(false, false, true));
       const quick = page.getByRole("button", { name: messages.Notes.quick.label, exact: true });
       await quick.focus();
       await page.keyboard.press("Enter");
       await browserExpect(quick).toBeDisabled();
       let snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
       expect(snapshot.notes).toHaveLength(1);
       expect(snapshot.navigations).toEqual([]);
       expect(snapshot.notes[0]?.title).toContain(
        messages.Notes.quick.defaultTitle.split("{date}")[0],
       );
       await quick.evaluate((button) => {
        if (button instanceof HTMLButtonElement) button.click();
       });
       expect(
        (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).notes,
       ).toHaveLength(1);
       await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
       await browserExpect(quick).toBeEnabled();
       await browserExpect
        .poll(
         async () =>
          (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).navigations,
        )
        .toEqual(["/notes/created-note-1"]);
       await page.evaluate(() => window.notesLibraryHarness.configureQuick(true));
       await quick.click();
       await browserExpect
        .poll(
         async () =>
          (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).navigations,
        )
        .toEqual(["/login"]);
       expect(
        (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).notes,
       ).toEqual([]);
       await page.evaluate(() =>
        window.notesLibraryHarness.configureQuick(false, false, false, true),
       );
       await quick.click();
       await browserExpect(
        page.getByText(messages.Notes.quick.error, { exact: true }),
       ).toBeVisible();
       await browserExpect(quick).toBeEnabled();
       snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
       expect(snapshot.notes).toHaveLength(1);
       expect(snapshot.navigations).toEqual([]);
       await page.evaluate(() => window.notesLibraryHarness.configureQuick(false, true));
       await browserExpect(quick).toBeDisabled();
       await quick.evaluate((button) => {
        if (button instanceof HTMLButtonElement) button.click();
       });
       expect(
        (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).notes,
       ).toEqual([]);
       await page.evaluate(() => window.notesLibraryHarness.configureQuick());
      }
      expect(errors).toEqual([]);
      return;
     }
     if (mode === "create-import") {
      await page.waitForFunction(() => Boolean(window.notesLibraryHarness));
      await page.evaluate(() => window.notesLibraryHarness.mount(1, "vi"));
      await browserExpect(page.locator("article")).toHaveCount(1);
      await page.evaluate(() => window.notesLibraryHarness.configureCreation(true));
      const input = page.locator('input[type="file"]');
      const payload = {
       version: 2,
       note: {
        title: "Imported note",
        tags: ["中文"],
        category: "general",
        content: { text: "imported content" },
        readingContent: { text: "imported reading" },
        splitViewEnabled: true,
        readingStatus: "reading",
        folder: { name: "New child", parentName: "New parent", color: "blue" },
       },
      };
      const importButton = page.getByRole("button", { name: "Import ghi chú", exact: true });
      await input.setInputFiles({
       name: "import.json",
       mimeType: "application/json",
       buffer: Buffer.from(JSON.stringify(payload)),
      });
      await browserExpect
       .poll(
        async () => (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).held,
       )
       .toBe(1);
      await browserExpect(importButton).toBeDisabled();
      let snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
      expect(snapshot.notes).toEqual([]);
      expect(snapshot.navigations).toEqual([]);
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect
       .poll(
        async () =>
         (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).folders.length,
       )
       .toBe(2);
      await browserExpect(importButton).toBeDisabled();
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).notes,
      ).toEqual([]);
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect
       .poll(
        async () =>
         (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).notes.length,
       )
       .toBe(1);
      await browserExpect(importButton).toBeDisabled();
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).navigations,
      ).toEqual([]);
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(page.getByText("Đã import ghi chú.", { exact: true })).toBeVisible();
      await browserExpect(importButton).toBeEnabled();
      await browserExpect(input).toHaveValue("");
      snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
      expect(snapshot.folders).toEqual([
       { name: "New parent", color: "blue" },
       { name: "New child", parentId: "created-folder-1", color: "blue" },
      ]);
      expect(snapshot.notes).toEqual([
       {
        title: "Imported note",
        tags: ["中文"],
        category: "general",
        content: { text: "imported content" },
        readingContent: { text: "imported reading" },
        splitViewEnabled: true,
        readingStatus: "reading",
        source: null,
        folderId: "created-folder-2",
       },
      ]);
      expect(snapshot.navigations).toEqual(["/notes/created-note-1"]);
      // The same file can be selected again after the input resets; its folders are reused.
      await page.evaluate(() => window.notesLibraryHarness.configureCreation());
      await input.setInputFiles({
       name: "import.json",
       mimeType: "application/json",
       buffer: Buffer.from(JSON.stringify(payload)),
      });
      await browserExpect
       .poll(
        async () =>
         (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).navigations
          .length,
       )
       .toBe(1);
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).folders,
      ).toEqual([]);
      await browserExpect(input).toHaveValue("");
      await page.evaluate(() => window.notesLibraryHarness.configureCreation(false, true));
      await input.setInputFiles({
       name: "failed.json",
       mimeType: "application/json",
       buffer: Buffer.from(
        JSON.stringify({
         ...payload,
         note: {
          ...payload.note,
          folder: { name: "Failed child", parentName: "Failed parent", color: "blue" },
         },
        }),
       ),
      });
      await browserExpect(
       page.getByText("File import không đúng định dạng ghi chú.", { exact: true }),
      ).toBeVisible();
      snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
      expect(snapshot.notes).toEqual([]);
      expect(snapshot.navigations).toEqual([]);
      expect(snapshot.folders).toHaveLength(1);
      await browserExpect(input).toHaveValue("");
      await browserExpect(importButton).toBeEnabled();
      await page.evaluate(() => window.notesLibraryHarness.configureCreation(false, false, true));
      await input.setInputFiles({
       name: "create-failed.json",
       mimeType: "application/json",
       buffer: Buffer.from(JSON.stringify(payload)),
      });
      await browserExpect
       .poll(
        async () =>
         (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).notes.length,
       )
       .toBe(1);
      await browserExpect(input).toHaveValue("");
      expect(
       (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).navigations,
      ).toEqual([]);
      await page.evaluate(() => window.notesLibraryHarness.configureCreation());
      await input.setInputFiles({
       name: "invalid.json",
       mimeType: "application/json",
       buffer: Buffer.from("not json"),
      });
      await browserExpect(input).toHaveValue("");
      snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
      expect(snapshot.notes).toEqual([]);
      expect(snapshot.folders).toEqual([]);
      expect(snapshot.navigations).toEqual([]);
      await page.getByRole("button", { name: "Tạo ghi chú hoặc bài đọc", exact: true }).click();
      await page.getByRole("menuitem").filter({ hasText: "Ghi chú thường" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Tiêu đề", { exact: true }).fill("  New note  ");
      await dialog.getByLabel("Tag", { exact: true }).fill("中文, , grammar, 中文");
      await dialog.getByRole("combobox").nth(1).click();
      await page.getByRole("option", { name: "Văn hóa", exact: true }).click();
      await dialog.getByRole("button", { name: "Tạo", exact: true }).click();
      await browserExpect(dialog).toHaveCount(0);
      snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
      expect(snapshot.notes[0]).toMatchObject({
       title: "New note",
       tags: ["中文", "grammar", "中文"],
       category: "culture",
       splitViewEnabled: false,
       folderId: null,
       readingStatus: null,
       source: null,
      });
      expect(snapshot.navigations).toEqual(["/notes/created-note-1"]);
      await page.evaluate(() => window.notesLibraryHarness.configureCreation(true));
      await page.getByRole("button", { name: "Tạo ghi chú hoặc bài đọc", exact: true }).click();
      await page.getByRole("menuitem").filter({ hasText: "Bài đọc" }).click();
      await dialog.getByLabel("Tiêu đề", { exact: true }).fill("Reading note");
      await dialog.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "Reading folder", exact: true }).click();
      const submitReading = dialog.getByRole("button", { name: /Tạo và mở$/ });
      await submitReading.click();
      await browserExpect(submitReading).toBeDisabled();
      snapshot = await page.evaluate(() => window.notesLibraryHarness.creationSnapshot());
      expect(snapshot.navigations).toEqual([]);
      expect(snapshot.notes[0]).toMatchObject({
       title: "Reading note",
       tags: [],
       category: "general",
       splitViewEnabled: true,
       folderId: "reading-folder",
       readingStatus: "reading",
      });
      expect(snapshot.notes[0]?.readingContent).toEqual(snapshot.notes[0]?.content);
      await page.evaluate(() => window.notesLibraryHarness.releaseCreation());
      await browserExpect(dialog).toHaveCount(0);
      await browserExpect
       .poll(
        async () =>
         (await page.evaluate(() => window.notesLibraryHarness.creationSnapshot())).navigations
          .length,
       )
       .toBe(1);
      expect(errors).toEqual([]);
      return;
     }
     if (mode === "library") {
      await page.waitForFunction(() => Boolean(window.notesLibraryHarness));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.evaluate(() => window.notesLibraryHarness.mount(61, "vi", true));
      await browserExpect
       .poll(() => page.evaluate(() => window.notesLibraryHarness.snapshot().heldReads))
       .toBe(2);
      await browserExpect(page.locator('[aria-busy="true"]')).toBeVisible();
      await page.evaluate(() => window.notesLibraryHarness.release());
      const rows = page.locator("article");
      const pages = page.getByRole("navigation", { name: "Phân trang ghi chú", exact: true });
      const next = pages.getByRole("button", { name: "Trang sau", exact: true });
      const previous = pages.getByRole("button", { name: "Trang trước", exact: true });
      const search = page.getByRole("textbox", { name: "Tìm ghi chú", exact: true });
      await browserExpect(rows).toHaveCount(25);
      await browserExpect(rows.first()).toContainText("Library note 0");
      await browserExpect(pages).toContainText("1–25 trên 61 ghi chú");
      await browserExpect(previous).toBeDisabled();
      await next.focus();
      await page.keyboard.press("Enter");
      await browserExpect(rows.first()).toContainText("Library note 25");
      await browserExpect(rows.first()).toBeInViewport();
      await browserExpect(rows.last()).toContainText("Library note 49");
      await next.click();
      await browserExpect(rows).toHaveCount(11);
      await browserExpect(rows.last()).toContainText("Library note 60");
      await browserExpect(next).toBeDisabled();
      await previous.click();
      await browserExpect(rows).toHaveCount(25);
      await search.fill("Library note 60");
      await browserExpect(rows).toHaveCount(1);
      await browserExpect(rows.first()).toContainText("Library note 60");
      await browserExpect(pages).toHaveCount(0);
      await search.fill("");
      await browserExpect(previous).toBeDisabled();
      await next.click();
      await page.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "Ngữ pháp", exact: true }).click();
      await browserExpect(previous).toBeDisabled();
      await browserExpect(pages).toContainText("1–25 trên 30 ghi chú");
      await next.click();
      await browserExpect(rows).toHaveCount(5);
      await page.getByRole("combobox").nth(1).click();
      await page.getByRole("option", { name: "Alpha", exact: true }).click();
      await browserExpect(previous).toBeDisabled();
      await page.getByRole("combobox").nth(1).click();
      await page.getByRole("option", { name: "Beta", exact: true }).click();
      await browserExpect(rows).toHaveCount(0);
      await browserExpect(page.getByText("Chưa có ghi chú phù hợp", { exact: true })).toBeVisible();
      await page.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "Mọi danh mục", exact: true }).click();
      await browserExpect(rows).toHaveCount(25);
      await page.getByRole("combobox").nth(1).click();
      await page.getByRole("option", { name: "Mọi nguồn", exact: true }).click();
      const library = page.getByRole("navigation", { name: "Thư viện ghi chú", exact: true });
      await next.click();
      await library.getByRole("button", { name: "Đã đọc 31", exact: true }).click();
      await browserExpect(previous).toBeDisabled();
      await browserExpect(rows.first()).toContainText("Library note 30");
      await browserExpect(
       page.getByRole("heading", { name: "tháng 10 năm 2026", exact: true }),
      ).toBeVisible();
      await next.click();
      await browserExpect(rows).toHaveCount(6);
      await library.getByRole("button", { name: "Reading folder 30", exact: true }).click();
      await browserExpect(previous).toBeDisabled();
      await browserExpect(rows.first()).toContainText("Library note 0");
      await library.getByRole("button", { name: "Gần đây 61", exact: true }).click();
      await next.click();
      await next.click();
      await page.evaluate(() => window.notesLibraryHarness.shrink(30));
      await browserExpect(rows).toHaveCount(5);
      await browserExpect(pages).toContainText("Trang 2/2");
      await browserExpect(rows.first()).toContainText("Library note 25");
      await browserExpect(next).toBeDisabled();
      const beforeRefetch = await page.evaluate(() => window.notesLibraryHarness.snapshot());
      expect(beforeRefetch.listReads).toBe(1);
      // A failed refetch must expose retry while retaining the last confirmed collection.
      await page.evaluate(() => window.notesLibraryHarness.refresh(true));
      await browserExpect(page.getByRole("alert")).toBeVisible();
      await browserExpect(rows).toHaveCount(5);
      await page.evaluate(() => window.notesLibraryHarness.release(false));
      await page.getByRole("button", { name: "Thử lại", exact: true }).click();
      await browserExpect(page.getByRole("alert")).toHaveCount(0);
      await browserExpect(rows).toHaveCount(5);
      const snapshot = await page.evaluate(() => window.notesLibraryHarness.snapshot());
      expect(snapshot.serverWrites).toBe(0);
      expect(snapshot.listReads).toBe(beforeRefetch.listReads + 2);
      expect(snapshot.folderReads).toBe(beforeRefetch.folderReads + 2);
      for (const locale of appLocales) {
       const nextLabel = locale === "en" ? "Next" : locale === "zh-CN" ? "下一页" : "Trang sau";
       const previousLabel =
        locale === "en" ? "Previous" : locale === "zh-CN" ? "上一页" : "Trang trước";
       const paginationLabel =
        locale === "en" ? "Notes pages" : locale === "zh-CN" ? "笔记分页" : "Phân trang ghi chú";
       const firstPageLabel =
        locale === "en" ? "Page 1 of 2" : locale === "zh-CN" ? "第 1/2 页" : "Trang 1/2";
       const retryLabel = locale === "en" ? "Retry" : locale === "zh-CN" ? "重试" : "Thử lại";
       const openLibraryLabel =
        locale === "en" ? "Open library" : locale === "zh-CN" ? "打开笔记库" : "Mở thư viện";
       for (const viewport of [
        { width: 1440, height: 900 },
        { width: 820, height: 1180 },
        { width: 412, height: 915 },
       ]) {
        await page.setViewportSize(viewport);
        await page.evaluate(({ locale }) => window.notesLibraryHarness.mount(26, locale), {
         locale,
        });
        await browserExpect(rows).toHaveCount(25);
        await browserExpect(
         page.getByRole("navigation", { name: paginationLabel, exact: true }),
        ).toContainText(firstPageLabel);
        const forward = page.getByRole("button", { name: nextLabel, exact: true });
        await forward.focus();
        await page.keyboard.press("Enter");
        await browserExpect(rows).toHaveCount(1);
        await browserExpect(rows.first()).toContainText("Library note 25");
        await browserExpect(rows.first()).toBeInViewport();
        await browserExpect(forward).toBeDisabled();
        if (locale === "vi" && viewport.width === 412)
         await page.screenshot({
          path: "/tmp/chines-app-notes-page-mobile-20261010.png",
          fullPage: true,
         });
        if (viewport.width < 1280) {
         await page.getByRole("button", { name: openLibraryLabel, exact: true }).click();
         await page.getByRole("button", { name: "Reading folder 26", exact: true }).click();
         await browserExpect(
          page.getByRole("button", { name: previousLabel, exact: true }),
         ).toBeDisabled();
         await browserExpect(page.getByRole("dialog")).toHaveCount(0);
        } else {
         await page.getByRole("button", { name: previousLabel, exact: true }).click();
        }
        await browserExpect(rows).toHaveCount(25);
        if (viewport.width === 1440) {
         await page.evaluate(() => window.notesLibraryHarness.refresh(true));
         await browserExpect(page.getByRole("alert")).toBeVisible();
         await browserExpect(rows).toHaveCount(25);
         await page.evaluate(() => window.notesLibraryHarness.release(false));
         await page.getByRole("button", { name: retryLabel, exact: true }).click();
         await browserExpect(page.getByRole("alert")).toHaveCount(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
         true,
        );
       }
      }
      await page.evaluate(() => window.notesLibraryHarness.mount(0, "vi", true));
      await browserExpect
       .poll(() => page.evaluate(() => window.notesLibraryHarness.snapshot().heldReads))
       .toBe(2);
      await page.evaluate(() => window.notesLibraryHarness.release(true));
      await browserExpect(page.getByRole("alert")).toBeVisible();
      await browserExpect(rows).toHaveCount(0);
      await page.evaluate(() => window.notesLibraryHarness.release(false));
      await page.getByRole("button", { name: "Thử lại", exact: true }).click();
      await browserExpect(page.getByRole("alert")).toHaveCount(0);
      await browserExpect(page.getByText("Chưa có ghi chú phù hợp", { exact: true })).toBeVisible();
      expect(errors).toEqual([]);
      return;
     }
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
     await page.getByRole("button", { name: "Write from another device", exact: true }).click();
     await readingEditor.fill("my conflict reading");
     const dialog = page.getByRole("dialog");
     await browserExpect(dialog).toBeVisible();
     await browserExpect(dialog).toContainText("my conflict reading");
     await browserExpect(dialog).toContainText("other device reading");
     await page.keyboard.press("Escape");
     await browserExpect(dialog).not.toBeVisible();
     await page.getByRole("button", { name: "Read local draft", exact: true }).click();
     await browserExpect(page.locator("#local-draft")).toContainText("my conflict reading");
     await page.reload();
     await browserExpect(dialog).toBeVisible();
     await browserExpect(dialog).toContainText("my conflict reading");
     await browserExpect(dialog).toContainText("other device version");
     await dialog.getByRole("button", { name: "Giữ bản của tôi và lưu tiếp", exact: true }).click();
     await browserExpect(dialog).not.toBeVisible();
     await browserExpect(readingEditor).toHaveText("my conflict reading");
     await browserExpect(noteEditor).toHaveText("other device version");
     await browserExpect(serverState).toContainText('"text": "my conflict reading"');
     await browserExpect(serverState).toContainText('"text": "other device version"');
     await browserExpect
      .poll(async () => {
       await page.getByRole("button", { name: "Read local draft", exact: true }).click();
       return page.locator("#local-draft").textContent();
      })
      .toBe("null");
     await page.getByRole("button", { name: "Export latest", exact: true }).click();
     await browserExpect(page.locator("#exported-note")).toContainText("other device version");
     await browserExpect(page.locator("#exported-note")).toContainText("my conflict reading");

     await page.getByRole("button", { name: "Write from another device", exact: true }).click();
     await noteEditor.fill("discard this local draft");
     await browserExpect(dialog).toBeVisible();
     await dialog.getByRole("button", { name: "Dùng bản server", exact: true }).click();
     await browserExpect(dialog).not.toBeVisible();
     await browserExpect(noteEditor).toHaveText("other device version");
     await browserExpect(readingEditor).toHaveText("other device reading");
     await browserExpect
      .poll(async () => {
       await page.getByRole("button", { name: "Read local draft", exact: true }).click();
       return page.locator("#local-draft").textContent();
      })
      .toBe("null");
     await page.getByRole("button", { name: "Export latest", exact: true }).click();
     await browserExpect(page.locator("#exported-note")).not.toContainText(
      "discard this local draft",
     );
     // A duplicated tab inherits sessionStorage but must acquire a different
     // identity lease. Acknowledging A must leave B's pending draft untouched.
     await page.getByRole("button", { name: "Hold transport", exact: true }).click();
     await noteEditor.fill("tab A offline draft");
     await browserExpect
      .poll(() =>
       page.evaluate(async () => JSON.stringify(await window.notesDraftHarness.current())),
      )
      .toContain("tab A offline draft");
     const draftA = await page.evaluate(() => window.notesDraftHarness.current());
     if (!draftA) throw new Error("Missing tab A draft");
     const popupPromise = page.context().waitForEvent("page");
     await page.evaluate(() => {
      window.open(location.href, "_blank");
     });
     const popup = await popupPromise;
     popup.on("pageerror", (error) => errors.push(error.message));
     const popupDialog = popup.getByRole("dialog");
     await browserExpect(popupDialog).toContainText("tab A offline draft");
     await popupDialog.getByRole("button", { name: "Dùng bản server", exact: true }).click();
     await popup.getByRole("button", { name: "Hold transport", exact: true }).click();
     await popup.locator(".split-view-pane-right [contenteditable]").fill("tab B offline draft");
     await browserExpect
      .poll(() =>
       popup.evaluate(async () => JSON.stringify(await window.notesDraftHarness.current())),
      )
      .toContain("tab B offline draft");
     const draftB = await popup.evaluate(() => window.notesDraftHarness.current());
     if (!draftB) throw new Error("Missing tab B draft");
     expect(draftB.key).not.toBe(draftA.key);
     expect(draftB.tabId).not.toBe(draftA.tabId);
     await page.getByRole("button", { name: "Resume transport", exact: true }).click();
     await browserExpect
      .poll(() => page.evaluate(() => window.notesDraftHarness.current()))
      .toBeNull();
     await browserExpect
      .poll(() =>
       popup.evaluate(async () => JSON.stringify(await window.notesDraftHarness.current())),
      )
      .toContain("tab B offline draft");
     await popup.reload();
     await browserExpect(popup.locator(".split-view-pane-right [contenteditable]")).toHaveText(
      "tab B offline draft",
     );
     await browserExpect
      .poll(() => popup.evaluate(() => window.notesDraftHarness.current()))
      .toBeNull();
     await popup.close();

     // Legacy rows stay available until both recovered panes are acknowledged.
     await page.evaluate(() => window.notesDraftHarness.seedLegacy());
     await page.reload();
     await browserExpect(dialog).toContainText("legacy recovery");
     await browserExpect(dialog).toContainText("legacy reading");
     await browserExpect(
      dialog.getByRole("button", { name: "Giữ bản của tôi và lưu tiếp", exact: true }),
     ).toBeDisabled();
     await dialog.getByRole("button", { name: "Khôi phục bản nháp này", exact: true }).click();
     expect(await page.evaluate(async () => (await window.notesDraftHarness.others()).length)).toBe(
      1,
     );
     await dialog.getByRole("button", { name: "Giữ bản của tôi và lưu tiếp", exact: true }).click();
     await browserExpect(dialog).not.toBeVisible();
     await browserExpect(noteEditor).toHaveText("legacy recovery");
     await browserExpect(readingEditor).toHaveText("legacy reading");
     await browserExpect(serverState).toContainText('"text": "legacy recovery"');
     await browserExpect(serverState).toContainText('"text": "legacy reading"');
     await browserExpect
      .poll(() => page.evaluate(() => window.notesDraftHarness.current()))
      .toBeNull();
     await browserExpect
      .poll(() => page.evaluate(() => window.notesDraftHarness.others()))
      .toEqual([]);
     await page.getByRole("button", { name: "Mount lesson note", exact: true }).click();
     const lessonEditors = page.locator(
      '.lesson-note-pane-content [contenteditable="true"]:visible',
     );
     await browserExpect(lessonEditors).toHaveCount(2);
     await browserExpect
      .poll(() => page.evaluate(() => window.notesDraftHarness.current()))
      .toBeNull();
     await page.getByRole("button", { name: "Fail next transport", exact: true }).click();
     await lessonEditors.last().fill("lesson draft survives failure");
     await browserExpect(page.getByRole("alert")).toHaveText("Lỗi lưu");
     expect(
      JSON.stringify(await page.evaluate(() => window.notesDraftHarness.current())),
     ).toContain("lesson draft survives failure");
     await page.getByRole("button", { name: "Thử lại", exact: true }).click();
     await browserExpect(page.getByRole("status")).toHaveText("Đã lưu");
     await browserExpect(serverState).toContainText("lesson draft survives failure");
     await browserExpect
      .poll(() => page.evaluate(() => window.notesDraftHarness.current()))
      .toBeNull();
     // Real NoteTabContainer/NoteEditorPanel/Lexical owners remain mounted for
     // hidden tabs. Closing them must release observers and effect listeners.
     await page.evaluate(() => window.notesTabHarness.mount());
     const resourceSamples: (ReturnType<Window["notesTabHarness"]["snapshot"]> & {
      repetition: number;
      count: number;
     })[] = [];
     for (let repetition = 0; repetition < 5; repetition += 1) {
      for (const count of [1, 5, 20]) {
       await page.evaluate((size) => window.notesTabHarness.open(size), count);
       await browserExpect
        .poll(() => page.evaluate(() => window.notesTabHarness.snapshot().editors))
        .toBe(count);
       await browserExpect
        .poll(() => page.evaluate(() => window.notesTabHarness.snapshot().beforeUnload))
        .toBe(count);
       await browserExpect
        .poll(() => page.evaluate(() => window.notesTabHarness.snapshot().fetchingNotes))
        .toBe(0);
       const snapshot = await page.evaluate(() => window.notesTabHarness.snapshot());
       expect(snapshot.activeDetails).toBe(count);
       expect(snapshot.visibleEditors).toBe(1);
       expect(snapshot.openTab).toBe(1);
       resourceSamples.push({ repetition, count, ...snapshot });
      }
      await page.evaluate(() => window.notesTabHarness.activate("audit-scale-note-1"));
      const activeEditor = page.locator('[data-editor-wrapper]:visible [contenteditable="true"]');
      await browserExpect(activeEditor).toHaveCount(1);
      await browserExpect(activeEditor).toHaveText(
       repetition === 0
        ? "audit-scale-note-1"
        : `draft survives hidden and closed tab ${repetition - 1}`,
      );
      await browserExpect
       .poll(() => page.evaluate(() => window.notesTabHarness.snapshot().pendingWrites))
       .toBe(0);
      const otherSplit = await page.evaluate(() =>
       window.notesTabHarness.measureSplitToggle("audit-scale-note-2"),
      );
      await browserExpect
       .poll(() => page.evaluate(() => window.notesTabHarness.snapshot().editors))
       .toBe(21);
      const commitsAfterOtherSplit = otherSplit.panelCommits;
      expect(
       commitsAfterOtherSplit.find(([id]) => id === "audit-scale-note-1")?.[1] ?? 0,
       JSON.stringify({ repetition, otherSplit }),
      ).toBe(0);
      expect(
       commitsAfterOtherSplit.find(([id]) => id === "audit-scale-note-2")?.[1],
      ).toBeGreaterThan(0);
      expect(
       otherSplit.panelRenderCounts.find(([id]) => id === "audit-scale-note-1")?.[1] ?? 0,
      ).toBe(0);
      expect(
       otherSplit.panelRenderCounts.find(([id]) => id === "audit-scale-note-2")?.[1],
      ).toBeGreaterThan(0);
      await page.getByRole("button", { name: "Hold transport", exact: true }).click();
      const text = `draft survives hidden and closed tab ${repetition}`;
      await activeEditor.fill(text);
      await browserExpect
       .poll(() =>
        page.evaluate(async () =>
         JSON.stringify(await window.notesTabHarness.draft("audit-scale-note-1")),
        ),
       )
       .toContain(text);
      await page.evaluate(() => window.notesTabHarness.activate("audit-scale-note-3"));
      await page.evaluate(() => window.notesTabHarness.activate("audit-scale-note-1"));
      await browserExpect(activeEditor).toHaveText(text);
      await page.evaluate(() => window.notesTabHarness.closeAll());
      await browserExpect
       .poll(() => page.evaluate(() => window.notesTabHarness.snapshot().beforeUnload))
       .toBe(0);
      const closed = await page.evaluate(() => window.notesTabHarness.snapshot());
      expect(closed.editors).toBe(0);
      expect(closed.activeDetails).toBe(0);
      expect(closed.keydown).toBe(0);
      expect(closed.openTab).toBe(1);
      expect(closed.cachedDetails).toBe(20);
      expect(
       JSON.stringify(
        await page.evaluate(() => window.notesTabHarness.draft("audit-scale-note-1")),
       ),
      ).toContain(text);
      await page.getByRole("button", { name: "Resume transport", exact: true }).click();
      await browserExpect
       .poll(() => page.evaluate(() => window.notesTabHarness.draft("audit-scale-note-1")))
       .toBeNull();
      await page.evaluate(() => window.notesTabHarness.toggleSplit("audit-scale-note-2"));
     }
     await page.getByRole("button", { name: "Unmount", exact: true }).click();
     const unmounted = await page.evaluate(() => window.notesTabHarness.snapshot());
     expect(unmounted.beforeUnload).toBe(0);
     expect(unmounted.keydown).toBe(0);
     expect(unmounted.openTab).toBe(0);
     await writeFile(
      "/tmp/chines-app-notes-tab-scale-20261008.json",
      JSON.stringify({ resourceSamples, unmounted }, null, 2) + "\n",
     );
     expect(errors).toEqual([]);
    } catch (failure) {
     throw new Error(`Notes browser failed; application errors: ${errors.join("; ")}`, {
      cause: failure,
     });
    }
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 60_000,
);
