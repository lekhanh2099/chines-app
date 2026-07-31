"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useTTS } from "@/hooks/useTTS";

type MandarinTtsContextValue = ReturnType<typeof useTTS>;

type MandarinTtsContextState = { value?: MandarinTtsContextValue };
const MandarinTtsContext = createContext<MandarinTtsContextState>({});

export function MandarinTtsProvider({ children }: { children: ReactNode }) {
 const tts = useTTS();

 return (
  <MandarinTtsContext.Provider value={{ value: tts }}>{children}</MandarinTtsContext.Provider>
 );
}

export function useSharedMandarinTts() {
 const context = useContext(MandarinTtsContext);
 if (!context.value) throw new Error("useSharedMandarinTts requires MandarinTtsProvider");
 return context.value;
}
