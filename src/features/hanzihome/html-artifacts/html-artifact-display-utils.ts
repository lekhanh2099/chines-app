import type { ErrorInput } from "@/types/error";
import { HtmlArtifactsApiError } from "./html-artifact-api";
import { htmlArtifactSummarySchema } from "./html-artifact.schema";
import { z } from "zod";

export async function formatHtmlSource(source: string): Promise<string> {
 const [prettier, htmlPlugin] = await Promise.all([
  import("prettier/standalone"),
  import("prettier/plugins/html"),
 ]);
 const formatted = await prettier.format(source.trim(), {
  parser: "html",
  plugins: [htmlPlugin],
  printWidth: 100,
  tabWidth: 2,
 });
 return formatted.trimEnd();
}

export function getHtmlArtifactApiErrorMessage(error: ErrorInput, fallback: string): string {
 return error instanceof HtmlArtifactsApiError ? error.message : fallback;
}

export function formatHtmlArtifactDate(date: string): string {
 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
 }).format(new Date(date));
}

export function getHtmlArtifactTitle(
 artifact: z.infer<z.ZodNullable<typeof htmlArtifactSummarySchema>>,
): string {
 return artifact?.title.trim() || "HTML artifact";
}
