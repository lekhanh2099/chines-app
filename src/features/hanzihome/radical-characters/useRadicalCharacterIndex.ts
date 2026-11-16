"use client";

import { useQuery } from "@tanstack/react-query";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { buildRadicalCharacterIndex } from "./radical-character-index";
import { radicalCharactersContentSchema } from "./radical-characters.schemas";

/**
 * Loads the bundled explained-characters package on demand. It is an immutable
 * static chunk, so it is fetched once per session and never refetched.
 */
export function useRadicalCharacterIndex(enabled: boolean) {
 return useQuery({
  queryKey: hanzihomeQueryKeys.radicalCharacters,
  enabled,
  staleTime: Infinity,
  gcTime: Infinity,
  networkMode: "always",
  queryFn: async () => {
   const content = await import("../static-json/radical-characters.json");
   return buildRadicalCharacterIndex(radicalCharactersContentSchema.parse(content.default));
  },
 });
}
