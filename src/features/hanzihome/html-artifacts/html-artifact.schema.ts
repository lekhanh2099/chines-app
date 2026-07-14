import { z } from "zod";

export const htmlArtifactTypeSchema = z.enum([
 "practice_page",
 "mock_exam",
 "grammar_drill",
 "reference",
 "other",
]);

export const htmlArtifactSummarySchema = z.object({
 id: z.string(),
 ownerId: z.string(),
 folderId: z.string().nullable(),
 title: z.string(),
 artifactType: htmlArtifactTypeSchema,
 tags: z.array(z.string()),
 createdAt: z.string(),
 updatedAt: z.string(),
});

export const htmlArtifactSchema = htmlArtifactSummarySchema.extend({
 html: z.string(),
});

export const htmlArtifactFolderColorSchema = z.enum([
 "blue",
 "purple",
 "green",
 "orange",
 "rose",
 "slate",
]);

export const htmlArtifactFolderSchema = z.object({
 id: z.string(),
 ownerId: z.string(),
 parentFolderId: z.string().nullable(),
 name: z.string(),
 color: htmlArtifactFolderColorSchema,
 position: z.number(),
 createdAt: z.string(),
 updatedAt: z.string(),
});

export const createHtmlArtifactPayloadSchema = z.object({
 title: z.string().trim().min(1).max(200),
 folderId: z.string().uuid().nullable().optional(),
 artifactType: htmlArtifactTypeSchema.default("practice_page"),
 tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
 html: z.string().trim().min(1).max(2_000_000),
});

export const updateHtmlArtifactPayloadSchema = createHtmlArtifactPayloadSchema.partial();

export const createHtmlArtifactFolderPayloadSchema = z.object({
 name: z.string().trim().min(1),
 parentFolderId: z.string().uuid().nullable().optional(),
 color: htmlArtifactFolderColorSchema.default("blue"),
 position: z.number().int().min(0).default(0),
});

export const updateHtmlArtifactFolderPayloadSchema =
 createHtmlArtifactFolderPayloadSchema.partial();

export const htmlArtifactRuntimeStateSchema = z.record(z.string().min(1), z.string());

export const updateHtmlArtifactRuntimeStatePayloadSchema = z.object({
 state: htmlArtifactRuntimeStateSchema.default({}),
});

export type HtmlArtifactType = z.infer<typeof htmlArtifactTypeSchema>;
export type HtmlArtifactFolderColor = z.infer<typeof htmlArtifactFolderColorSchema>;
export type HtmlArtifactFolder = z.infer<typeof htmlArtifactFolderSchema>;
export type HtmlArtifactSummary = z.infer<typeof htmlArtifactSummarySchema>;
export type HtmlArtifact = z.infer<typeof htmlArtifactSchema>;
export type HtmlArtifactRuntimeState = z.infer<typeof htmlArtifactRuntimeStateSchema>;
export type CreateHtmlArtifactPayload = z.input<typeof createHtmlArtifactPayloadSchema>;
export type UpdateHtmlArtifactPayload = z.input<typeof updateHtmlArtifactPayloadSchema>;
export type CreateHtmlArtifactFolderPayload = z.input<typeof createHtmlArtifactFolderPayloadSchema>;
export type UpdateHtmlArtifactFolderPayload = z.input<typeof updateHtmlArtifactFolderPayloadSchema>;
export type UpdateHtmlArtifactRuntimeStatePayload = z.input<
 typeof updateHtmlArtifactRuntimeStatePayloadSchema
>;
