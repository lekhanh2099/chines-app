const CLOSED_THINK_BLOCK_PATTERN = /<think\b[^>]*>[\s\S]*?<\/think\s*>/gi;
const OPEN_THINK_BLOCK_PATTERN = /<think\b[^>]*>[\s\S]*$/i;
const STRAY_THINK_TAG_PATTERN = /<\/?think\b[^>]*>/gi;

export function sanitizeAiConversationReply(raw: string): string {
 const normalized = raw.normalize("NFC").trim();
 if (!normalized) return "";

 return normalized
  .replace(CLOSED_THINK_BLOCK_PATTERN, "")
  .replace(OPEN_THINK_BLOCK_PATTERN, "")
  .replace(STRAY_THINK_TAG_PATTERN, "")
  .trim();
}
