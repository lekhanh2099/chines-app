import type { NextRequest } from "next/server";

import { youtubeVideoIdSchema } from "@/features/youtube-shadowing/model/youtube-transcript.schemas";
import {
 fetchYoutubeTranscript,
 YoutubeTranscriptError,
} from "@/features/youtube-shadowing/server/youtube-transcript.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const rawVideoId = request.nextUrl.searchParams.get("videoId") ?? "";
 const parsedVideoId = youtubeVideoIdSchema.safeParse(rawVideoId);
 if (!parsedVideoId.success) {
  return apiError("Invalid YouTube video ID", 400, "YOUTUBE_INVALID_VIDEO_ID");
 }

 try {
  const transcript = await fetchYoutubeTranscript(parsedVideoId.data);
  return privateNoStoreJson(transcript);
 } catch (error) {
  if (error instanceof YoutubeTranscriptError) {
   return apiError(error.message, 502, error.code);
  }
  return apiError("Could not fetch YouTube transcript", 502, "YOUTUBE_FETCH_FAILED");
 }
}
