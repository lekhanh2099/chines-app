"use client";

import { useQuery } from "@tanstack/react-query";
import { useClientSession } from "@/components/providers/QueryProvider";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import { fetchReaderAnnotations } from "@/features/reading/services/reading-annotation-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

export function useBusinessChineseReaderAnnotations(documentId: ReaderDocumentModel["id"]) {
 const { userId, isResolved } = useClientSession();
 return useQuery({
  queryKey: hanzihomeQueryKeys.readerAnnotations(userId, documentId),
  queryFn: () => fetchReaderAnnotations(userId, documentId),
  enabled: isResolved && Boolean(userId),
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
}
