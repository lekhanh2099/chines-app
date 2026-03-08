"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

let browserQueryClient: QueryClient | null = null;

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
 if (!browserQueryClient) {
  browserQueryClient = makeQueryClient();
 }

 return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
 const [client] = useState(() => getQueryClient());

 return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
