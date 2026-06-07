"use client";

import { create } from "zustand";

import type { DraftPatch, EditableNodeRequest } from "./types";

type HanziHomeDraftStore = {
 editMode: boolean;
 patches: DraftPatch[];
 skippedPatchIdsByLesson: Record<string, string[]>;
 activeNode: EditableNodeRequest | null;
 setEditMode: (enabled: boolean) => void;
 openNode: (node: EditableNodeRequest) => void;
 closeNode: () => void;
 addPatch: (patch: DraftPatch) => void;
 removePatch: (patchId: string) => void;
 clearLessonDrafts: (lessonId: string) => void;
 setSkippedPatchIds: (lessonId: string, patchIds: string[]) => void;
 getSkippedPatchIds: (lessonId: string) => string[];
 getLessonPatches: (lessonId: string) => DraftPatch[];
};

export const useHanziHomeDraftStore = create<HanziHomeDraftStore>((set, get) => ({
 editMode: false,
 patches: [],
 skippedPatchIdsByLesson: {},
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
   skippedPatchIdsByLesson: Object.fromEntries(
    Object.entries(state.skippedPatchIdsByLesson).map(([lessonId, patchIds]) => [
     lessonId,
     patchIds.filter((id) => id !== patchId),
    ]),
   ),
  })),
 clearLessonDrafts: (lessonId) =>
  set((state) => ({
   patches: state.patches.filter((patch) => patch.lessonId !== lessonId),
   skippedPatchIdsByLesson: {
    ...state.skippedPatchIdsByLesson,
    [lessonId]: [],
   },
  })),
 setSkippedPatchIds: (lessonId, patchIds) =>
  set((state) => {
   const current = state.skippedPatchIdsByLesson[lessonId] ?? [];
   const next = [...new Set(patchIds)];
   const unchanged =
    current.length === next.length &&
    current.every((patchId, index) => patchId === next[index]);

   if (unchanged) return state;

   return {
    skippedPatchIdsByLesson: {
     ...state.skippedPatchIdsByLesson,
     [lessonId]: next,
    },
   };
  }),
 getSkippedPatchIds: (lessonId) =>
  get().skippedPatchIdsByLesson[lessonId] ?? [],
 getLessonPatches: (lessonId) =>
  get().patches.filter((patch) => patch.lessonId === lessonId),
}));

export function getLessonPatches(lessonId: string) {
 return useHanziHomeDraftStore.getState().getLessonPatches(lessonId);
}
