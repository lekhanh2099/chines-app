"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 fetchPdfAnnotation,
 PdfAnnotationConflictError,
 type PdfAnnotationQuery,
} from "./pdf-annotation-api";
import {
 enqueuePdfAnnotation,
 flushPendingPdfAnnotation,
 getPendingPdfAnnotation,
 resolvePendingPdfAnnotationConflict,
} from "./pdf-annotation-outbox";
import type { PdfStroke } from "./pdf-annotations";

export function usePdfAnnotations(input: PdfAnnotationQuery) {
 const { assetId, pageNumber } = input;
 const { userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.readerPdfAnnotation(userId, assetId, pageNumber),
  queryFn: () => (userId ? fetchPdfAnnotation({ assetId, pageNumber }, userId) : null),
  enabled: isResolved && Boolean(userId),
  staleTime: 0,
 });
 const base = useRef({ revision: query.data?.revision ?? 0, absent: query.data === null });
 const writing = useRef(Promise.resolve());
 const saving = useRef<Promise<void>>(null);
 const blocked = useRef(false);
 const disposed = useRef(false);
 const editCount = useRef(0);
 const [restored, setRestored] = useState(false);
 const [local, setLocal] = useState<{ edited: boolean; strokes: PdfStroke[] }>({
  edited: false,
  strokes: [],
 });
 const [saveFailed, setSaveFailed] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [isQueued, setIsQueued] = useState(false);
 const [conflict, setConflict] = useState<{
  active: boolean;
  annotation: Awaited<ReturnType<typeof fetchPdfAnnotation>>;
 }>({ active: false, annotation: null });

 const flush = useCallback(async () => {
  if (saving.current) return saving.current;
  if (!userId || !query.isSuccess || blocked.current || disposed.current) return;
  setIsSaving(true);
  const request = (async () => {
   try {
    await writing.current;
    const saved = await flushPendingPdfAnnotation({ assetId, pageNumber }, userId);
    if (disposed.current) return;
    if (saved) {
     base.current = { revision: saved.revision, absent: false };
     queryClient.setQueryData(
      hanzihomeQueryKeys.readerPdfAnnotation(userId, assetId, pageNumber),
      saved,
     );
    }
    setIsQueued(Boolean(await getPendingPdfAnnotation({ assetId, pageNumber }, userId)));
    setSaveFailed(false);
   } catch (error) {
    blocked.current = true;
    if (!disposed.current) {
     setSaveFailed(true);
     if (error instanceof PdfAnnotationConflictError)
      setConflict({ active: true, annotation: error.annotation });
    }
    throw error;
   } finally {
    saving.current = null;
    if (!disposed.current) setIsSaving(false);
   }
  })();
  saving.current = request;
  return request;
 }, [assetId, pageNumber, query.isSuccess, queryClient, userId]);

 useEffect(() => {
  if (!userId) return;
  let active = true;
  const startingEdits = editCount.current;
  void getPendingPdfAnnotation({ assetId, pageNumber }, userId)
   .then((pending) => {
    if (!active) return;
    if (pending && startingEdits === editCount.current) {
     base.current.revision = pending.input.expectedRevision;
     if (pending.input.expectedAbsent !== undefined)
      base.current.absent = pending.input.expectedAbsent;
     setLocal({ edited: true, strokes: pending.input.payload.strokes });
     setIsQueued(true);
    }
    setRestored(true);
   })
   .catch(() => {
    if (active) setSaveFailed(true);
   });
  return () => {
   active = false;
  };
 }, [assetId, pageNumber, userId]);

 useEffect(() => {
  if (!query.isSuccess || !restored) return;
  if (!local.edited)
   base.current = { revision: query.data?.revision ?? 0, absent: query.data === null };
  void flush().catch(() => {});
  const retryOnReconnect = () => {
   if (conflict.active) return;
   blocked.current = false;
   void flush().catch(() => {});
  };
  window.addEventListener("online", retryOnReconnect);
  return () => window.removeEventListener("online", retryOnReconnect);
 }, [conflict.active, flush, local.edited, query.data, query.isSuccess, restored]);

 useEffect(() => {
  disposed.current = false;
  return () => {
   disposed.current = true;
  };
 }, []);

 const replaceStrokes = useCallback(
  (strokes: PdfStroke[]) => {
   if (!userId || !query.isSuccess || conflict.active) return;
   editCount.current += 1;
   setLocal({ edited: true, strokes });
   const committed = enqueuePdfAnnotation(
    {
     assetId,
     pageNumber,
     payload: { strokes },
     expectedRevision: base.current.revision,
     expectedAbsent: base.current.absent,
    },
    userId,
   );
   writing.current = committed;
   void committed
    .then(async () => {
     if (disposed.current) return;
     setIsQueued(true);
     if (saving.current) await saving.current.catch(() => {});
     await flush();
    })
    .catch(() => {
     if (!disposed.current) setSaveFailed(true);
    });
  },
  [assetId, conflict.active, flush, pageNumber, query.isSuccess, userId],
 );

 const retrySave = useCallback(async () => {
  if (conflict.active) return;
  if (saving.current) await saving.current.catch(() => {});
  blocked.current = false;
  await flush();
 }, [conflict.active, flush]);

 const resolveConflict = useCallback(
  async (useServer: boolean) => {
   if (!userId || !conflict.active || disposed.current) return;
   if (saving.current) await saving.current.catch(() => {});
   await writing.current;
   await resolvePendingPdfAnnotationConflict(
    { assetId, pageNumber },
    userId,
    { strokes: local.strokes },
    conflict.annotation,
    useServer,
   );
   if (disposed.current) return;
   base.current = {
    revision: conflict.annotation?.revision ?? 0,
    absent: conflict.annotation === null,
   };
   setConflict({ active: false, annotation: null });
   setSaveFailed(false);
   blocked.current = false;
   if (useServer) {
    queryClient.setQueryData(
     hanzihomeQueryKeys.readerPdfAnnotation(userId, assetId, pageNumber),
     conflict.annotation,
    );
    setLocal({ edited: false, strokes: [] });
    setIsQueued(false);
   } else await flush();
  },
  [assetId, conflict, flush, local.strokes, pageNumber, queryClient, userId],
 );

 return {
  strokes: local.edited ? local.strokes : (query.data?.payload.strokes ?? []),
  replaceStrokes,
  retrySave,
  conflict,
  resolveConflict,
  saveFailed,
  isSaving,
  isQueued,
  canEdit: Boolean(userId) && query.isSuccess && restored && !conflict.active,
  loadFailed: query.isError,
  retryLoad: query.refetch,
 };
}
