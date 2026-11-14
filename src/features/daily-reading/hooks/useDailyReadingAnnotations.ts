"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { fetchReaderAnnotations } from "@/features/reading/services/reading-annotation-api";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import type { findDailyReading } from "@/features/daily-reading/components/daily-reading-library-utils";

type DailyReadingSelectionOptions = Omit<
 Parameters<typeof useReaderSelectionActions>[0],
 "setSaveError"
>;

/**
 * Owns the reader annotations query for a Daily Reading article, the
 * annotation save-error toast and the reader selection actions that write it.
 */
export function useDailyReadingAnnotations({
 reading,
 selectionOptions,
}: {
 reading: ReturnType<typeof findDailyReading>;
 selectionOptions: DailyReadingSelectionOptions;
}) {
 const { userId, isResolved } = useClientSession();
 const [annotationError, setAnnotationError] = useState("");

 const annotationsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerAnnotations(userId, reading?.id ?? ""),
  queryFn: () => (reading ? fetchReaderAnnotations(userId, reading.id) : []),
  enabled: isResolved && Boolean(userId) && Boolean(reading),
  staleTime: 60_000,
 });

 useEffect(() => {
  if (annotationError) {
   toast.error(annotationError);
  }
 }, [annotationError]);

 const selection = useReaderSelectionActions({
  ...selectionOptions,
  setSaveError: setAnnotationError,
 });

 return { annotationsQuery, selection };
}
