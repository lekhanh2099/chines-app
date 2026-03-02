"use client";

import { create } from "zustand";
import { containsChinese, extractChinese } from "@/lib/chinese-utils";
import { pinyin as getPinyin } from "pinyin-pro";
import { createClient } from "@/lib/supabase/client";
import { getVocabByHanzi } from "@/services/vocab.service";
import type { VocabData, AiAnalysis } from "@/types/database";

const RECENT_LOOKUPS_KEY = "recent-lookups";
const MAX_RECENT_LOOKUPS = 10;

function loadRecentLookups(): VocabData[] {
 if (typeof window === "undefined") return [];
 try {
  const stored = localStorage.getItem(RECENT_LOOKUPS_KEY);
  return stored ? JSON.parse(stored) : [];
 } catch {
  return [];
 }
}

function saveRecentLookups(lookups: VocabData[]) {
 if (typeof window === "undefined") return;
 try {
  localStorage.setItem(RECENT_LOOKUPS_KEY, JSON.stringify(lookups));
 } catch {
  // ignore
 }
}

type InspectorStore = {
 isOpen: boolean;
 selectedText: string;
 vocabData: VocabData | null;
 isLoading: boolean;
 recentLookups: VocabData[];
 openInspector: (text: string) => void;
 closeInspector: () => void;
 loadRecentLookups: () => void;
};

export const useInspectorStore = create<InspectorStore>((set, get) => ({
 isOpen: false,
 selectedText: "",
 vocabData: null,
 isLoading: false,
 recentLookups: [],

 loadRecentLookups: () => {
  set({ recentLookups: loadRecentLookups() });
 },

 openInspector: async (text: string) => {
  if (!containsChinese(text)) return;

  set({
   isOpen: true,
   selectedText: text,
   isLoading: true,
   vocabData: null,
  });

  const chineseText = extractChinese(text);
  if (!chineseText) {
   set({ isLoading: false });
   return;
  }

  const pinyinText = getPinyin(chineseText);
  const supabase = createClient();

  let resolvedVocab: VocabData;

  try {
   const vocab = await getVocabByHanzi(supabase, chineseText);

   if (vocab) {
    resolvedVocab = {
     id: vocab.id,
     hanzi: vocab.hanzi,
     pinyin: vocab.pinyin || pinyinText,
     meaning: vocab.meaning || "",
     ai_analysis: (vocab.ai_analysis || {}) as AiAnalysis,
    };
   } else {
    resolvedVocab = {
     hanzi: chineseText,
     pinyin: pinyinText,
     meaning: "",
     ai_analysis: {},
    };
   }
  } catch {
   resolvedVocab = {
    hanzi: chineseText,
    pinyin: pinyinText,
    meaning: "",
    ai_analysis: {},
   };
  }

  // Add to recent lookups (dedupe by hanzi, most recent first)
  const current = get().recentLookups;
  const filtered = current.filter((v) => v.hanzi !== resolvedVocab.hanzi);
  const updated = [resolvedVocab, ...filtered].slice(0, MAX_RECENT_LOOKUPS);
  saveRecentLookups(updated);

  set({
   vocabData: resolvedVocab,
   isLoading: false,
   recentLookups: updated,
  });
 },

 closeInspector: () => {
  set({
   isOpen: false,
   selectedText: "",
   vocabData: null,
   isLoading: false,
  });
 },
}));
