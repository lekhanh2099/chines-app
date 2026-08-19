"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";

import { hanzihomeQueryKeys } from "../../query-keys";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { createClient } from "@/lib/supabase/client";
import type { ReaderDocumentResource } from "../reader-content-api";
import {
 fetchDailyReadingState,
 fetchPersonalLearningState,
 fetchReaderState,
 ReaderProgressConflictError,
 saveDailyReadingState,
 savePersonalLearningState,
 saveReaderProgress,
} from "../reader-state-api";
import { readerFeatureStateSchema } from "../reader-state.schemas";
import {
 createReaderAutosaveController,
 hasPendingReaderStateChange,
 readerFeatureStateEqual,
 type ReaderAutosaveController,
 type ReaderFeatureState,
} from "../reader-session";

export type ReaderProgressOwner = "reader" | "daily" | "personal";

const DEFAULT_FEATURE_STATE: ReaderFeatureState = {
 completed: false,
 answers: {},
};

function metadataString(resource: ReaderDocumentResource, key: string) {
 const value = resource.document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

export function useReaderProgressState(
 resource: ReaderDocumentResource,
 stateOwner: ReaderProgressOwner,
) {
 const stateIdentity = `${stateOwner}:${resource.document.id}`;
 const [localState, setLocalState] = useState<{
  identity: string;
  value: ReaderFeatureState | null;
 }>(() => ({ identity: stateIdentity, value: null }));
 const [saveError, setSaveError] = useState("");
 const revisionRef = useRef(0);
 const saveQueueRef = useRef(Promise.resolve());
 const changeVersionRef = useRef(0);
 const persistedVersionRef = useRef(0);
 const persistedSnapshotRef = useRef<ReaderFeatureState | null>(null);
 const latestScheduledRef = useRef<{ snapshot: ReaderFeatureState; version: number } | null>(null);
 const autosaveRef = useRef<ReaderAutosaveController | null>(null);
 const supabase = useMemo(() => createClient(), []);
 const sessionQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerSessionUser,
  queryFn: () => getClientSessionUser(supabase),
  staleTime: 60_000,
 });
 const hasSession = sessionQuery.data !== null && sessionQuery.data !== undefined;
 const dailyPublishedDate =
  stateOwner === "daily" ? metadataString(resource, "published_date") : null;
 const personalNodeId =
  stateOwner === "personal" ? metadataString(resource, "knowledge_node_id") : null;
 const readerStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerState(resource.document.id),
  queryFn: () => fetchReaderState(resource.document.id),
  enabled: hasSession && stateOwner === "reader",
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const dailyStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerDailyState(dailyPublishedDate ?? ""),
  queryFn: () => fetchDailyReadingState(dailyPublishedDate ?? ""),
  enabled: hasSession && stateOwner === "daily" && dailyPublishedDate !== null,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const personalStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerPersonalState(personalNodeId ?? ""),
  queryFn: () => fetchPersonalLearningState(personalNodeId ?? ""),
  enabled: hasSession && stateOwner === "personal" && personalNodeId !== null,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const readerRefetchRef = useRef(readerStateQuery.refetch);
 useEffect(() => {
  readerRefetchRef.current = readerStateQuery.refetch;
 }, [readerStateQuery.refetch]);

 const remoteState = useMemo<ReaderFeatureState | null>(() => {
  if (stateOwner === "reader") {
   const progress = readerStateQuery.data?.progress;
   return progress
    ? {
       completed: progress.completed,
       answers: progress.answers,
      }
    : null;
  }
  const rowState =
   stateOwner === "daily" ? dailyStateQuery.data?.state : personalStateQuery.data?.state;
  const parsed = readerFeatureStateSchema.safeParse(rowState);
  return parsed.success ? parsed.data : null;
 }, [dailyStateQuery.data, personalStateQuery.data, readerStateQuery.data, stateOwner]);
 const activeLocalState = localState.identity === stateIdentity ? localState.value : null;
 const featureState = activeLocalState ?? remoteState ?? DEFAULT_FEATURE_STATE;
 const setFeatureState = useCallback(
  (updater: SetStateAction<ReaderFeatureState>) => {
   changeVersionRef.current += 1;
   setLocalState((current) => {
    const currentValue = current.identity === stateIdentity ? current.value : null;
    const base = currentValue ?? remoteState ?? DEFAULT_FEATURE_STATE;
    return {
     identity: stateIdentity,
     value: typeof updater === "function" ? updater(base) : updater,
    };
   });
  },
  [remoteState, stateIdentity],
 );
 const pending =
  sessionQuery.isPending ||
  (hasSession &&
   (stateOwner === "reader"
    ? readerStateQuery.isPending
    : stateOwner === "daily"
      ? dailyPublishedDate !== null && dailyStateQuery.isPending
      : personalNodeId !== null && personalStateQuery.isPending));
 const error =
  stateOwner === "reader"
   ? readerStateQuery.error
   : stateOwner === "daily"
     ? dailyStateQuery.error
     : personalStateQuery.error;
 const remoteRevision =
  stateOwner === "reader"
   ? (readerStateQuery.data?.progress?.revision ?? 0)
   : stateOwner === "daily"
     ? (dailyStateQuery.data?.revision ?? 0)
     : (personalStateQuery.data?.revision ?? 0);
 const remoteReaderState = useMemo<ReaderFeatureState>(() => {
  const progress = readerStateQuery.data?.progress;
  return progress
   ? {
      completed: progress.completed,
      answers: progress.answers,
     }
   : DEFAULT_FEATURE_STATE;
 }, [readerStateQuery.data]);

 const recoverConflict = useCallback(async () => {
  const refreshed = await readerRefetchRef.current();
  return refreshed.data?.progress?.revision ?? null;
 }, []);
 const onAutosaveSaved = useCallback((snapshot: ReaderFeatureState) => {
  const latest = latestScheduledRef.current;
  if (latest !== null && readerFeatureStateEqual(latest.snapshot, snapshot)) {
   persistedVersionRef.current = Math.max(persistedVersionRef.current, latest.version);
   persistedSnapshotRef.current = snapshot;
   latestScheduledRef.current = null;
  }
  setSaveError("");
 }, []);
 const onAutosaveError = useCallback(
  (autosaveError: Error) => setSaveError(autosaveError.message),
  [],
 );

 useEffect(() => {
  changeVersionRef.current = 0;
  persistedVersionRef.current = 0;
  persistedSnapshotRef.current = null;
  latestScheduledRef.current = null;
 }, [resource.document.id, stateOwner]);
 useEffect(() => {
  if (stateOwner !== "reader") return;
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 0,
   save: (snapshot, expectedRevision, signal) =>
    saveReaderProgress(
     { documentId: resource.document.id, ...snapshot, expectedRevision },
     { signal },
    ),
   recoverConflict,
   isConflict: (autosaveError) => autosaveError instanceof ReaderProgressConflictError,
   onSaved: onAutosaveSaved,
   onError: onAutosaveError,
  });
  autosaveRef.current = controller;
  return () => {
   controller.dispose();
   if (autosaveRef.current === controller) autosaveRef.current = null;
  };
 }, [onAutosaveError, onAutosaveSaved, recoverConflict, resource.document.id, stateOwner]);
 useEffect(() => {
  if (!pending) revisionRef.current = remoteRevision;
 }, [pending, remoteRevision]);
 useEffect(() => {
  if (stateOwner === "reader") autosaveRef.current?.updateRevision(remoteRevision);
 }, [remoteRevision, stateOwner]);
 useEffect(() => {
  if (stateOwner !== "reader" || !hasSession || pending || error) return;
  const controller = autosaveRef.current;
  if (!controller) return;
  if (persistedSnapshotRef.current === null) persistedSnapshotRef.current = remoteReaderState;
  controller.setPersistedSnapshot(persistedSnapshotRef.current);
 }, [error, hasSession, pending, remoteReaderState, stateOwner]);
 useEffect(() => {
  if (stateOwner !== "reader" || !hasSession || pending || error) return;
  const controller = autosaveRef.current;
  if (!controller) return;
  const version = changeVersionRef.current;
  if (!hasPendingReaderStateChange(version, persistedVersionRef.current)) return;
  const latest = latestScheduledRef.current;
  if (latest !== null && readerFeatureStateEqual(latest.snapshot, featureState)) {
   latestScheduledRef.current = { snapshot: latest.snapshot, version };
   return;
  }
  latestScheduledRef.current = { snapshot: featureState, version };
  controller.schedule(featureState);
  if (
   persistedSnapshotRef.current &&
   readerFeatureStateEqual(featureState, persistedSnapshotRef.current)
  ) {
   persistedVersionRef.current = Math.max(persistedVersionRef.current, version);
  }
 }, [error, featureState, hasSession, pending, stateOwner]);
 useEffect(() => {
  if (stateOwner === "reader" || !hasSession || pending || error) return;
  const version = changeVersionRef.current;
  if (!hasPendingReaderStateChange(version, persistedVersionRef.current)) return;
  const snapshot = readerFeatureStateSchema.parse(featureState);
  saveQueueRef.current = saveQueueRef.current
   .catch(() => undefined)
   .then(async () => {
    if (version !== changeVersionRef.current) return;
    try {
     const saved =
      stateOwner === "daily" && dailyPublishedDate !== null
       ? await saveDailyReadingState({
          publishedDate: dailyPublishedDate,
          state: snapshot,
          expectedRevision: revisionRef.current,
         })
       : stateOwner === "personal" && personalNodeId !== null
         ? await savePersonalLearningState({
            nodeId: personalNodeId,
            state: snapshot,
            expectedRevision: revisionRef.current,
           })
         : null;
     revisionRef.current = saved?.revision ?? revisionRef.current;
     persistedVersionRef.current = Math.max(persistedVersionRef.current, version);
     setSaveError("");
    } catch (saveStateError) {
     setSaveError(
      saveStateError instanceof Error ? saveStateError.message : "Không lưu được tiến độ Reader.",
     );
    }
   });
 }, [dailyPublishedDate, error, featureState, hasSession, pending, personalNodeId, stateOwner]);

 return {
  featureState,
  setFeatureState,
  hasSession,
  readerState: readerStateQuery.data,
  pending,
  error,
  saveError,
  setSaveError,
 };
}
