import { renderToStaticMarkup } from "react-dom/server";
import type { EffectCallback } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
 effects: new Array<EffectCallback>(),
 pathname: "/notes/note-a",
 replace: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
 const original = await importOriginal<typeof import("react")>();
 return {
  ...original,
  useEffect: (effect: EffectCallback) => {
   harness.effects.push(effect);
  },
 };
});
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("sonner", () => ({ toast: { warning: vi.fn() } }));
vi.mock("@/i18n/navigation", () => ({
 usePathname: () => harness.pathname,
 useRouter: () => ({ replace: harness.replace, push: vi.fn() }),
}));
vi.mock("@/features/notes/hooks/useNotesList", () => ({ useNotesList: () => ({ data: [] }) }));
vi.mock("@/features/notes/components/NoteEditorPanel", () => ({
 NoteEditorPanel: () => null,
}));
vi.mock("@/components/notes/NoteTabBar", () => ({ NoteTabBar: () => null }));

import { NoteTabContainer } from "./NoteTabContainer";
import { headerToolbarStore } from "@/stores/header-toolbar-store";
import { noteTabsStore } from "@/stores/note-tabs-store";

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

describe("NoteTabContainer route synchronization", () => {
 beforeEach(() => {
  harness.effects.length = 0;
  harness.replace.mockReset();
  const localStorage = createStorage();
  vi.stubGlobal("window", {
   addEventListener: vi.fn(),
   removeEventListener: vi.fn(),
   localStorage,
  });
  vi.stubGlobal("localStorage", localStorage);
  headerToolbarStore.setState(() => ({ content: null, ownerId: null }));
  noteTabsStore.setState(() => ({
   tabs: [{ noteId: "note-b", title: "Note B" }],
   activeNoteId: "note-b",
   hasHydrated: true,
  }));
 });

 it("does not navigate back to a stale active tab while opening a note route", () => {
  renderToStaticMarkup(<NoteTabContainer initialNoteId="note-a" initialTitle="Note A" />);

  for (const effect of harness.effects) effect();

  expect(noteTabsStore.get().activeNoteId).toBe("note-a");
  expect(harness.replace).not.toHaveBeenCalled();
 });

 it("still navigates when the user selects a different active tab", () => {
  renderToStaticMarkup(<NoteTabContainer />);

  for (const effect of harness.effects) effect();

  expect(harness.replace).toHaveBeenCalledOnce();
  expect(harness.replace).toHaveBeenCalledWith("/notes/note-b", { scroll: false });
 });
});
