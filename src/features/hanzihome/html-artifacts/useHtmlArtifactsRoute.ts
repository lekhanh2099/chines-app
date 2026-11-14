"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import type { Nullable } from "./components/HtmlArtifactEditor";

const RouteHistoryModeSchema = z.enum(["push", "replace"]);

export function useHtmlArtifactsRoute() {
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const selectedIdFromUrl = searchParams.get("artifactId");
 const selectedId: z.infer<z.ZodNullable<z.ZodString>> =
  selectedIdFromUrl === "new" ? "new" : selectedIdFromUrl;

 const navigateToArtifact = (
  artifactId: Nullable<string>,
  mode: z.infer<typeof RouteHistoryModeSchema> = RouteHistoryModeSchema.enum.push,
 ) => {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (artifactId) nextParams.set("artifactId", artifactId);
  else nextParams.delete("artifactId");

  const queryString = nextParams.toString();
  const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

  if (mode === "replace") router.replace(nextUrl);
  else router.push(nextUrl);
 };

 const copyArtifactLink = async (artifactId: string) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("artifactId", artifactId);
  const link = `${window.location.origin}${pathname}?${nextParams.toString()}`;
  try {
   await navigator.clipboard.writeText(link);
   toast.success("Đã copy link tệp");
  } catch {
   toast.error("Không copy được link");
  }
 };

 return { pathname, router, searchParams, selectedId, navigateToArtifact, copyArtifactLink };
}
