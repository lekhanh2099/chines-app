"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";

export function useHanziHomeCanEdit() {
 const supabaseRef = useRef(createClient());

 return (
  useQuery({
   queryKey: ["hanzihome", "can-edit"],
   queryFn: async () => Boolean(await getClientSessionUser(supabaseRef.current)),
   staleTime: 60_000,
  }).data === true
 );
}
