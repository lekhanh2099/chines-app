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
 HtmlArtifactFolder,
 HtmlArtifactSummary,
 UpdateHtmlArtifactFolderPayload,
 UpdateHtmlArtifactPayload,
 UpdateHtmlArtifactRuntimeStatePayload,
} from "./html-artifact.schema";
import { z } from "zod";

type NullableText = z.infer<z.ZodNullable<z.ZodString>>;

type HtmlArtifactsData = {
 items: HtmlArtifactSummary[];
 folders: HtmlArtifactFolder[];
};

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

export function useHtmlArtifactQuery(artifactId: NullableText) {
 return useQuery({
  queryKey: [...htmlArtifactsQueryKey, artifactId],
  queryFn: () => getHtmlArtifact(artifactId ?? ""),
  enabled: Boolean(artifactId),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 1,
 });
}

export function useHtmlArtifactRuntimeStateQuery(artifactId: NullableText) {
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
  onSuccess: (artifact) => {
   queryClient.setQueryData([...htmlArtifactsQueryKey, artifact.id], artifact);
   queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, (old) => {
    if (!old) return { items: [artifact], folders: [] };
    return {
     ...old,
     items: [artifact, ...old.items.filter((item) => item.id !== artifact.id)],
    };
   });
  },
 });
}

export function useCreateHtmlArtifactFolderMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (input: CreateHtmlArtifactFolderPayload) => createHtmlArtifactFolder(input),
  onSuccess: (folder) => {
   queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, (old) => {
    if (!old) return { items: [], folders: [folder] };
    return {
     ...old,
     folders: [...old.folders.filter((item) => item.id !== folder.id), folder],
    };
   });
  },
 });
}

export function useUpdateHtmlArtifactFolderMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: ({ folderId, input }: { folderId: string; input: UpdateHtmlArtifactFolderPayload }) =>
   updateHtmlArtifactFolder({ folderId, input }),
  onSuccess: (folder) => {
   queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, (old) => {
    if (!old) return { items: [], folders: [folder] };
    return {
     ...old,
     folders: old.folders.map((item) => (item.id === folder.id ? folder : item)),
    };
   });
  },
 });
}

export function useDeleteHtmlArtifactFolderMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (folderId: string) => deleteHtmlArtifactFolder(folderId),
  onMutate: async (folderId) => {
   await queryClient.cancelQueries({ queryKey: htmlArtifactsQueryKey });
   const previous = queryClient.getQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey);
   const deletedFolder = previous?.folders.find((f) => f.id === folderId);
   const targetIndex = previous?.folders.findIndex((f) => f.id === folderId);
   if (previous) {
    queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, {
     ...previous,
     folders: previous.folders.filter((f) => f.id !== folderId),
    });
   }
   return { deletedFolder, targetIndex };
  },
  onError: (_error, _variables, context) => {
   const deletedFolder = context?.deletedFolder;
   if (deletedFolder) {
    queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, (old) => {
     if (!old) return { items: [], folders: [deletedFolder] };
     if (old.folders.some((f) => f.id === deletedFolder.id)) return old;
     const copy = [...old.folders];
     const insertAt =
      typeof context.targetIndex === "number" &&
      context.targetIndex >= 0 &&
      context.targetIndex <= copy.length
       ? context.targetIndex
       : copy.length;
     copy.splice(insertAt, 0, deletedFolder);
     return { ...old, folders: copy };
    });
   }
  },
 });
}

export function useUpdateHtmlArtifactMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: ({ artifactId, input }: { artifactId: string; input: UpdateHtmlArtifactPayload }) =>
   updateHtmlArtifact({ artifactId, input }),
  onSuccess: (artifact) => {
   queryClient.setQueryData([...htmlArtifactsQueryKey, artifact.id], artifact);
   queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, (old) => {
    if (!old) return { items: [artifact], folders: [] };
    return {
     ...old,
     items: old.items.map((item) => (item.id === artifact.id ? artifact : item)),
    };
   });
  },
 });
}

export function useDeleteHtmlArtifactMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (artifactId: string) => deleteHtmlArtifact(artifactId),
  onMutate: async (artifactId) => {
   await queryClient.cancelQueries({ queryKey: htmlArtifactsQueryKey });
   const previous = queryClient.getQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey);
   const deletedItem = previous?.items.find((item) => item.id === artifactId);
   const targetIndex = previous?.items.findIndex((item) => item.id === artifactId);
   if (previous) {
    queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, {
     ...previous,
     items: previous.items.filter((item) => item.id !== artifactId),
    });
   }
   return { deletedItem, targetIndex };
  },
  onSuccess: (_result, artifactId) => {
   queryClient.removeQueries({ queryKey: [...htmlArtifactsQueryKey, artifactId] });
  },
  onError: (_error, _variables, context) => {
   const deletedItem = context?.deletedItem;
   if (deletedItem) {
    queryClient.setQueryData<HtmlArtifactsData>(htmlArtifactsQueryKey, (old) => {
     if (!old) return { items: [deletedItem], folders: [] };
     if (old.items.some((item) => item.id === deletedItem.id)) return old;
     const copy = [...old.items];
     const insertAt =
      typeof context.targetIndex === "number" &&
      context.targetIndex >= 0 &&
      context.targetIndex <= copy.length
       ? context.targetIndex
       : copy.length;
     copy.splice(insertAt, 0, deletedItem);
     return { ...old, items: copy };
    });
   }
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
