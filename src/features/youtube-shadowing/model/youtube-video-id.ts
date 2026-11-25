import { youtubeVideoIdSchema } from "./youtube-transcript.schemas";

const YOUTUBE_HOSTS = new Set([
 "youtube.com",
 "www.youtube.com",
 "m.youtube.com",
 "music.youtube.com",
 "youtube-nocookie.com",
 "www.youtube-nocookie.com",
]);

const SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);
const PATH_VIDEO_PREFIXES = new Set(["shorts", "embed", "live"]);

function validateVideoId(candidate: string): string {
 const parsed = youtubeVideoIdSchema.safeParse(candidate);
 return parsed.success ? parsed.data : "";
}

export function parseYoutubeVideoId(rawInput: string): string {
 const trimmed = rawInput.trim();
 if (!trimmed) return "";

 const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
 if (hasScheme && !/^https?:\/\//i.test(trimmed)) return "";

 const normalizedInput = hasScheme ? trimmed : `https://${trimmed}`;

 let url: URL;
 try {
  url = new URL(normalizedInput);
 } catch {
  return "";
 }

 if (url.protocol !== "https:" && url.protocol !== "http:") return "";

 const hostname = url.hostname.toLowerCase();
 const segments = url.pathname.split("/").filter((segment) => segment.length > 0);

 if (SHORT_HOSTS.has(hostname)) {
  if (segments.length !== 1) return "";
  return validateVideoId(segments[0] ?? "");
 }

 if (!YOUTUBE_HOSTS.has(hostname)) return "";

 if (segments.length === 1 && segments[0] === "watch") {
  return validateVideoId(url.searchParams.get("v") ?? "");
 }

 if (segments.length >= 2 && PATH_VIDEO_PREFIXES.has(segments[0] ?? "")) {
  return validateVideoId(segments[1] ?? "");
 }

 return "";
}
