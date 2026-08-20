"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { transitionAuthenticatedQueryOwner } from "@/lib/query/auth-owner-transition";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

type ClientSessionContextValue = {
 supabase: BrowserSupabaseClient;
 user: User | null;
 userId: string | null;
 isResolved: boolean;
};

const ClientSessionContext = createContext<ClientSessionContextValue | null>(null);

function makeQueryClient() {
 return new QueryClient({
  defaultOptions: {
   queries: {
    staleTime: 60 * 1000,
    retry: 1,
   },
  },
 });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
 const [supabase] = useState(() => createClient());
 const [client, setClient] = useState(makeQueryClient);
 const [ownerEpoch, setOwnerEpoch] = useState(0);
 const [sessionState, setSessionState] = useState<{ user: User | null; isResolved: boolean }>({
  user: null,
  isResolved: false,
 });
 const clientRef = useRef(client);
 const ownerRef = useRef<string | null | undefined>(undefined);

 useEffect(() => {
  let active = true;
  let authEventObserved = false;

  const applyUser = (user: User | null) => {
   if (!active) return;

   const transition = transitionAuthenticatedQueryOwner({
    previousOwner: ownerRef.current,
    nextOwner: user?.id ?? null,
    client: clientRef.current,
    makeClient: makeQueryClient,
   });

   if (transition.rotated) {
    clientRef.current = transition.client;
    setClient(transition.client);
    setOwnerEpoch((current) => current + 1);
   }

   ownerRef.current = transition.owner;
   setSessionState({ user, isResolved: true });
  };

  const {
   data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
   authEventObserved = true;
   applyUser(session?.user ?? null);
  });

  void getClientSessionUser(supabase).then((user) => {
   if (!authEventObserved) applyUser(user);
  });

  return () => {
   active = false;
   subscription.unsubscribe();
  };
 }, [supabase]);

 const sessionValue = useMemo<ClientSessionContextValue>(
  () => ({
   supabase,
   user: sessionState.user,
   userId: sessionState.user?.id ?? null,
   isResolved: sessionState.isResolved,
  }),
  [sessionState, supabase],
 );

 return (
  <ClientSessionContext.Provider value={sessionValue}>
   <QueryClientProvider key={ownerEpoch} client={client}>
    {children}
   </QueryClientProvider>
  </ClientSessionContext.Provider>
 );
}

export function useClientSession() {
 const context = useContext(ClientSessionContext);
 if (!context) {
  throw new Error("useClientSession must be used inside QueryProvider.");
 }
 return context;
}
