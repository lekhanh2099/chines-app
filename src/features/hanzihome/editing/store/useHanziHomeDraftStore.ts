"use client";

import { create } from "zustand";

import type { DraftPatch, EditableNodeRequest } from "./types";

type HanziHomeDraftStore = {
 editMode: boolean;
 patches: DraftPatch[];
 activeNode: EditableNodeRequest | null;
 setEditMode: (enabled: boolean) => void;
 openNode: (node: EditableNodeRequest) => void;
 closeNode: () => void;
 addPatch: (patch: DraftPatch) => void;
 removePatch: (patchId: string) => void;
 clearLessonDrafts: (lessonId: string) => void;
 getLessonPatches: (lessonId: string) => DraftPatch[];
};

export const useHanziHomeDraftStore = create<HanziHomeDraftStore>((set, get) => ({
 editMode: false,
 patches: [],
 activeNode: null,
 setEditMode: (editMode) =>
  set((state) => ({ editMode, activeNode: editMode ? state.activeNode : null })),
 openNode: (activeNode) => set({ activeNode }),
 closeNode: () => set({ activeNode: null }),
 addPatch: (patch) =>
  set((state) => ({
   patches: (() => {
    const existingPatch = state.patches.find(
     (current) =>
      current.lessonId === patch.lessonId &&
      current.entityType === patch.entityType &&
      current.entityId === patch.entityId &&
      current.op === patch.op &&
      current.path.length === patch.path.length &&
      current.path.every((segment, index) => segment === patch.path[index]),
    );

    return [
     ...state.patches.filter((current) => current.id !== existingPatch?.id),
     {
      ...patch,
      before: existingPatch?.before ?? patch.before,
     },
    ];
   })(),
  })),
 removePatch: (patchId) =>
  set((state) => ({
   patches: state.patches.filter((patch) => patch.id !== patchId),
  })),
 clearLessonDrafts: (lessonId) =>
  set((state) => ({
   patches: state.patches.filter((patch) => patch.lessonId !== lessonId),
  })),
 getLessonPatches: (lessonId) =>
  get().patches.filter((patch) => patch.lessonId === lessonId),
}));

export function getLessonPatches(lessonId: string) {
 return useHanziHomeDraftStore.getState().getLessonPatches(lessonId);
}
