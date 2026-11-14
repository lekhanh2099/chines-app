"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { useClientSession } from "@/components/providers/QueryProvider";
import { createTtsFolder, fetchTtsLibrary, saveTtsClip } from "./tts-studio-api";

export function useTtsLibrary(enabled: boolean) {
 const { userId, isResolved } = useClientSession();
 return useQuery({
  queryKey: hanzihomeQueryKeys.ttsLibraryForUser(userId),
  queryFn: ({ signal }) => fetchTtsLibrary(signal),
  enabled: enabled && isResolved,
  staleTime: 30_000,
 });
}

export function useTtsLibraryMutations() {
 const queryClient = useQueryClient();
 const { userId } = useClientSession();
 const libraryKey = hanzihomeQueryKeys.ttsLibraryForUser(userId);
 const createFolder = useMutation({
  mutationFn: createTtsFolder,
  onSuccess: (folder) => {
   queryClient.setQueryData<Awaited<ReturnType<typeof fetchTtsLibrary>>>(libraryKey, (current) =>
    current
     ? {
        ...current,
        folders: [folder, ...current.folders.filter((existing) => existing.id !== folder.id)],
       }
     : current,
   );
   return queryClient.invalidateQueries({ queryKey: libraryKey });
  },
 });
 const saveClip = useMutation({
  mutationFn: saveTtsClip,
  onSuccess: (clip) => {
   queryClient.setQueryData<Awaited<ReturnType<typeof fetchTtsLibrary>>>(libraryKey, (current) =>
    current
     ? { ...current, clips: [clip, ...current.clips.filter((existing) => existing.id !== clip.id)] }
     : current,
   );
   return queryClient.invalidateQueries({ queryKey: libraryKey });
  },
 });
 return { createFolder, saveClip };
}
