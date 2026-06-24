"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { getRecentUserNotes } from "@/services/notes.service";

export function useRecentNotes(limit = 3) {
 const supabaseRef = useRef(createClient());

 return useQuery({
  queryKey: ["notes", "recent", limit],
  queryFn: async () => {
   const user = await getClientSessionUser(supabaseRef.current);
   if (!user) return [];

   return getRecentUserNotes(supabaseRef.current, user.id, limit);
  },
 });
}
