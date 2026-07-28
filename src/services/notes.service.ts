/**
 * Notes Service — Supabase data access layer.
 *
 * Pure data operations. No UI, no React, no Next.js.
 */

import { JsonObjectSchema, type JsonObject } from "@/types/json";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { DbNoteSchema, type DbNote, type NoteCategory } from "@/types/database";
import type { Database, TablesUpdate } from "@/types/supabase.generated";

type AppSupabaseClient = SupabaseClient<Database>;

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

const LessonNoteTargetTypeSchema = z.literal("hanzihome_lesson");
const LessonNoteRelationTypeSchema = z.enum([
 "main",
 "lesson_text",
 "vocab",
 "grammar",
 "annotation",
]);
export type LessonNoteTargetType = z.infer<typeof LessonNoteTargetTypeSchema>;
export type LessonNoteRelationType = z.infer<typeof LessonNoteRelationTypeSchema>;

const NoteLinkSummarySchema = z.object({
 noteId: z.string(),
 targetType: LessonNoteTargetTypeSchema,
 targetKey: z.string(),
 relationType: LessonNoteRelationTypeSchema,
 updatedAt: z.string(),
});
export type NoteLinkSummary = z.infer<typeof NoteLinkSummarySchema>;

export type NoteListItem = NoteListRow & {
 links: NoteLinkSummary[];
};

const NoteDetailSchema = DbNoteSchema.extend({
 links: z.array(NoteLinkSummarySchema),
});
const NullableNoteDetailSchema = NoteDetailSchema.nullable();
const NullableDbNoteSchema = DbNoteSchema.nullable();
export type NoteDetail = z.infer<typeof NoteDetailSchema>;
type NullableNoteDetail = z.infer<typeof NullableNoteDetailSchema>;
type NullableDbNote = z.infer<typeof NullableDbNoteSchema>;

export const NoteFolderColorSchema = z.enum(["purple", "blue", "green", "orange", "rose", "slate"]);
export type NoteFolderColor = z.infer<typeof NoteFolderColorSchema>;

const NoteSourceMetadataSchema = z.object({
 url: z.string().nullable(),
 host: z.string().nullable(),
 label: z.string().nullable(),
 author: z.string().nullable(),
 publishedAt: z.string().nullable(),
 capturedAt: z.string().nullable(),
});
export type NoteSourceMetadata = z.infer<typeof NoteSourceMetadataSchema>;

const CreateNoteInputSchema = z.object({
 title: z.string(),
 tags: z.array(z.string()),
 category: DbNoteSchema.shape.category.optional(),
 content: JsonObjectSchema.optional(),
 readingContent: JsonObjectSchema.nullable().optional(),
 splitViewEnabled: z.boolean().optional(),
 folderId: z.string().nullable().optional(),
 readingStatus: DbNoteSchema.shape.reading_status.optional(),
 source: NoteSourceMetadataSchema.nullable().optional(),
});
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;

export const NoteFolderSchema = z.object({
 id: z.string(),
 userId: z.string(),
 parentId: z.string().nullable(),
 name: z.string(),
 color: NoteFolderColorSchema,
 position: z.number(),
 createdAt: z.string(),
 updatedAt: z.string(),
});
export type NoteFolder = z.infer<typeof NoteFolderSchema>;

const NullableNoteIdentitySchema = DbNoteSchema.pick({
 id: true,
 short_id: true,
}).nullable();

const CreateNoteFolderInputSchema = z.object({
 name: z.string(),
 parentId: z.string().nullable().optional(),
 color: NoteFolderColorSchema.optional(),
 position: z.number().optional(),
});

const UpdateNoteFolderInputSchema = NoteFolderSchema.pick({
 name: true,
 parentId: true,
 color: true,
 position: true,
}).partial();

export const UpdateNoteLibraryMetadataInputSchema = z.object({
 title: z.string().optional(),
 folderId: z.string().nullable().optional(),
 readingStatus: DbNoteSchema.shape.reading_status.optional(),
 source: NoteSourceMetadataSchema.nullable().optional(),
});

const NoteFolderRowSchema = z.object({
 id: z.string(),
 user_id: z.string(),
 parent_id: z.string().nullable(),
 name: z.string(),
 color: NoteFolderColorSchema,
 position: z.number(),
 created_at: z.string(),
 updated_at: z.string(),
});
type NoteFolderRow = z.infer<typeof NoteFolderRowSchema>;

const noteListSelect =
 "id, title, tags, status, category, short_id, updated_at, linked_lesson_id, folder_id, reading_status, source_url, source_host, source_label, source_author, source_published_at, source_captured_at";

const NoteListRowSchema = DbNoteSchema.pick({
 id: true,
 title: true,
 tags: true,
 status: true,
 category: true,
 short_id: true,
 updated_at: true,
 linked_lesson_id: true,
 folder_id: true,
 reading_status: true,
 source_url: true,
 source_host: true,
 source_label: true,
 source_author: true,
 source_published_at: true,
 source_captured_at: true,
});
type NoteListRow = z.infer<typeof NoteListRowSchema>;

function toNoteFolder(row: NoteFolderRow): NoteFolder {
 return {
  id: row.id,
  userId: row.user_id,
  parentId: row.parent_id,
  name: row.name,
  color: row.color,
  position: row.position,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
 };
}

const LessonNoteLinkRowSchema = z.object({
 note_id: z.string(),
 target_type: z.literal("hanzihome_lesson"),
 target_key: z.string(),
 relation_type: z.enum(["main", "lesson_text", "vocab", "grammar", "annotation"]),
 updated_at: z.string(),
});
type LessonNoteLinkRow = z.infer<typeof LessonNoteLinkRowSchema>;

function toNoteLinkSummary(row: LessonNoteLinkRow): NoteLinkSummary {
 return {
  noteId: row.note_id,
  targetType: row.target_type,
  targetKey: row.target_key,
  relationType: row.relation_type,
  updatedAt: row.updated_at,
 };
}

async function getLessonNoteLinksForNotes(
 supabase: AppSupabaseClient,
 userId: string,
 noteIds: string[],
): Promise<Map<string, NoteLinkSummary[]>> {
 const linksByNoteId = new Map<string, NoteLinkSummary[]>();
 if (noteIds.length === 0) return linksByNoteId;

 const { data, error } = await supabase
  .from("lesson_note_links")
  .select("note_id, target_type, target_key, relation_type, updated_at")
  .eq("user_id", userId)
  .in("note_id", noteIds);

 if (error) {
  logger.error("[NotesService] fetch lesson note links error:", error);
  return linksByNoteId;
 }

 for (const row of LessonNoteLinkRowSchema.array().parse(data ?? [])) {
  const link = toNoteLinkSummary(row);
  const existingLinks = linksByNoteId.get(link.noteId) ?? [];
  existingLinks.push(link);
  linksByNoteId.set(link.noteId, existingLinks);
 }

 return linksByNoteId;
}

async function attachLessonLinks(
 supabase: AppSupabaseClient,
 userId: string,
 notes: NoteListRow[],
): Promise<NoteListItem[]> {
 const linksByNoteId = await getLessonNoteLinksForNotes(
  supabase,
  userId,
  notes.map((note) => note.id),
 );

 return notes.map((note) => ({
  ...note,
  links: linksByNoteId.get(note.id) ?? [],
 }));
}

/* ══════════════════════════════════════════
   Read Operations
   ══════════════════════════════════════════ */

/** Fetch all notes for a user */
export async function getUserNotes(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select(noteListSelect)
  .eq("user_id", userId)
  .order("updated_at", { ascending: false });

 if (error) {
  logger.error("[NotesService] fetch error:", error);
  throw error;
 }

 return attachLessonLinks(supabase, userId, NoteListRowSchema.array().parse(data || []));
}

/** Fetch a bounded list for lightweight dashboard surfaces. */
export async function getRecentUserNotes(
 supabase: AppSupabaseClient,
 userId: string,
 limit: number,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select(noteListSelect)
  .eq("user_id", userId)
  .order("updated_at", { ascending: false })
  .limit(limit);

 if (error) {
  logger.error("[NotesService] fetch recent error:", error);
  throw error;
 }

 return attachLessonLinks(supabase, userId, NoteListRowSchema.array().parse(data || []));
}

/** Fetch notes by category */
export async function getNotesByCategory(
 supabase: AppSupabaseClient,
 userId: string,
 category: NoteCategory,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select(noteListSelect)
  .eq("user_id", userId)
  .eq("category", category)
  .order("updated_at", { ascending: false });

 if (error) {
  logger.error("[NotesService] fetch by category error:", error);
  throw error;
 }

 return attachLessonLinks(supabase, userId, NoteListRowSchema.array().parse(data || []));
}

/** Fetch a single note by ID */
export async function getNoteById(
 supabase: AppSupabaseClient,
 noteId: string,
 userId: string,
): Promise<NullableNoteDetail> {
 const { data, error } = await supabase
  .from("notes")
  .select("*")
  .eq("id", noteId)
  .eq("user_id", userId)
  .maybeSingle();

 if (error) {
  logger.error("[NotesService] fetch by ID error:", error);
  return null;
 }

 const linksByNoteId = await getLessonNoteLinksForNotes(supabase, userId, [noteId]);
 return {
  ...DbNoteSchema.parse(data),
  links: linksByNoteId.get(noteId) ?? [],
 };
}

/* ══════════════════════════════════════════
   Write Operations
   ══════════════════════════════════════════ */

/** Create a new note */
export async function createNote(
 supabase: AppSupabaseClient,
 userId: string,
 input: CreateNoteInput,
): Promise<NullableDbNote> {
 const { data, error } = await supabase
  .from("notes")
  .insert({
   user_id: userId,
   title: input.title,
   tags: input.tags,
   category: input.category || "general",
   content: input.content || {
    type: "doc",
    content: [{ type: "paragraph" }],
   },
   reading_content: input.readingContent ?? null,
   split_view_enabled: input.splitViewEnabled ?? false,
   folder_id: input.folderId ?? null,
   reading_status: input.readingStatus ?? null,
   source_url: input.source?.url ?? null,
   source_host: input.source?.host ?? null,
   source_label: input.source?.label ?? null,
   source_author: input.source?.author ?? null,
   source_published_at: input.source?.publishedAt ?? null,
   source_captured_at: input.source?.capturedAt ?? null,
  })
  .select()
  .single();

 if (error) {
  logger.error("[NotesService] create error:", error);
  return null;
 }

 return DbNoteSchema.parse(data);
}

/** Update note content (used by auto-save) */
export async function updateNoteContent(
 supabase: AppSupabaseClient,
 noteId: string,
 content: JsonObject,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ content, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  logger.error("[NotesService] update content error:", error);
  return false;
 }
 return true;
}

/** Update note title */
export async function updateNoteTitle(
 supabase: AppSupabaseClient,
 noteId: string,
 title: string,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ title, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  logger.error("[NotesService] update title error:", error);
  return false;
 }
 return true;
}

/** Update note category */
export async function updateNoteCategory(
 supabase: AppSupabaseClient,
 noteId: string,
 category: NoteCategory,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ category, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  logger.error("[NotesService] update category error:", error);
  return false;
 }
 return true;
}

/** Delete a note */
export async function deleteNote(supabase: AppSupabaseClient, noteId: string): Promise<boolean> {
 const { error } = await supabase.from("notes").delete().eq("id", noteId);

 if (error) {
  logger.error("[NotesService] delete error:", error);
  return false;
 }
 return true;
}

/** Update reading content (split view left pane) */
export async function updateReadingContent(
 supabase: AppSupabaseClient,
 noteId: string,
 readingContent: DbNote["reading_content"],
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({
   reading_content: readingContent,
   updated_at: new Date().toISOString(),
  })
  .eq("id", noteId);

 if (error) {
  logger.error("[NotesService] update reading content error:", error);
  return false;
 }
 return true;
}

/** Update split view enabled state */
export async function updateSplitViewEnabled(
 supabase: AppSupabaseClient,
 noteId: string,
 enabled: boolean,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ split_view_enabled: enabled, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  logger.error("[NotesService] update split view state error:", error);
  return false;
 }
 return true;
}

/** Resolve a short_id to the full note (for URL redirects) */
export async function getNoteByShortId(
 supabase: AppSupabaseClient,
 shortId: string,
 userId: string,
): Promise<z.infer<typeof NullableNoteIdentitySchema>> {
 const { data, error } = await supabase
  .from("notes")
  .select("id, short_id")
  .eq("short_id", shortId)
  .eq("user_id", userId)
  .single();

 if (error) {
  logger.error("[NotesService] fetch by short_id error:", error);
  return null;
 }
 return data;
}

/** Search notes by title (for link-to-note feature) */
export async function searchNotesByTitle(
 supabase: AppSupabaseClient,
 userId: string,
 query: string,
 limit = 10,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select(noteListSelect)
  .eq("user_id", userId)
  .ilike("title", `%${query}%`)
  .order("updated_at", { ascending: false })
  .limit(limit);

 if (error) {
  logger.error("[NotesService] search error:", error);
  return [];
 }
 return attachLessonLinks(supabase, userId, NoteListRowSchema.array().parse(data || []));
}

export async function getNoteFolders(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<NoteFolder[]> {
 const { data, error } = await supabase
  .from("note_folders")
  .select("id, user_id, parent_id, name, color, position, created_at, updated_at")
  .eq("user_id", userId)
  .order("position", { ascending: true })
  .order("name", { ascending: true });

 if (error) throw error;
 return NoteFolderRowSchema.array()
  .parse(data ?? [])
  .map(toNoteFolder);
}

export async function createNoteFolder(
 supabase: AppSupabaseClient,
 userId: string,
 input: z.infer<typeof CreateNoteFolderInputSchema>,
): Promise<NoteFolder> {
 const { data, error } = await supabase
  .from("note_folders")
  .insert({
   user_id: userId,
   name: input.name.trim(),
   parent_id: input.parentId ?? null,
   color: input.color ?? "purple",
   position: input.position ?? 0,
  })
  .select("id, user_id, parent_id, name, color, position, created_at, updated_at")
  .single();

 if (error) throw error;
 return toNoteFolder(NoteFolderRowSchema.parse(data));
}

export async function updateNoteFolder(
 supabase: AppSupabaseClient,
 folderId: string,
 input: z.infer<typeof UpdateNoteFolderInputSchema>,
): Promise<NoteFolder> {
 const changes: TablesUpdate<"note_folders"> = {};
 if (input.name !== undefined) changes.name = input.name.trim();
 if (input.parentId !== undefined) changes.parent_id = input.parentId;
 if (input.color !== undefined) changes.color = input.color;
 if (input.position !== undefined) changes.position = input.position;

 const { data, error } = await supabase
  .from("note_folders")
  .update(changes)
  .eq("id", folderId)
  .select("id, user_id, parent_id, name, color, position, created_at, updated_at")
  .single();

 if (error) throw error;
 return toNoteFolder(NoteFolderRowSchema.parse(data));
}

export async function deleteNoteFolder(
 supabase: AppSupabaseClient,
 folderId: string,
): Promise<void> {
 const { error } = await supabase.from("note_folders").delete().eq("id", folderId);
 if (error) throw error;
}

export async function updateNoteLibraryMetadata(
 supabase: AppSupabaseClient,
 noteId: string,
 input: z.infer<typeof UpdateNoteLibraryMetadataInputSchema>,
): Promise<void> {
 const changes: TablesUpdate<"notes"> = { updated_at: new Date().toISOString() };
 if (input.title !== undefined) changes.title = input.title;
 if (input.folderId !== undefined) changes.folder_id = input.folderId;
 if (input.readingStatus !== undefined) changes.reading_status = input.readingStatus;
 if (input.source !== undefined) {
  changes.source_url = input.source?.url ?? null;
  changes.source_host = input.source?.host ?? null;
  changes.source_label = input.source?.label ?? null;
  changes.source_author = input.source?.author ?? null;
  changes.source_published_at = input.source?.publishedAt ?? null;
  changes.source_captured_at = input.source?.capturedAt ?? null;
 }

 const { error } = await supabase.from("notes").update(changes).eq("id", noteId);
 if (error) throw error;
}

/* ══════════════════════════════════════════
   Lesson Note Links
   ══════════════════════════════════════════ */

export async function getNoteByLessonNoteLink(
 supabase: AppSupabaseClient,
 userId: string,
 targetKey: string,
 targetType: LessonNoteTargetType = "hanzihome_lesson",
 relationType: LessonNoteRelationType = "main",
): Promise<NullableDbNote> {
 const { data, error } = await supabase
  .from("lesson_note_links")
  .select("note_id")
  .eq("user_id", userId)
  .eq("target_type", targetType)
  .eq("target_key", targetKey)
  .eq("relation_type", relationType)
  .maybeSingle();

 if (error) {
  logger.error("[NotesService] fetch lesson note link error:", error);
  return null;
 }

 const noteId = data?.note_id;
 if (!noteId) return null;

 return getNoteById(supabase, noteId, userId);
}

export async function linkNoteToLessonTarget(
 supabase: AppSupabaseClient,
 input: {
  userId: string;
  noteId: string;
  targetKey: string;
  targetType?: LessonNoteTargetType;
  relationType?: LessonNoteRelationType;
 },
): Promise<boolean> {
 const targetType = input.targetType ?? "hanzihome_lesson";
 const relationType = input.relationType ?? "main";

 const { data: existingLink, error: selectError } = await supabase
  .from("lesson_note_links")
  .select("id")
  .eq("user_id", input.userId)
  .eq("target_type", targetType)
  .eq("target_key", input.targetKey)
  .eq("relation_type", relationType)
  .maybeSingle();

 if (selectError) {
  logger.error("[NotesService] select lesson note link error:", selectError);
  return false;
 }

 if (existingLink?.id) {
  const { error: updateError } = await supabase
   .from("lesson_note_links")
   .update({
    note_id: input.noteId,
    updated_at: new Date().toISOString(),
   })
   .eq("id", existingLink.id);

  if (updateError) {
   logger.error("[NotesService] update lesson note link error:", updateError);
   return false;
  }

  return true;
 }

 const { error: insertError } = await supabase.from("lesson_note_links").insert({
  user_id: input.userId,
  note_id: input.noteId,
  target_type: targetType,
  target_key: input.targetKey,
  relation_type: relationType,
 });

 if (insertError) {
  logger.error("[NotesService] insert lesson note link error:", insertError);
  return false;
 }

 return true;
}
