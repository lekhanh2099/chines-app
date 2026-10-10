"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useClientSession } from "@/components/providers/QueryProvider";
import { dictionaryQueryKeys } from "@/features/dictionary/query-keys";
import { syncPendingDictionarySrs } from "@/features/dictionary/dictionary-srs-outbox";
import { syncPendingReviewAttempts } from "@/features/hanzihome/local/review-attempt-outbox";
import { syncPendingPdfAnnotations } from "@/features/reading/pdf/pdf-annotation-outbox";
import { syncPendingReaderAnnotations } from "@/features/reading/services/reading-annotation-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

export function AutoSyncReconnectBridge(): null {
 const queryClient = useQueryClient();
 const { userId, isResolved } = useClientSession();
 const t = useTranslations("Common");

 useEffect(() => {
  if (typeof window === "undefined" || !isResolved || !userId) return;

  let active = true;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const handleOnline = () => {
   if (timeoutId) {
    clearTimeout(timeoutId);
   }

   timeoutId = setTimeout(async () => {
    try {
     if (active && navigator.onLine) {
      const result = await syncPendingReviewAttempts(userId);
      if (!active) return;
      if (result.syncedCount > 0) {
       void queryClient.invalidateQueries({
        queryKey: hanzihomeQueryKeys.learningState(userId),
       });
       void queryClient.invalidateQueries({
        queryKey: hanzihomeQueryKeys.catalogRoot,
       });
       toast.success(t("offlinePack.reconnectSyncSuccess", { count: result.syncedCount }));
      }

      const annotationResult = await syncPendingReaderAnnotations(userId);
      if (!active) return;
      if (annotationResult.syncedCount > 0) {
       void queryClient.invalidateQueries({
        queryKey: hanzihomeQueryKeys.readerAnnotations(userId),
       });
      }

      const savedWords = await syncPendingDictionarySrs(userId);
      if (!active) return;
      if (savedWords > 0) {
       void queryClient.invalidateQueries({ queryKey: dictionaryQueryKeys.vocabListRoot(userId) });
       void queryClient.invalidateQueries({ queryKey: ["vocab-detail", userId] });
       void queryClient.invalidateQueries({ queryKey: ["editor-smart-selection", userId] });
      }

      const savedPdfPages = await syncPendingPdfAnnotations(userId);
      if (!active) return;
      if (savedPdfPages > 0) {
       void queryClient.invalidateQueries({
        queryKey: hanzihomeQueryKeys.readerPdfAnnotations(userId),
       });
      }

      // Revalidate active on-screen lesson resources that may have hydrated from an offline snapshot
      void queryClient.invalidateQueries({
       predicate: (query) => {
        const key = query.queryKey;
        return (
         Array.isArray(key) &&
         key[0] === "hanzihome" &&
         (key[1] === "lesson-detail" || key[1] === "lesson-resource")
        );
       },
       refetchType: "active",
      });
     }
    } catch {
     // Non-fatal background sync
    }
   }, 1500);
  };

  window.addEventListener("online", handleOnline);
  handleOnline();

  return () => {
   active = false;
   if (timeoutId) {
    clearTimeout(timeoutId);
   }
   window.removeEventListener("online", handleOnline);
  };
 }, [isResolved, queryClient, t, userId]);

 return null;
}
