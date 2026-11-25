"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchYoutubeTranscriptClient } from "../services/youtube-transcript.client";

export function youtubeTranscriptQueryKey(videoId: string) {
 return ["youtube-shadowing", "transcript", videoId];
}

export function useYoutubeTranscript(videoId: string) {
 return useQuery({
  queryKey: youtubeTranscriptQueryKey(videoId),
  queryFn: ({ signal }) => fetchYoutubeTranscriptClient(videoId, signal),
  enabled: videoId.length > 0,
  staleTime: Number.POSITIVE_INFINITY,
  retry: false,
 });
}
