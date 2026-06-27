"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

const DEFAULT_SAVE_DELAY_MS = 1200;

function stableStringify(value: Record<string, unknown> | null) {
 return JSON.stringify(value ?? null);
}

export function useDebouncedEditorSave({
 initialContent,
 onSave,
 delayMs = DEFAULT_SAVE_DELAY_MS,
}: {
 initialContent: Record<string, unknown> | null;
 onSave: (content: Record<string, unknown>) => void;
 delayMs?: number;
}) {
 const onSaveRef = useRef(onSave);
 const timerRef = useRef<number | null>(null);
 const pendingContentRef = useRef<Record<string, unknown> | null>(null);
 const lastSavedSnapshotRef = useRef(stableStringify(initialContent));
 const initialSnapshot = useMemo(() => stableStringify(initialContent), [initialContent]);

 useEffect(() => {
  onSaveRef.current = onSave;
 }, [onSave]);

 useEffect(() => {
  lastSavedSnapshotRef.current = initialSnapshot;
 }, [initialSnapshot]);

 useEffect(() => {
  return () => {
   if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
   }

   const pendingContent = pendingContentRef.current;
   if (!pendingContent) return;

   const pendingSnapshot = stableStringify(pendingContent);
   if (pendingSnapshot === lastSavedSnapshotRef.current) return;

   lastSavedSnapshotRef.current = pendingSnapshot;
   pendingContentRef.current = null;
   onSaveRef.current(pendingContent);
  };
 }, []);

 return useCallback(
  (content: Record<string, unknown>) => {
   const nextSnapshot = stableStringify(content);
   if (nextSnapshot === lastSavedSnapshotRef.current) return;

   pendingContentRef.current = content;

   if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
   }

   timerRef.current = window.setTimeout(() => {
    const pendingContent = pendingContentRef.current;
    if (!pendingContent) return;

    const pendingSnapshot = stableStringify(pendingContent);
    if (pendingSnapshot === lastSavedSnapshotRef.current) return;

    lastSavedSnapshotRef.current = pendingSnapshot;
    pendingContentRef.current = null;
    timerRef.current = null;
    onSaveRef.current(pendingContent);
   }, delayMs);
  },
  [delayMs],
 );
}
