import { z } from "zod";

import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/storage/versioned-storage";

export const noteLibraryViewSchema = z.enum(["grid", "list"]);
export type NoteLibraryView = z.output<typeof noteLibraryViewSchema>;

const storageConfig = {
 key: "notes-library-view",
 version: 1,
 schema: noteLibraryViewSchema,
 fallback: noteLibraryViewSchema.enum.grid,
};

/** This viewer's grid/list choice for the notes library (a per-device convenience). */
export function readNoteLibraryView(): NoteLibraryView {
 return readVersionedStorage(getBrowserStorage(), storageConfig);
}

function writeNoteLibraryView(view: NoteLibraryView) {
 writeVersionedStorage(getBrowserStorage(), storageConfig, view);
}

const listeners = new Set<() => void>();

export function subscribeNoteLibraryView(listener: () => void) {
 listeners.add(listener);
 return () => {
  listeners.delete(listener);
 };
}

export function setNoteLibraryView(view: NoteLibraryView) {
 writeNoteLibraryView(view);
 for (const listener of listeners) listener();
}
