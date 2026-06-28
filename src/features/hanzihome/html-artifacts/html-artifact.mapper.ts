import { z } from "zod";

import {
 htmlArtifactFolderSchema,
 htmlArtifactSchema,
 htmlArtifactSummarySchema,
 type HtmlArtifact,
 type HtmlArtifactFolder,
 type HtmlArtifactSummary,
} from "./html-artifact.schema";

export const htmlArtifactRowSchema = z.object({
 id: z.string(),
 owner_id: z.string(),
 folder_id: z.string().nullable(),
 title: z.string(),
 artifact_type: z.enum(["practice_page", "mock_exam", "grammar_drill", "reference", "other"]),
 tags: z.array(z.string()),
 html: z.string().optional(),
 created_at: z.string(),
 updated_at: z.string(),
});

export const htmlArtifactFolderRowSchema = z.object({
 id: z.string(),
 owner_id: z.string(),
 parent_folder_id: z.string().nullable().optional(),
 name: z.string(),
 color: z.enum(["blue", "purple", "green", "orange", "rose", "slate"]),
 position: z.number(),
 created_at: z.string(),
 updated_at: z.string(),
});

export type HtmlArtifactRow = z.infer<typeof htmlArtifactRowSchema>;
export type HtmlArtifactFolderRow = z.infer<typeof htmlArtifactFolderRowSchema>;

function mapBase(row: HtmlArtifactRow) {
 return {
  id: row.id,
  ownerId: row.owner_id,
  folderId: row.folder_id,
  title: row.title,
  artifactType: row.artifact_type,
  tags: row.tags,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
 };
}

export function mapHtmlArtifactSummaryRow(row: unknown): HtmlArtifactSummary {
 const parsed = htmlArtifactRowSchema.parse(row);

 return htmlArtifactSummarySchema.parse(mapBase(parsed));
}

export function mapHtmlArtifactSummaryRows(rows: unknown[] | null): HtmlArtifactSummary[] {
 return (rows ?? []).map(mapHtmlArtifactSummaryRow);
}

export function mapHtmlArtifactRow(row: unknown): HtmlArtifact {
 const parsed = htmlArtifactRowSchema.extend({ html: z.string() }).parse(row);

 return htmlArtifactSchema.parse({
  ...mapBase(parsed),
  html: parsed.html,
 });
}

export function mapHtmlArtifactFolderRow(row: unknown): HtmlArtifactFolder {
 const parsed = htmlArtifactFolderRowSchema.parse(row);

 return htmlArtifactFolderSchema.parse({
  id: parsed.id,
  ownerId: parsed.owner_id,
  parentFolderId: parsed.parent_folder_id ?? null,
  name: parsed.name,
  color: parsed.color,
  position: parsed.position,
  createdAt: parsed.created_at,
  updatedAt: parsed.updated_at,
 });
}

export function mapHtmlArtifactFolderRows(rows: unknown[] | null): HtmlArtifactFolder[] {
 return (rows ?? []).map(mapHtmlArtifactFolderRow);
}
