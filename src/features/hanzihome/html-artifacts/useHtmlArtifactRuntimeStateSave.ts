"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { Nullable } from "./components/HtmlArtifactEditor";
import type { HtmlArtifact, HtmlArtifactRuntimeState } from "./html-artifact.schema";
import { useUpdateHtmlArtifactRuntimeStateMutation } from "./useHtmlArtifacts";

const runtimeStateSaveDelayMs = 2000;

export function useHtmlArtifactRuntimeStateSave(selectedArtifact: Nullable<HtmlArtifact>) {
 const updateRuntimeStateMutation = useUpdateHtmlArtifactRuntimeStateMutation();
 const runtimeStateSaveTimerRef = useRef<z.infer<z.ZodNullable<z.ZodNumber>>>(null);
 const latestRuntimeStateSaveRef = useRef<
  Nullable<{
   artifactId: string;
   state: HtmlArtifactRuntimeState;
  }>
 >(null);

 const queueRuntimeStateSave = (artifactId: string, state: HtmlArtifactRuntimeState) => {
  if (!selectedArtifact || artifactId !== selectedArtifact.id) return;

  latestRuntimeStateSaveRef.current = { artifactId, state };
  if (runtimeStateSaveTimerRef.current) window.clearTimeout(runtimeStateSaveTimerRef.current);

  runtimeStateSaveTimerRef.current = window.setTimeout(() => {
   const payload = latestRuntimeStateSaveRef.current;
   if (!payload) return;

   void updateRuntimeStateMutation
    .mutateAsync({ artifactId: payload.artifactId, input: { state: payload.state } })
    .catch(() => toast.error("Không thể sync đáp án trong iframe lên DB"));
  }, runtimeStateSaveDelayMs);
 };

 useEffect(() => {
  return () => {
   if (runtimeStateSaveTimerRef.current) window.clearTimeout(runtimeStateSaveTimerRef.current);
  };
 }, []);

 return queueRuntimeStateSave;
}
