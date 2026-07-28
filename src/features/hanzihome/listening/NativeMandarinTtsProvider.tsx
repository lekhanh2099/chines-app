"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useNativeMandarinTts } from "./useNativeMandarinTts";

type NativeMandarinTtsContextValue = ReturnType<typeof useNativeMandarinTts>;

type NativeMandarinTtsContextState = { value?: NativeMandarinTtsContextValue };
const NativeMandarinTtsContext = createContext<NativeMandarinTtsContextState>({});

export function NativeMandarinTtsProvider({ children }: { children: ReactNode }) {
 const tts = useNativeMandarinTts();

 return (
  <NativeMandarinTtsContext.Provider value={{ value: tts }}>
   {children}
  </NativeMandarinTtsContext.Provider>
 );
}

export function useSharedNativeMandarinTts() {
 const context = useContext(NativeMandarinTtsContext);
 if (!context.value)
  throw new Error("useSharedNativeMandarinTts requires NativeMandarinTtsProvider");
 return context.value;
}
