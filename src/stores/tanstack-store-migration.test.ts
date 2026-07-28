import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
 createClient: () => ({
  auth: {
   getSession: async () => ({ data: { session: null } }),
  },
 }),
}));

import { appShellStore } from "./app-shell-store";
import { dictionaryLookupStore } from "./dictionary-lookup-store";
import { focusModeStore } from "./focus-mode-store";
import { headerToolbarStore } from "./header-toolbar-store";
import { inspectorStore } from "./inspector-store";
import { noteTabsStore } from "./note-tabs-store";
import { sidebarStore } from "./sidebar-store";
import { splitViewStore } from "./split-view-store";
import { vocabDetailDrawerStore } from "./vocab-detail-drawer-store";

function createStorage(): Storage {
 const values = new Map<string, string>();
 return {
  get length() {
   return values.size;
  },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
 };
}

describe("TanStack Store migration", () => {
 beforeEach(() => {
  const localStorage = createStorage();
  vi.stubGlobal("window", { localStorage });
  vi.stubGlobal("localStorage", localStorage);

  appShellStore.setState(() => ({ isContentFullscreen: false }));
  headerToolbarStore.setState(() => ({ content: null }));
  vocabDetailDrawerStore.setState(() => ({
   isOpen: false,
   text: "",
   contextSentence: "",
   mode: "word",
  }));
  dictionaryLookupStore.setState(() => ({ overrides: {}, hasHydrated: false }));
  focusModeStore.setState(() => ({ enabled: false, hasHydrated: false }));
  noteTabsStore.setState(() => ({ tabs: [], activeNoteId: null, hasHydrated: false }));
  sidebarStore.setState(() => ({ isCollapsed: false }));
  splitViewStore.setState(() => ({ activeNotes: {}, dividerPositions: {} }));
  inspectorStore.setState(() => ({
   isOpen: false,
   anchorRect: null,
   selectedText: "",
   vocabData: null,
   isLoading: false,
   recentLookups: [],
  }));
 });

 it("keeps UI state and actions separate", () => {
  appShellStore.actions.setContentFullscreen(true);
  headerToolbarStore.actions.setContent("Toolbar");
  vocabDetailDrawerStore.actions.openDetailDrawer({
   text: " 你好 ",
   contextSentence: " 你好！ ",
  });

  expect(appShellStore.get()).toEqual({ isContentFullscreen: true });
  expect(headerToolbarStore.get()).toEqual({ content: "Toolbar" });
  expect(vocabDetailDrawerStore.get()).toEqual({
   isOpen: true,
   text: "你好",
   contextSentence: "你好！",
   mode: "word",
  });

  vocabDetailDrawerStore.actions.closeDetailDrawer();
  expect(vocabDetailDrawerStore.get().isOpen).toBe(false);
 });

 it("preserves versioned persistence and hydration behavior", () => {
  dictionaryLookupStore.actions.setEnabled("/notes/1", true);
  focusModeStore.actions.setEnabled(true);
  sidebarStore.actions.setCollapsed(true);
  noteTabsStore.actions.openTab("note-1", "Ghi chú");
  splitViewStore.actions.setSplitView("note-1", true);
  splitViewStore.actions.setDividerPosition("note-1", 80);

  expect(dictionaryLookupStore.actions.isEnabled("/notes/1")).toBe(true);
  expect(focusModeStore.get()).toEqual({ enabled: true, hasHydrated: true });
  expect(sidebarStore.get().isCollapsed).toBe(true);
  expect(noteTabsStore.get()).toMatchObject({
   tabs: [{ noteId: "note-1", title: "Ghi chú" }],
   activeNoteId: "note-1",
  });
  expect(splitViewStore.actions.isSplitView("note-1")).toBe(true);
  expect(splitViewStore.actions.getDividerPosition("note-1")).toBe(70);

  focusModeStore.setState(() => ({ enabled: false, hasHydrated: false }));
  focusModeStore.actions.hydrate();
  expect(focusModeStore.get()).toEqual({ enabled: true, hasHydrated: true });
 });

 it("keeps inspector request state observable and cancellable", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn(
    (_input: Parameters<typeof fetch>[0], init?: RequestInit) =>
     new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
       reject(new DOMException("Aborted", "AbortError"));
      });
     }),
   ),
  );

  const pendingLookup = inspectorStore.actions.openInspector("你好");
  expect(inspectorStore.get()).toMatchObject({
   isOpen: true,
   selectedText: "你好",
   isLoading: true,
  });

  inspectorStore.actions.closeInspector();
  expect(inspectorStore.get()).toMatchObject({
   isOpen: false,
   selectedText: "",
   isLoading: false,
  });

  await pendingLookup;
 });

 it("reuses a fresh inspector cache entry and refetches a stale one", async () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
  const fetchMock = vi.fn(() =>
   Promise.resolve(
    new Response(
     JSON.stringify({
      data: {
       hanzi: "您好",
       pinyin: "nín hǎo",
       meaning: "xin chào",
      },
     }),
     { status: 200 },
    ),
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  await inspectorStore.actions.openInspector("您好", { lessonId: "lesson-cache" });
  inspectorStore.actions.closeInspector();
  await inspectorStore.actions.openInspector("您好", { lessonId: "lesson-cache" });
  expect(fetchMock).toHaveBeenCalledTimes(1);

  now.mockReturnValue(301_001);
  inspectorStore.actions.closeInspector();
  await inspectorStore.actions.openInspector("您好", { lessonId: "lesson-cache" });
  expect(fetchMock).toHaveBeenCalledTimes(2);
 });
});
