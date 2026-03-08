"use client";

import { create } from "zustand";
import { getQueryClient } from "@/components/providers/QueryProvider";
import { containsChinese, extractChinese } from "@/lib/chinese-utils";
import { pinyin as getPinyin } from "pinyin-pro";
import { createClient } from "@/lib/supabase/client";
import {
 getBasicVocabData,
 trackVocabLookup,
 getVocabByHanzi,
 hasInspectorDeepDiveData,
} from "@/services/vocab.service";
import type {
 VocabData,
 AiAnalysis,
 VocabWithProgress,
} from "@/types/database";

const RECENT_LOOKUPS_KEY = "recent-lookups";
const MAX_RECENT_LOOKUPS = 10;
const MAX_INSPECTOR_CACHE_ITEMS = 80;

type InspectorCacheEntry = {
 vocab: VocabData;
 hasDeepData: boolean;
};

const inspectorVocabCache = new Map<string, InspectorCacheEntry>();

let activeLookupRequestId = 0;
let activeBasicRequestController: AbortController | null = null;
let activeDeepRequestController: AbortController | null = null;

function getLookupCacheKey(text: string): string {
 return extractChinese(text).trim();
}

function setCachedVocab(text: string, vocab: VocabData) {
 const key = getLookupCacheKey(text || vocab.hanzi);
 if (!key) return;

 inspectorVocabCache.delete(key);
 inspectorVocabCache.set(key, {
  vocab,
  hasDeepData: hasInspectorDeepDiveData(vocab.ai_analysis),
 });

 if (inspectorVocabCache.size <= MAX_INSPECTOR_CACHE_ITEMS) {
  return;
 }

 const oldestKey = inspectorVocabCache.keys().next().value;
 if (oldestKey) {
  inspectorVocabCache.delete(oldestKey);
 }
}

function getCachedVocab(text: string): InspectorCacheEntry | null {
 const key = getLookupCacheKey(text);
 if (!key) return null;

 const inMemory = inspectorVocabCache.get(key);
 if (inMemory) {
  setCachedVocab(key, inMemory.vocab);
  return inMemory;
 }

 const recentMatch = loadRecentLookups().find((item) => item.hanzi === key);
 if (!recentMatch) {
  return null;
 }

 setCachedVocab(key, recentMatch);
 return inspectorVocabCache.get(key) || null;
}

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

function updateRecentLookups(
 current: VocabData[],
 vocab: VocabData,
 fallbackRecent?: VocabData[],
): VocabData[] {
 const source = current.length > 0 ? current : fallbackRecent || [];
 const filtered = source.filter((item) => item.hanzi !== vocab.hanzi);
 const updated = [vocab, ...filtered].slice(0, MAX_RECENT_LOOKUPS);

 saveRecentLookups(updated);
 setCachedVocab(vocab.hanzi, vocab);

 return updated;
}

function mergeVocabData(
 current: VocabData | null,
 incoming: VocabData,
): VocabData {
 return {
  ...(current || {}),
  ...incoming,
  id: incoming.id || current?.id,
  dictionary_id: incoming.dictionary_id || current?.dictionary_id,
  hanzi: incoming.hanzi || current?.hanzi || "",
  pinyin: incoming.pinyin || current?.pinyin || "",
  sino_vietnamese: incoming.sino_vietnamese || current?.sino_vietnamese,
  meaning: incoming.meaning || current?.meaning || "",
  ai_analysis: {
   ...(current?.ai_analysis || {}),
   ...(incoming.ai_analysis || {}),
  },
 };
}

function abortLookupRequests() {
 activeBasicRequestController?.abort();
 activeBasicRequestController = null;
 activeDeepRequestController?.abort();
 activeDeepRequestController = null;
}

function parseLookupResponse(payload: {
 data?: {
  id?: string;
  dictionary_id?: string;
  hanzi?: string;
  pinyin?: string;
  sino_vietnamese?: string | null;
  meaning?: string;
  analysis?: AiAnalysis;
  ai_analysis?: AiAnalysis;
 };
}): VocabData | null {
 if (!payload.data?.hanzi) {
  return null;
 }

 return {
  id: payload.data.id,
  dictionary_id: payload.data.dictionary_id,
  hanzi: payload.data.hanzi,
  pinyin: payload.data.pinyin || "",
  sino_vietnamese: payload.data.sino_vietnamese || undefined,
  meaning: payload.data.meaning || "",
  ai_analysis: (payload.data.analysis ||
   payload.data.ai_analysis ||
   {}) as AiAnalysis,
 };
}

function hasTrackableLookupData(vocabData: VocabData): boolean {
 return !!(
  vocabData.hanzi &&
  (vocabData.pinyin || vocabData.meaning || vocabData.sino_vietnamese)
 );
}

function buildTrackedVocabListItem(
 vocabData: VocabData,
): VocabWithProgress | null {
 if (!vocabData.id) {
  return null;
 }

 return {
  id: vocabData.id,
  hanzi: vocabData.hanzi,
  pinyin: vocabData.pinyin,
  meaning: vocabData.meaning,
  ai_analysis: (vocabData.ai_analysis || {}) as AiAnalysis,
  proficiency_level: 0,
  is_favorited: false,
  status: "new",
 };
}

type InspectorStore = {
 isOpen: boolean;
 selectedText: string;
 vocabData: VocabData | null;
 isLoading: boolean;
 isDeepLoading: boolean;
 deepError: string | null;
 recentLookups: VocabData[];
 openInspector: (text: string) => Promise<void>;
 closeInspector: () => void;
 loadRecentLookups: () => void;
};

export const useInspectorStore = create<InspectorStore>((set, get) => ({
 isOpen: false,
 selectedText: "",
 vocabData: null,
 isLoading: false,
 isDeepLoading: false,
 deepError: null,
 recentLookups: [],

 loadRecentLookups: () => {
  const recentLookups = loadRecentLookups();
  recentLookups.forEach((item) => setCachedVocab(item.hanzi, item));
  set({ recentLookups });
 },

 openInspector: async (text: string) => {
  if (!containsChinese(text)) return;

  const chineseText = extractChinese(text);
  if (!chineseText) {
   return;
  }

  const supabase = createClient();
  const queryClient = getQueryClient();

  const trackLookupInBackground = async (vocabData: VocabData) => {
   if (!hasTrackableLookupData(vocabData)) {
    return;
   }

   try {
    const {
     data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) {
     return;
    }

    const tracked = await trackVocabLookup(supabase, userId, { ...vocabData });
    if (!tracked?.vocabId) {
     return;
    }

    const trackedVocabData: VocabData = {
     ...vocabData,
     id: tracked.vocabId,
     dictionary_id: tracked.dictionaryId || vocabData.dictionary_id,
    };
    const listItem = buildTrackedVocabListItem(trackedVocabData);
    if (!listItem) {
     return;
    }

    queryClient.setQueryData<VocabWithProgress[]>(["vocab-list"], (current) => {
     const existing = current || [];
     const withoutDuplicate = existing.filter(
      (item) => item.id !== listItem.id,
     );
     return [listItem, ...withoutDuplicate];
    });
   } catch (error) {
    console.error("[InspectorStore] track lookup failed:", error);
   }
  };

  activeLookupRequestId += 1;
  const requestId = activeLookupRequestId;
  abortLookupRequests();

  const startDeepLookup = async () => {
   const deepController = new AbortController();
   activeDeepRequestController = deepController;

   try {
    const deepResponse = await fetch("/api/lookup/deep", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ text: chineseText }),
     signal: deepController.signal,
    });

    const deepJson = (await deepResponse.json()) as {
     data?: {
      id?: string;
      dictionary_id?: string;
      hanzi?: string;
      pinyin?: string;
      sino_vietnamese?: string | null;
      meaning?: string;
      analysis?: AiAnalysis;
      ai_analysis?: AiAnalysis;
     };
     error?: string;
    };

    if (requestId !== activeLookupRequestId) {
     return;
    }

    const deepVocab = parseLookupResponse(deepJson);
    if (!deepResponse.ok || !deepVocab) {
     set({
      isDeepLoading: false,
      deepError: deepJson.error || "Không thể tải phân tích sâu lúc này.",
     });
     return;
    }

    const mergedVocab = mergeVocabData(get().vocabData, deepVocab);
    const updatedRecent = updateRecentLookups(
     get().recentLookups,
     mergedVocab,
     loadRecentLookups(),
    );

    set({
     vocabData: mergedVocab,
     isDeepLoading: false,
     deepError: null,
     recentLookups: updatedRecent,
    });
   } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
     return;
    }

    if (requestId !== activeLookupRequestId) {
     return;
    }

    set({
     isDeepLoading: false,
     deepError: "Không thể tải phân tích sâu lúc này.",
    });
   } finally {
    if (activeDeepRequestController === deepController) {
     activeDeepRequestController = null;
    }
   }
  };

  const cachedVocab = getCachedVocab(chineseText);
  if (cachedVocab) {
   const updatedRecent = updateRecentLookups(
    get().recentLookups,
    cachedVocab.vocab,
    loadRecentLookups(),
   );

   set({
    isOpen: true,
    selectedText: chineseText,
    isLoading: false,
    isDeepLoading: !cachedVocab.hasDeepData,
    deepError: null,
    vocabData: cachedVocab.vocab,
    recentLookups: updatedRecent,
   });

   if (!cachedVocab.hasDeepData) {
    void startDeepLookup();
   }

   void trackLookupInBackground(cachedVocab.vocab);
   return;
  }

  set({
   isOpen: true,
   selectedText: chineseText,
   isLoading: true,
   isDeepLoading: false,
   deepError: null,
   vocabData: null,
  });

  const pinyinText = getPinyin(chineseText);
  const basicController = new AbortController();
  activeBasicRequestController = basicController;

  let resolvedVocab: VocabData;

  try {
   const lookupResponse = await fetch("/api/lookup/basic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     text: chineseText,
    }),
    signal: basicController.signal,
   });

   const lookupJson = (await lookupResponse.json()) as {
    data?: {
     id?: string;
     dictionary_id?: string;
     hanzi?: string;
     pinyin?: string;
     sino_vietnamese?: string | null;
     meaning?: string;
     analysis?: AiAnalysis;
     ai_analysis?: AiAnalysis;
    };
   };

   const parsedVocab = parseLookupResponse(lookupJson);

   if (lookupResponse.ok && parsedVocab) {
    resolvedVocab = getBasicVocabData({
     ...parsedVocab,
     pinyin: parsedVocab.pinyin || pinyinText,
    });
   } else {
    const vocab = await getVocabByHanzi(supabase, chineseText);

    if (vocab) {
     resolvedVocab = getBasicVocabData({
      id: vocab.id,
      hanzi: vocab.hanzi,
      pinyin: vocab.pinyin || pinyinText,
      sino_vietnamese: vocab.sino_vietnamese || undefined,
      meaning: vocab.meaning || "",
      ai_analysis: (vocab.ai_analysis || {}) as AiAnalysis,
     });
    } else {
     resolvedVocab = getBasicVocabData({
      hanzi: chineseText,
      pinyin: pinyinText,
      meaning: "",
      ai_analysis: {},
     });
    }
   }
  } catch (error) {
   if (error instanceof DOMException && error.name === "AbortError") {
    return;
   }

   resolvedVocab = getBasicVocabData({
    hanzi: chineseText,
    pinyin: pinyinText,
    meaning: "",
    ai_analysis: {},
   });
  } finally {
   if (activeBasicRequestController === basicController) {
    activeBasicRequestController = null;
   }
  }

  if (requestId !== activeLookupRequestId) {
   return;
  }

  const updated = updateRecentLookups(
   get().recentLookups,
   resolvedVocab,
   loadRecentLookups(),
  );

  set({
   vocabData: resolvedVocab,
   isLoading: false,
   isDeepLoading: true,
   deepError: null,
   recentLookups: updated,
  });

  void trackLookupInBackground(resolvedVocab);
  void startDeepLookup();
 },

 closeInspector: () => {
  activeLookupRequestId += 1;
  abortLookupRequests();
  set({
   isOpen: false,
   selectedText: "",
   vocabData: null,
   isLoading: false,
   isDeepLoading: false,
   deepError: null,
  });
 },
}));
