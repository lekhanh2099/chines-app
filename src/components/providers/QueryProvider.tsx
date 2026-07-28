"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const browserQueryClientState: { current?: QueryClient } = {};

function makeQueryClient() {
 return new QueryClient({
  defaultOptions: {
   queries: {
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
   },
  },
 });
}

export function getQueryClient(): QueryClient {
 if (!browserQueryClientState.current) {
  browserQueryClientState.current = makeQueryClient();
 }

 return browserQueryClientState.current;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
 const [client] = useState(() => getQueryClient());

 return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
