"use client";

import { createStore } from "@tanstack/react-store";
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
};

export const vocabDetailDrawerStore = createStore<
 VocabDetailDrawerStore,
 {
  openDetailDrawer: (payload: OpenDetailPayload) => void;
  closeDetailDrawer: () => void;
 }
>(
 {
  isOpen: false,
  text: "",
  contextSentence: "",
  mode: "word",
 },
 ({ setState }) => ({
  openDetailDrawer: ({ text, contextSentence, mode = "word" }) => {
   const trimmedText = text.trim();
   setState(() => ({
    isOpen: !!trimmedText,
    text: trimmedText,
    contextSentence: contextSentence?.trim() || trimmedText,
    mode,
   }));
  },
  closeDetailDrawer: () => {
   setState(() => ({
    isOpen: false,
    text: "",
    contextSentence: "",
    mode: "word",
   }));
  },
 }),
);
