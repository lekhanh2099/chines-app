import "server-only";

import { z } from "zod";

import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";

const integerRpcSchema = z.union([
 z.number().int().nonnegative(),
 z.tuple([z.number().int().nonnegative()]).transform(([value]) => value),
]);

export async function forgetAiConversationMemories({
 userId,
 conversationId,
 memoryIds,
}: {
 userId: string;
 conversationId: string;
 memoryIds: string[];
}): Promise<number> {
 if (memoryIds.length === 0) return 0;

 const secret = getSupabaseServerSecret();
 const isModernSecret = secret.startsWith("sb_secret_");
 const response = await fetch(`${publicSupabaseEnv.url}/rest/v1/rpc/ai_forget_memories`, {
  method: "POST",
  headers: {
   Accept: "application/json",
   "Content-Type": "application/json",
   apikey: secret,
   ...(!isModernSecret ? { Authorization: `Bearer ${secret}` } : {}),
  },
  body: JSON.stringify({
   p_user_id: userId,
   p_conversation_id: conversationId,
   p_memory_ids: memoryIds,
  }),
  cache: "no-store",
 });

 if (!response.ok) {
  throw new Error(`AI explicit forget failed with HTTP ${response.status}.`);
 }

 return integerRpcSchema.parse(await response.json());
}
