import { HtmlArtifactsApiError } from "./html-artifact-api";
import type { HtmlArtifact, HtmlArtifactSummary } from "./html-artifact.schema";

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

export function getHtmlArtifactApiErrorMessage(error: unknown, fallback: string): string {
 return error instanceof HtmlArtifactsApiError ? error.message : fallback;
}

export function formatHtmlArtifactDate(date: string): string {
 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
 }).format(new Date(date));
}

export function getHtmlArtifactTitle(artifact: HtmlArtifactSummary | HtmlArtifact | null): string {
 return artifact?.title.trim() || "HTML artifact";
}
