"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

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

export function QueryProvider({ children }: { children: React.ReactNode }) {
 const clientRef = useRef<QueryClient>(undefined);
 if (!clientRef.current) {
  clientRef.current = makeQueryClient();
 }

 return (
  <QueryClientProvider client={clientRef.current}>
   {children}
  </QueryClientProvider>
 );
}
