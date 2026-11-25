import {
 apiErrorPayloadSchema,
 youtubeTranscriptResponseSchema,
 type YoutubeTranscriptResponse,
} from "../model/youtube-transcript.schemas";

export async function fetchYoutubeTranscriptClient(
 videoId: string,
 signal?: AbortSignal,
): Promise<YoutubeTranscriptResponse> {
 const response = await fetch(
  `/api/shadowing/youtube-transcript?videoId=${encodeURIComponent(videoId)}`,
  {
   method: "GET",
   cache: "no-store",
   signal,
  },
 );

 if (!response.ok) {
  let code = "YOUTUBE_FETCH_FAILED";
  let message = "Could not load transcript";
  try {
   const parsed = apiErrorPayloadSchema.safeParse(await response.json());
   if (parsed.success) {
    if (parsed.data.code) code = parsed.data.code;
    if (parsed.data.error) message = parsed.data.error;
   }
  } catch {
   // Fall back to default error code when error body is not JSON.
  }

  const error = new Error(message);
  error.name = code;
  throw error;
 }

 const json: ReturnType<typeof JSON.parse> = await response.json();
 return youtubeTranscriptResponseSchema.parse(json);
}
