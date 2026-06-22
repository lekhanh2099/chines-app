"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";

export function useHanziHomeCanEdit() {
 const supabase = useMemo(() => createClient(), []);

 return (
  useQuery({
   queryKey: ["hanzihome", "can-edit"],
   queryFn: async () => {
    const user = await getClientSessionUser(supabase);
    if (!user) return false;

    const { data, error } = await supabase
     .from("hanzihome_content_roles")
     .select("role")
     .eq("user_id", user.id)
     .maybeSingle();

    if (error) throw error;
    return data?.role === "editor" || data?.role === "admin";
   },
   staleTime: 60_000,
  }).data === true
 );
}
