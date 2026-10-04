"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 fetchPdfAnnotation,
 savePdfAnnotation,
 type PdfAnnotationQuery,
} from "./pdf-annotation-api";
import type { PdfStroke } from "./pdf-annotations";

export function usePdfAnnotations(input: PdfAnnotationQuery) {
 const { assetId, pageNumber } = input;
 const queryClient = useQueryClient();
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.readerPdfAnnotation(assetId, pageNumber),
  queryFn: () => fetchPdfAnnotation({ assetId, pageNumber }),
  staleTime: 0,
 });
 const revision = useRef(query.data?.revision ?? 0);
 const pending = useRef<PdfStroke[]>(null);
 const saving = useRef<Promise<void>>(null);
 const blocked = useRef(false);
 const disposed = useRef(false);
 const [local, setLocal] = useState<{ edited: boolean; strokes: PdfStroke[] }>({
  edited: false,
  strokes: [],
 });
 const [saveFailed, setSaveFailed] = useState(false);
 const [isSaving, setIsSaving] = useState(false);

 const flush = useCallback(async () => {
  if (saving.current) return saving.current;
  if (!query.isSuccess || blocked.current || disposed.current || pending.current === null) return;
  setIsSaving(true);
  const request = (async () => {
   try {
    while (pending.current !== null && !disposed.current) {
     const snapshot = pending.current;
     pending.current = null;
     try {
      const saved = await savePdfAnnotation({
       assetId,
       pageNumber,
       payload: { strokes: snapshot },
       expectedRevision: revision.current,
      });
      if (disposed.current) return;
      revision.current = saved.revision;
      queryClient.setQueryData(hanzihomeQueryKeys.readerPdfAnnotation(assetId, pageNumber), saved);
      setSaveFailed(false);
     } catch (error) {
      // A newer edit has priority over the failed in-flight snapshot.
      pending.current ??= snapshot;
      blocked.current = true;
      if (!disposed.current) setSaveFailed(true);
      throw error;
     }
    }
   } finally {
    saving.current = null;
    if (!disposed.current) setIsSaving(false);
   }
  })();
  saving.current = request;
  return request;
 }, [assetId, pageNumber, query.isSuccess, queryClient]);

 useEffect(() => {
  if (!query.isSuccess) return;
  revision.current = Math.max(revision.current, query.data?.revision ?? 0);
  void flush().catch(() => {});
 }, [flush, query.data, query.isSuccess]);

 useEffect(() => {
  disposed.current = false;
  return () => {
   disposed.current = true;
  };
 }, []);

 const replaceStrokes = useCallback(
  (strokes: PdfStroke[]) => {
   setLocal({ edited: true, strokes });
   pending.current = strokes;
   void flush().catch(() => {});
  },
  [flush],
 );

 const retrySave = useCallback(async () => {
  if (saving.current) await saving.current.catch(() => {});
  blocked.current = false;
  await flush();
 }, [flush]);

 return {
  strokes: local.edited ? local.strokes : (query.data?.payload.strokes ?? []),
  replaceStrokes,
  retrySave,
  saveFailed,
  isSaving,
  loadFailed: query.isError,
  retryLoad: query.refetch,
 };
}
