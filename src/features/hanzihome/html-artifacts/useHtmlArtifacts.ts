"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
 createHtmlArtifact,
 createHtmlArtifactFolder,
 deleteHtmlArtifact,
 deleteHtmlArtifactFolder,
 getHtmlArtifact,
 getHtmlArtifactRuntimeState,
 getHtmlArtifacts,
 htmlArtifactRuntimeStateQueryKey,
 htmlArtifactsQueryKey,
 updateHtmlArtifact,
 updateHtmlArtifactFolder,
 updateHtmlArtifactRuntimeState,
} from "./html-artifact-api";
import type {
 CreateHtmlArtifactFolderPayload,
 CreateHtmlArtifactPayload,
 UpdateHtmlArtifactFolderPayload,
 UpdateHtmlArtifactPayload,
 UpdateHtmlArtifactRuntimeStatePayload,
} from "./html-artifact.schema";

export function useHtmlArtifactsQuery() {
 return useQuery({
  queryKey: htmlArtifactsQueryKey,
  queryFn: getHtmlArtifacts,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 1,
 });
}

export function useHtmlArtifactSummariesQuery() {
 const query = useHtmlArtifactsQuery();

 return {
  ...query,
  artifacts: query.data?.items ?? [],
  folders: query.data?.folders ?? [],
 };
}

export function useHtmlArtifactQuery(artifactId: string | null) {
 return useQuery({
  queryKey: [...htmlArtifactsQueryKey, artifactId],
  queryFn: () => getHtmlArtifact(artifactId ?? ""),
  enabled: Boolean(artifactId),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 1,
 });
}

export function useHtmlArtifactRuntimeStateQuery(artifactId: string | null) {
 return useQuery({
  queryKey: artifactId
   ? htmlArtifactRuntimeStateQueryKey(artifactId)
   : [...htmlArtifactsQueryKey, "runtime-state", null],
  queryFn: () => getHtmlArtifactRuntimeState(artifactId ?? ""),
  enabled: Boolean(artifactId),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 1,
 });
}

export function useCreateHtmlArtifactMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (input: CreateHtmlArtifactPayload) => createHtmlArtifact(input),
  onSuccess: async (artifact) => {
   queryClient.setQueryData([...htmlArtifactsQueryKey, artifact.id], artifact);
   await queryClient.invalidateQueries({ queryKey: htmlArtifactsQueryKey });
  },
 });
}

export function useCreateHtmlArtifactFolderMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (input: CreateHtmlArtifactFolderPayload) => createHtmlArtifactFolder(input),
  onSuccess: async () => {
   await queryClient.invalidateQueries({ queryKey: htmlArtifactsQueryKey });
  },
 });
}

export function useUpdateHtmlArtifactFolderMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: ({
   folderId,
   input,
  }: {
   folderId: string;
   input: UpdateHtmlArtifactFolderPayload;
  }) => updateHtmlArtifactFolder({ folderId, input }),
  onSuccess: async () => {
   await queryClient.invalidateQueries({ queryKey: htmlArtifactsQueryKey });
  },
 });
}

export function useDeleteHtmlArtifactFolderMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (folderId: string) => deleteHtmlArtifactFolder(folderId),
  onSuccess: async () => {
   await queryClient.invalidateQueries({ queryKey: htmlArtifactsQueryKey });
  },
 });
}

export function useUpdateHtmlArtifactMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: ({
   artifactId,
   input,
  }: {
   artifactId: string;
   input: UpdateHtmlArtifactPayload;
  }) => updateHtmlArtifact({ artifactId, input }),
  onSuccess: async (artifact) => {
   queryClient.setQueryData([...htmlArtifactsQueryKey, artifact.id], artifact);
   await queryClient.invalidateQueries({ queryKey: htmlArtifactsQueryKey });
  },
 });
}

export function useDeleteHtmlArtifactMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (artifactId: string) => deleteHtmlArtifact(artifactId),
  onSuccess: async (_result, artifactId) => {
   queryClient.removeQueries({ queryKey: [...htmlArtifactsQueryKey, artifactId] });
   await queryClient.invalidateQueries({ queryKey: htmlArtifactsQueryKey });
  },
 });
}

export function useUpdateHtmlArtifactRuntimeStateMutation() {
 return useMutation({
  mutationFn: ({
   artifactId,
   input,
  }: {
   artifactId: string;
   input: UpdateHtmlArtifactRuntimeStatePayload;
  }) => updateHtmlArtifactRuntimeState({ artifactId, input }),
 });
}
