"use client";

import { createStore } from "@tanstack/react-store";
import { getQueryClient } from "@/components/providers/QueryProvider";
import { dictionaryQueryKeys } from "@/features/dictionary/query-keys";
import { containsChinese, extractChinese } from "@/lib/chinese-utils";
import { logger } from "@/lib/logger";
import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";
import {
 getBasicVocabData,
 getVocabularyAnalysis,
 trackVocabLookup,
 getVocabByHanzi,
 classifyVocabType,
} from "@/services/vocab.service";
import { aiAnalysisSchema, VocabDataSchema } from "@/types/database";
import type { VocabData, VocabWithProgress } from "@/types/database";

const RECENT_LOOKUPS_KEY = "recent-lookups";
const MAX_RECENT_LOOKUPS = 10;
const MAX_INSPECTOR_CACHE_ITEMS = 80;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

const BasicLookupResponseSchema = z.object({
 data: z
  .object({
   id: z.string().optional(),
   dictionary_id: z.string().optional(),
   hanzi: z.string().optional(),
   pinyin: z.string().optional(),
   sino_vietnamese: z.string().nullable().optional(),
   meaning: z.string().optional(),
   analysis: aiAnalysisSchema.optional(),
   ai_analysis: aiAnalysisSchema.optional(),
  })
  .optional(),
});

type InspectorCacheEntry = {
 vocab: VocabData;
 cachedAt: number;
};

export type InspectorOpenOptions = {
 lessonId?: string;
 anchorRect?: DOMRect;
};

const inspectorVocabCache = new Map<string, InspectorCacheEntry>();

let activeLookupRequestId = 0;
let activeBasicRequestController: Nullable<AbortController> = null;

function getLookupCacheKey(text: string, lessonId?: string): string {
 const normalizedText = extractChinese(text).trim();
 return normalizedText ? `${lessonId || "global"}:${normalizedText}` : "";
}

function setCachedVocab(text: string, vocab: VocabData, lessonId?: string) {
 const key = getLookupCacheKey(text || vocab.hanzi, lessonId);
 if (!key) return;

 inspectorVocabCache.delete(key);
 inspectorVocabCache.set(key, {
  vocab,
  cachedAt: Date.now(),
 });

 if (inspectorVocabCache.size <= MAX_INSPECTOR_CACHE_ITEMS) {
  return;
 }

 const oldestKey = inspectorVocabCache.keys().next().value;
 if (oldestKey) {
  inspectorVocabCache.delete(oldestKey);
 }
}

function getCachedVocab(text: string, lessonId?: string): Nullable<InspectorCacheEntry> {
 const key = getLookupCacheKey(text, lessonId);
 if (!key) return null;

 const inMemory = inspectorVocabCache.get(key);
 if (inMemory) {
  // Evict if expired
  if (Date.now() - inMemory.cachedAt > CACHE_TTL_MS) {
   inspectorVocabCache.delete(key);
  } else {
   const normalizedVocab = getBasicVocabData(inMemory.vocab);
   if (normalizedVocab.meaning.trim()) {
    setCachedVocab(text, normalizedVocab, lessonId);
    return inspectorVocabCache.get(key) || null;
   }
   inspectorVocabCache.delete(key);
  }
 }

 if (lessonId) return null;

 const normalizedText = extractChinese(text).trim();
 const recentMatch = loadRecentLookups().find((item) => item.hanzi === normalizedText);
 if (!recentMatch) {
  return null;
 }

 const normalizedRecentMatch = getBasicVocabData(recentMatch);
 if (!normalizedRecentMatch.meaning.trim()) {
  return null;
 }

 setCachedVocab(text, normalizedRecentMatch);
 return inspectorVocabCache.get(key) || null;
}

function loadRecentLookups(): VocabData[] {
 if (typeof window === "undefined") return [];
 try {
  const stored = localStorage.getItem(RECENT_LOOKUPS_KEY);
  if (!stored) return [];
  const parsed = VocabDataSchema.array().safeParse(JSON.parse(stored));
  return parsed.success ? parsed.data : [];
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
 lessonId?: string,
): VocabData[] {
 const source = current.length > 0 ? current : fallbackRecent || [];
 const filtered = source.filter((item) => item.hanzi !== vocab.hanzi);
 const updated = [vocab, ...filtered].slice(0, MAX_RECENT_LOOKUPS);

 saveRecentLookups(updated);
 setCachedVocab(vocab.hanzi, vocab, lessonId);

 return updated;
}

function abortLookupRequests() {
 activeBasicRequestController?.abort();
 activeBasicRequestController = null;
}

function parseLookupResponse(
 payload: z.infer<typeof BasicLookupResponseSchema>,
): Nullable<VocabData> {
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
  ai_analysis: payload.data.analysis || payload.data.ai_analysis || {},
 };
}

function hasTrackableLookupData(vocabData: VocabData): boolean {
 return !!(vocabData.hanzi && (vocabData.pinyin || vocabData.meaning || vocabData.sino_vietnamese));
}

function buildTrackedVocabListItem(vocabData: VocabData): Nullable<VocabWithProgress> {
 if (!vocabData.id) {
  return null;
 }

 return {
  id: vocabData.id,
  hanzi: vocabData.hanzi,
  pinyin: vocabData.pinyin,
  meaning: vocabData.meaning,
  ai_analysis: vocabData.ai_analysis || {},
  proficiency_level: 0,
  is_favorited: false,
  status: "new",
  type: classifyVocabType(vocabData.hanzi, vocabData.pinyin),
 };
}

type InspectorStore = {
 isOpen: boolean;
 anchorRect: Nullable<DOMRect>;
 selectedText: string;
 vocabData: Nullable<VocabData>;
 isLoading: boolean;
 recentLookups: VocabData[];
};

export const inspectorStore = createStore<
 InspectorStore,
 {
  openInspector: (text: string, options?: InspectorOpenOptions) => Promise<void>;
  closeInspector: () => void;
  loadRecentLookups: () => void;
 }
>(
 {
  isOpen: false,
  anchorRect: null,
  selectedText: "",
  vocabData: null,
  isLoading: false,
  recentLookups: [],
 },
 ({ setState, get }) => ({
  loadRecentLookups: () => {
   const recentLookups = loadRecentLookups();
   recentLookups.forEach((item) => setCachedVocab(item.hanzi, item));
   setState((state) => ({ ...state, recentLookups }));
  },

  openInspector: async (text: string, options = {}) => {
   if (!containsChinese(text)) return;

   const chineseText = extractChinese(text);
   if (!chineseText) {
    return;
   }

   const queryClient = getQueryClient();

   const trackLookupInBackground = async (vocabData: VocabData) => {
    if (!hasTrackableLookupData(vocabData)) {
     return;
    }

    try {
     const { createClient } = await import("@/lib/supabase/client");
     const supabase = createClient();
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

     queryClient.setQueryData<VocabWithProgress[]>(dictionaryQueryKeys.vocabListRoot, (current) => {
      const existing = current || [];
      const withoutDuplicate = existing.filter((item) => item.id !== listItem.id);
      return [listItem, ...withoutDuplicate];
     });
    } catch (error) {
     logger.error("[InspectorStore] track lookup failed:", error);
    }
   };

   activeLookupRequestId += 1;
   const requestId = activeLookupRequestId;
   abortLookupRequests();

   const cachedVocab = getCachedVocab(chineseText, options.lessonId);
   if (cachedVocab) {
    const updatedRecent = updateRecentLookups(
     get().recentLookups,
     cachedVocab.vocab,
     loadRecentLookups(),
     options.lessonId,
    );

    setState((state) => ({
     ...state,
     isOpen: true,
     anchorRect: options.anchorRect || get().anchorRect,
     selectedText: chineseText,
     isLoading: false,
     vocabData: cachedVocab.vocab,
     recentLookups: updatedRecent,
    }));

    void trackLookupInBackground(cachedVocab.vocab);
    return;
   }

   setState((state) => ({
    ...state,
    isOpen: true,
    anchorRect: options.anchorRect || get().anchorRect,
    selectedText: chineseText,
    isLoading: true,
    vocabData: null,
   }));

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
      lessonId: options.lessonId,
     }),
     signal: basicController.signal,
    });

    const lookupJson = BasicLookupResponseSchema.safeParse(await lookupResponse.json());
    const parsedVocab = lookupJson.success ? parseLookupResponse(lookupJson.data) : null;

    if (lookupResponse.ok && parsedVocab) {
     resolvedVocab = getBasicVocabData({
      ...parsedVocab,
      pinyin: parsedVocab.pinyin || pinyinText,
     });
    } else {
     const { createClient } = await import("@/lib/supabase/client");
     const supabase = createClient();
     const vocab = await getVocabByHanzi(supabase, chineseText);

     if (vocab) {
      resolvedVocab = getBasicVocabData({
       id: vocab.id,
       hanzi: vocab.hanzi,
       pinyin: vocab.pinyin || pinyinText,
       sino_vietnamese: vocab.sino_vietnamese || undefined,
       meaning: vocab.meaning || "",
       ai_analysis: getVocabularyAnalysis(vocab),
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
    options.lessonId,
   );

   setState((state) => ({
    ...state,
    vocabData: resolvedVocab,
    isLoading: false,
    recentLookups: updated,
   }));

   void trackLookupInBackground(resolvedVocab);
  },

  closeInspector: () => {
   activeLookupRequestId += 1;
   abortLookupRequests();
   setState((state) => ({
    ...state,
    isOpen: false,
    anchorRect: null,
    selectedText: "",
    vocabData: null,
    isLoading: false,
   }));
  },
 }),
);
