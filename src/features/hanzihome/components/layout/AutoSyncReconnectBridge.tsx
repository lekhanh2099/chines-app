"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { syncPendingReviewAttempts } from "@/features/hanzihome/local/review-attempt-outbox";
import { syncPendingReaderAnnotations } from "@/features/reading/services/reading-annotation-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";

export function AutoSyncReconnectBridge(): null {
 const queryClient = useQueryClient();
 const t = useTranslations("Common");

 useEffect(() => {
  if (typeof window === "undefined") return;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const handleOnline = () => {
   if (timeoutId) {
    clearTimeout(timeoutId);
   }

   timeoutId = setTimeout(async () => {
    try {
     const supabase = createClient();
     const user = await getClientSessionUser(supabase);
     if (user?.id) {
      const result = await syncPendingReviewAttempts(user.id);
      if (result.syncedCount > 0) {
       void queryClient.invalidateQueries({
        queryKey: hanzihomeQueryKeys.learningState(user.id),
       });
       void queryClient.invalidateQueries({
        queryKey: hanzihomeQueryKeys.catalogRoot,
       });
       toast.success(t("offlinePack.reconnectSyncSuccess", { count: result.syncedCount }));
      }

      const annotationResult = await syncPendingReaderAnnotations(user.id);
      if (annotationResult.syncedCount > 0) {
       void queryClient.invalidateQueries({
        queryKey: hanzihomeQueryKeys.readerAnnotations(user.id),
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

  return () => {
   if (timeoutId) {
    clearTimeout(timeoutId);
   }
   window.removeEventListener("online", handleOnline);
  };
 }, [queryClient, t]);

 return null;
}
