import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
 createClient: () => ({
  auth: {
   getSession: async () => ({ data: { session: null } }),
  },
 }),
}));

import { appShellStore } from "./shell/app-shell-store";
import { dictionaryLookupStore } from "./dictionary/dictionary-lookup-store";
import { focusModeStore, isFocusNavigationAllowed } from "./shell/focus-mode-store";
import { headerToolbarStore } from "./shell/header-toolbar-store";
import { inspectorStore } from "./dictionary/inspector-store";
import { noteTabsStore } from "./notes/note-tabs-store";
import { sidebarStore } from "./shell/sidebar-store";
import { splitViewStore } from "./notes/split-view-store";
import { vocabDetailDrawerStore } from "./dictionary/vocab-detail-drawer-store";

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
  vi.stubGlobal("window", { localStorage, location: { origin: "http://localhost" } });
  vi.stubGlobal("localStorage", localStorage);

  appShellStore.setState(() => ({ isContentFullscreen: false }));
  headerToolbarStore.setState(() => ({ content: null, ownerId: null }));
  vocabDetailDrawerStore.setState(() => ({
   isOpen: false,
   text: "",
   contextSentence: "",
   mode: "word",
  }));
  dictionaryLookupStore.setState(() => ({ overrides: {}, hasHydrated: false }));
  focusModeStore.setState(() => ({ enabled: false, hasHydrated: false }));
  noteTabsStore.setState(() => ({
   ownerId: null,
   tabs: [],
   activeNoteId: null,
   hasHydrated: false,
  }));
  noteTabsStore.actions.setOwner("owner-a");
  sidebarStore.setState(() => ({ isCollapsed: false }));
  splitViewStore.setState(() => ({ activeNotes: {}, dividerPositions: {} }));
  inspectorStore.setState(() => ({
   isOpen: false,
   anchorRect: null,
   selectedText: "",
   lessonId: "",
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
  expect(headerToolbarStore.get()).toEqual({ content: "Toolbar", ownerId: null });
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
  dictionaryLookupStore.actions.setEnabled("/", false);
  dictionaryLookupStore.actions.setEnabled("/notes/1", true);
  focusModeStore.actions.setEnabled(true);
  sidebarStore.actions.setCollapsed(true);
  noteTabsStore.actions.openTab("note-1", "Ghi chú");
  splitViewStore.actions.setSplitView("note-1", true);
  splitViewStore.actions.setDividerPosition("note-1", 80);

  expect(dictionaryLookupStore.actions.isEnabled("/")).toBe(false);
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

 it("shares route preferences across locale prefixes", () => {
  expect(dictionaryLookupStore.actions.isEnabled("/vi/notes/note-1")).toBe(false);
  expect(dictionaryLookupStore.actions.isEnabled("/en/dictionary")).toBe(true);

  dictionaryLookupStore.actions.setEnabled("/en/notes/note-2", true);

  expect(dictionaryLookupStore.actions.isEnabled("/vi/notes/note-1")).toBe(true);
  expect(dictionaryLookupStore.actions.isEnabled("/zh-CN/notes/note-3")).toBe(true);
 });

 it("does not notify Notes subscribers for unchanged tab actions", () => {
  noteTabsStore.actions.openTab("note-1", "Ghi chú");
  const initial = noteTabsStore.get();
  const notify = vi.fn();
  const subscription = noteTabsStore.subscribe(notify);
  try {
   noteTabsStore.actions.setOwner("owner-a");
   noteTabsStore.actions.openTab("note-1", "Ghi chú");
   noteTabsStore.actions.setActive("note-1");
   noteTabsStore.actions.updateTabTitle("note-1", "Ghi chú");
   noteTabsStore.actions.updateTabTitle("missing", "Missing");
   expect(noteTabsStore.get()).toBe(initial);
   expect(notify).not.toHaveBeenCalled();
   noteTabsStore.actions.updateTabTitle("note-1", "Đã đổi tên");
   expect(notify).toHaveBeenCalledOnce();
   expect(noteTabsStore.get().tabs).toEqual([{ noteId: "note-1", title: "Đã đổi tên" }]);
   noteTabsStore.actions.openTab("note-2", "Hai");
   noteTabsStore.actions.setActive("note-1");
   expect(noteTabsStore.get().activeNoteId).toBe("note-1");
  } finally {
   subscription.unsubscribe();
  }
 });

 it("isolates persisted note titles, preserves legacy bytes and restores each owner's tabs", () => {
  const legacy = JSON.stringify({
   version: 1,
   data: {
    tabs: [{ noteId: "legacy-note", title: "Legacy private" }],
    activeNoteId: "legacy-note",
   },
  });
  localStorage.setItem("note-tabs", legacy);
  noteTabsStore.actions.openTab("note-a", "A private");
  const savedA = localStorage.getItem("note-tabs:owner-a");
  expect(savedA).toBe(
   JSON.stringify({
    version: 1,
    data: {
     tabs: [{ noteId: "note-a", title: "A private" }],
     activeNoteId: "note-a",
    },
   }),
  );
  noteTabsStore.actions.setOwner(null);
  noteTabsStore.actions.openTab("guest-note", "Must not persist");
  noteTabsStore.actions.closeAll();
  expect(noteTabsStore.get()).toEqual({
   ownerId: null,
   tabs: [],
   activeNoteId: null,
   hasHydrated: true,
  });
  expect(localStorage.getItem("note-tabs:owner-a")).toBe(savedA);
  expect(localStorage.getItem("note-tabs:null")).toBeNull();
  noteTabsStore.actions.setOwner("owner-b");
  expect(noteTabsStore.get().tabs).toEqual([]);
  noteTabsStore.actions.openTab("note-b", "B private");
  const savedB = localStorage.getItem("note-tabs:owner-b");
  noteTabsStore.actions.setOwner("owner-a");
  expect(noteTabsStore.get().tabs).toEqual([{ noteId: "note-a", title: "A private" }]);
  expect(noteTabsStore.get().activeNoteId).toBe("note-a");
  noteTabsStore.actions.setOwner("owner-b");
  expect(noteTabsStore.get().tabs).toEqual([{ noteId: "note-b", title: "B private" }]);
  expect(localStorage.getItem("note-tabs:owner-a")).toBe(savedA);
  expect(localStorage.getItem("note-tabs:owner-b")).toBe(savedB);
  expect(localStorage.getItem("note-tabs")).toBe(legacy);
 });

 it("keeps the existing twenty-tab order and selection after owner restoration", () => {
  for (let index = 1; index <= 21; index++) {
   noteTabsStore.actions.openTab(`note-${index}`, `Title ${index}`);
  }
  expect(noteTabsStore.get().tabs).toHaveLength(20);
  expect(noteTabsStore.get().tabs[0].noteId).toBe("note-2");
  noteTabsStore.actions.reorderTabs(19, 0);
  noteTabsStore.actions.setActive("note-10");
  noteTabsStore.actions.updateTabTitle("note-10", "Updated title");
  const state = noteTabsStore.get();
  noteTabsStore.actions.setOwner(null);
  noteTabsStore.actions.setOwner("owner-a");
  expect(noteTabsStore.get()).toEqual(state);
  noteTabsStore.actions.closeTab("note-10");
  expect(noteTabsStore.get().activeNoteId).toBe("note-11");
  noteTabsStore.actions.closeOthers("note-21");
  noteTabsStore.actions.setOwner(null);
  noteTabsStore.actions.setOwner("owner-a");
  expect(noteTabsStore.get().tabs).toEqual([{ noteId: "note-21", title: "Title 21" }]);
  expect(noteTabsStore.get().activeNoteId).toBe("note-21");
 });

 it("keeps focus mode navigation inside the current lesson or an open note", () => {
  expect(
   isFocusNavigationAllowed({
    currentHref: "http://localhost/hanzihome?courseId=course-1&lesson=lesson-1",
    targetHref: "http://localhost/hanzihome?courseId=course-1&lesson=lesson-2",
    openNoteIds: [],
   }),
  ).toBe(false);
  expect(
   isFocusNavigationAllowed({
    currentHref: "http://localhost/hanzihome?courseId=course-1&lesson=lesson-1",
    targetHref: "http://localhost/hanzihome?courseId=course-1&lesson=lesson-1",
    openNoteIds: [],
   }),
  ).toBe(true);
  expect(
   isFocusNavigationAllowed({
    currentHref: "http://localhost/notes/note-1",
    targetHref: "http://localhost/notes/note-2",
    openNoteIds: ["note-1"],
   }),
  ).toBe(false);
  expect(
   isFocusNavigationAllowed({
    currentHref: "http://localhost/notes/note-1",
    targetHref: "http://localhost/notes/note-2",
    openNoteIds: ["note-2"],
   }),
  ).toBe(true);
 });

 it("treats locale changes as the same logical focus-mode route", () => {
  expect(
   isFocusNavigationAllowed({
    currentHref: "http://localhost/vi/hanzihome?courseId=course-1&lesson=lesson-1",
    targetHref: "http://localhost/en/hanzihome?courseId=course-1&lesson=lesson-1",
    openNoteIds: [],
   }),
  ).toBe(true);
  expect(
   isFocusNavigationAllowed({
    currentHref: "http://localhost/vi/hanzihome?courseId=course-1&lesson=lesson-1",
    targetHref: "http://localhost/zh-CN/hanzihome?courseId=course-1&lesson=lesson-2",
    openNoteIds: [],
   }),
  ).toBe(false);
  expect(
   isFocusNavigationAllowed({
    currentHref: "http://localhost/vi/notes/note-2",
    targetHref: "http://localhost/en/notes/note-2",
    openNoteIds: ["note-2"],
   }),
  ).toBe(true);
 });

 it("keeps inspector state limited to the active selection", () => {
  inspectorStore.actions.openInspector("你好", { lessonId: "lesson-1" });
  expect(inspectorStore.get()).toMatchObject({
   isOpen: true,
   selectedText: "你好",
   lessonId: "lesson-1",
  });

  inspectorStore.actions.closeInspector();
  expect(inspectorStore.get()).toEqual({
   isOpen: false,
   anchorRect: null,
   selectedText: "",
   lessonId: "",
  });
 });
});
