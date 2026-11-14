"use client";

import { useQuery } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

export function useHanziHomeCanEdit() {
 const { supabase, userId, isResolved } = useClientSession();

 return (
  useQuery({
   queryKey: hanzihomeQueryKeys.canEditForUser(userId),
   enabled: isResolved && Boolean(userId),
   queryFn: async () => {
    if (!userId) return false;

    const { data, error } = await supabase
     .from("hanzihome_content_roles")
     .select("role")
     .eq("user_id", userId)
     .maybeSingle();

    if (error) throw error;
    return data?.role === "editor" || data?.role === "admin";
   },
   staleTime: 60_000,
  }).data === true
 );
}
