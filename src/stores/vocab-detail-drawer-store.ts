"use client";

import { create } from "zustand";
import type { SmartSelectionMode } from "@/types/database";

type OpenDetailPayload = {
 text: string;
 contextSentence?: string;
 mode?: SmartSelectionMode;
};

type VocabDetailDrawerStore = {
 isOpen: boolean;
 text: string;
 contextSentence: string;
 mode: SmartSelectionMode;
 openDetailDrawer: (payload: OpenDetailPayload) => void;
 closeDetailDrawer: () => void;
};

export const useVocabDetailDrawerStore = create<VocabDetailDrawerStore>(
 (set) => ({
  isOpen: false,
  text: "",
  contextSentence: "",
  mode: "word",
  openDetailDrawer: ({ text, contextSentence, mode = "word" }) => {
   const trimmedText = text.trim();
   set({
    isOpen: !!trimmedText,
    text: trimmedText,
    contextSentence: contextSentence?.trim() || trimmedText,
    mode,
   });
  },
  closeDetailDrawer: () => {
   set({
    isOpen: false,
    text: "",
    contextSentence: "",
    mode: "word",
   });
  },
 }),
);
