"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useNativeMandarinTts } from "./useNativeMandarinTts";

type NativeMandarinTtsContextValue = ReturnType<typeof useNativeMandarinTts>;

const NativeMandarinTtsContext = createContext<NativeMandarinTtsContextValue | null>(null);

export function NativeMandarinTtsProvider({ children }: { children: ReactNode }) {
 const tts = useNativeMandarinTts();

 return (
  <NativeMandarinTtsContext.Provider value={tts}>{children}</NativeMandarinTtsContext.Provider>
 );
}

export function useSharedNativeMandarinTts() {
 const context = useContext(NativeMandarinTtsContext);
 if (!context) throw new Error("useSharedNativeMandarinTts requires NativeMandarinTtsProvider");
 return context;
}
