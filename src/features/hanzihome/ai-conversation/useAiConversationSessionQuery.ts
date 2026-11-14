"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import {
 ensureAiConversationSession,
 fetchAiConversationSession,
} from "./services/ai-conversation-api";
import {
 conversationSessionQueryKey,
 SESSION_STALE_TIME_MS,
} from "./ai-conversation-workspace-utils";

export function useAiConversationSessionQuery() {
 const queryClient = useQueryClient();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const searchParamsString = searchParams.toString();
 const rawConversationId = searchParams.get("conversation");
 const parsedConversationId = z.uuid().safeParse(rawConversationId);
 const conversationIdFromUrl = parsedConversationId.success ? parsedConversationId.data : null;

 const navigateToConversation = useCallback(
  (conversationId: string) => {
   const nextParams = new URLSearchParams(searchParamsString);
   nextParams.set("conversation", conversationId);
   router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  },
  [pathname, router, searchParamsString],
 );

 const sessionQuery = useQuery({
  queryKey: conversationSessionQueryKey(conversationIdFromUrl),
  queryFn: ({ signal }) =>
   conversationIdFromUrl
    ? fetchAiConversationSession({ conversationId: conversationIdFromUrl, signal })
    : ensureAiConversationSession({ signal }),
  staleTime: SESSION_STALE_TIME_MS,
  refetchOnWindowFocus: false,
  retry: false,
 });

 useEffect(() => {
  const resolvedConversationId = sessionQuery.data?.conversation?.id;
  if (!resolvedConversationId || resolvedConversationId === conversationIdFromUrl) return;
  queryClient.setQueryData(conversationSessionQueryKey(resolvedConversationId), sessionQuery.data);
  navigateToConversation(resolvedConversationId);
 }, [conversationIdFromUrl, navigateToConversation, queryClient, sessionQuery.data]);

 return { conversationIdFromUrl, navigateToConversation, sessionQuery };
}
