"use client";

import { create } from "zustand";
import { containsChinese, extractChinese } from "@/lib/chinese-utils";
import { pinyin as getPinyin } from "pinyin-pro";
import { createClient } from "@/lib/supabase/client";

export type VocabData = {
 id?: string;
 hanzi: string;
 pinyin: string;
 meaning: string;
 ai_analysis?: {
  han_viet?: string;
  etymology?: string;
  usage_logic?: string[];
  examples?: { zh: string; pinyin: string; vi: string }[];
  word_type?: string;
  collocations?: string[];
  vn_trap?: string;
 };
};

type InspectorStore = {
 isOpen: boolean;
 selectedText: string;
 vocabData: VocabData | null;
 isLoading: boolean;
 openInspector: (text: string) => void;
 closeInspector: () => void;
};

export const useInspectorStore = create<InspectorStore>((set) => ({
 isOpen: false,
 selectedText: "",
 vocabData: null,
 isLoading: false,

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

  try {
   const { data: vocab } = await supabase
    .from("vocabularies")
    .select("*")
    .eq("hanzi", chineseText)
    .single();

   if (vocab) {
    set({
     vocabData: {
      id: vocab.id,
      hanzi: vocab.hanzi,
      pinyin: vocab.pinyin || pinyinText,
      meaning: vocab.meaning || "",
      ai_analysis: vocab.ai_analysis || {},
     },
     isLoading: false,
    });
    return;
   }
  } catch {
   // fallthrough
  }

  set({
   vocabData: {
    hanzi: chineseText,
    pinyin: pinyinText,
    meaning: "",
    ai_analysis: {},
   },
   isLoading: false,
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
