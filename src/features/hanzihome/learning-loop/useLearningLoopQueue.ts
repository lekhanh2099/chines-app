"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { fetchLearningLoopItems } from "./learning-loop-api";

type ClientSession = ReturnType<typeof useClientSession>;

export function useLearningLoopQueue({
 isResolved,
 userId,
}: {
 isResolved: ClientSession["isResolved"];
 userId: ClientSession["userId"];
}) {
 const learningLoopKey = hanzihomeQueryKeys.learningLoopForUser(userId);
 const query = useQuery({
  queryKey: learningLoopKey,
  queryFn: fetchLearningLoopItems,
  enabled: isResolved && Boolean(userId),
  staleTime: 0,
 });
 const item = useMemo(() => query.data?.[0] ?? null, [query.data]);

 return { item, learningLoopKey, query };
}
