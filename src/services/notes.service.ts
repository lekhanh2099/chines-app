/**
 * Notes Service — Supabase data access layer.
 *
 * Pure data operations. No UI, no React, no Next.js.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbNote, NoteCategory } from "@/types/database";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

export type LessonNoteTargetType = "hanzihome_lesson";
export type LessonNoteRelationType = "main" | "lesson_text" | "vocab" | "grammar" | "annotation";

export type NoteLinkSummary = {
 noteId: string;
 targetType: LessonNoteTargetType;
 targetKey: string;
 relationType: LessonNoteRelationType;
 updatedAt: string;
};

type NoteListRow = Pick<
 DbNote,
 "id" | "title" | "tags" | "status" | "category" | "short_id" | "updated_at" | "linked_lesson_id"
>;

export type NoteListItem = NoteListRow & {
 links: NoteLinkSummary[];
};

export type NoteDetail = DbNote & {
 links: NoteLinkSummary[];
};

export type CreateNoteInput = {
 title: string;
 tags: string[];
 category?: NoteCategory;
 content?: Record<string, unknown>;
 readingContent?: Record<string, unknown> | null;
 splitViewEnabled?: boolean;
};

type LessonNoteLinkRow = {
 note_id: string;
 target_type: LessonNoteTargetType;
 target_key: string;
 relation_type: LessonNoteRelationType;
 updated_at: string;
};

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
 supabase: SupabaseClient,
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
  console.error("[NotesService] fetch lesson note links error:", error);
  return linksByNoteId;
 }

 for (const row of (data ?? []) as LessonNoteLinkRow[]) {
  const link = toNoteLinkSummary(row);
  const existingLinks = linksByNoteId.get(link.noteId) ?? [];
  existingLinks.push(link);
  linksByNoteId.set(link.noteId, existingLinks);
 }

 return linksByNoteId;
}

async function attachLessonLinks(
 supabase: SupabaseClient,
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
 supabase: SupabaseClient,
 userId: string,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select("id, title, tags, status, category, short_id, updated_at, linked_lesson_id")
  .eq("user_id", userId)
  .order("updated_at", { ascending: false });

 if (error) {
  console.error("[NotesService] fetch error:", error);
  return [];
 }

 return attachLessonLinks(supabase, userId, (data || []) as NoteListRow[]);
}

/** Fetch a bounded list for lightweight dashboard surfaces. */
export async function getRecentUserNotes(
 supabase: SupabaseClient,
 userId: string,
 limit: number,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select("id, title, tags, status, category, short_id, updated_at, linked_lesson_id")
  .eq("user_id", userId)
  .order("updated_at", { ascending: false })
  .limit(limit);

 if (error) {
  console.error("[NotesService] fetch recent error:", error);
  return [];
 }

 return attachLessonLinks(supabase, userId, (data || []) as NoteListRow[]);
}

/** Fetch notes by category */
export async function getNotesByCategory(
 supabase: SupabaseClient,
 userId: string,
 category: NoteCategory,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select("id, title, tags, status, category, short_id, updated_at, linked_lesson_id")
  .eq("user_id", userId)
  .eq("category", category)
  .order("updated_at", { ascending: false });

 if (error) {
  console.error("[NotesService] fetch by category error:", error);
  return [];
 }

 return attachLessonLinks(supabase, userId, (data || []) as NoteListRow[]);
}

/** Fetch a single note by ID */
export async function getNoteById(
 supabase: SupabaseClient,
 noteId: string,
 userId: string,
): Promise<NoteDetail | null> {
 const { data, error } = await supabase
  .from("notes")
  .select("*")
  .eq("id", noteId)
  .eq("user_id", userId)
  .single();

 if (error) {
  console.error("[NotesService] fetch by ID error:", error);
  return null;
 }

 const linksByNoteId = await getLessonNoteLinksForNotes(supabase, userId, [noteId]);
 return {
  ...(data as DbNote),
  links: linksByNoteId.get(noteId) ?? [],
 };
}

/* ══════════════════════════════════════════
   Write Operations
   ══════════════════════════════════════════ */

/** Create a new note */
export async function createNote(
 supabase: SupabaseClient,
 userId: string,
 input: CreateNoteInput,
): Promise<DbNote | null> {
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
  })
  .select()
  .single();

 if (error) {
  console.error("[NotesService] create error:", error);
  return null;
 }

 return data as DbNote;
}

/** Update note content (used by auto-save) */
export async function updateNoteContent(
 supabase: SupabaseClient,
 noteId: string,
 content: Record<string, unknown>,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ content, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  console.error("[NotesService] update content error:", error);
  return false;
 }
 return true;
}

/** Update note title */
export async function updateNoteTitle(
 supabase: SupabaseClient,
 noteId: string,
 title: string,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ title, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  console.error("[NotesService] update title error:", error);
  return false;
 }
 return true;
}

/** Update note category */
export async function updateNoteCategory(
 supabase: SupabaseClient,
 noteId: string,
 category: NoteCategory,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ category, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  console.error("[NotesService] update category error:", error);
  return false;
 }
 return true;
}

/** Delete a note */
export async function deleteNote(supabase: SupabaseClient, noteId: string): Promise<boolean> {
 const { error } = await supabase.from("notes").delete().eq("id", noteId);

 if (error) {
  console.error("[NotesService] delete error:", error);
  return false;
 }
 return true;
}

/** Update reading content (split view left pane) */
export async function updateReadingContent(
 supabase: SupabaseClient,
 noteId: string,
 readingContent: Record<string, unknown> | null,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({
   reading_content: readingContent,
   updated_at: new Date().toISOString(),
  })
  .eq("id", noteId);

 if (error) {
  console.error("[NotesService] update reading content error:", error);
  return false;
 }
 return true;
}

/** Update split view enabled state */
export async function updateSplitViewEnabled(
 supabase: SupabaseClient,
 noteId: string,
 enabled: boolean,
): Promise<boolean> {
 const { error } = await supabase
  .from("notes")
  .update({ split_view_enabled: enabled, updated_at: new Date().toISOString() })
  .eq("id", noteId);

 if (error) {
  console.error("[NotesService] update split view state error:", error);
  return false;
 }
 return true;
}

/** Resolve a short_id to the full note (for URL redirects) */
export async function getNoteByShortId(
 supabase: SupabaseClient,
 shortId: string,
 userId: string,
): Promise<Pick<DbNote, "id" | "short_id"> | null> {
 const { data, error } = await supabase
  .from("notes")
  .select("id, short_id")
  .eq("short_id", shortId)
  .eq("user_id", userId)
  .single();

 if (error) {
  console.error("[NotesService] fetch by short_id error:", error);
  return null;
 }
 return data as Pick<DbNote, "id" | "short_id">;
}

/** Search notes by title (for link-to-note feature) */
export async function searchNotesByTitle(
 supabase: SupabaseClient,
 userId: string,
 query: string,
 limit = 10,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select("id, title, tags, status, category, short_id, updated_at, linked_lesson_id")
  .eq("user_id", userId)
  .ilike("title", `%${query}%`)
  .order("updated_at", { ascending: false })
  .limit(limit);

 if (error) {
  console.error("[NotesService] search error:", error);
  return [];
 }
 return attachLessonLinks(supabase, userId, (data || []) as NoteListRow[]);
}

/* ══════════════════════════════════════════
   Lesson Note Links
   ══════════════════════════════════════════ */

export async function getNoteByLessonNoteLink(
 supabase: SupabaseClient,
 userId: string,
 targetKey: string,
 targetType: LessonNoteTargetType = "hanzihome_lesson",
 relationType: LessonNoteRelationType = "main",
): Promise<DbNote | null> {
 const { data, error } = await supabase
  .from("lesson_note_links")
  .select("note_id")
  .eq("user_id", userId)
  .eq("target_type", targetType)
  .eq("target_key", targetKey)
  .eq("relation_type", relationType)
  .maybeSingle();

 if (error) {
  console.error("[NotesService] fetch lesson note link error:", error);
  return null;
 }

 const noteId = (data as { note_id?: string } | null)?.note_id;
 if (!noteId) return null;

 return getNoteById(supabase, noteId, userId);
}

export async function linkNoteToLessonTarget(
 supabase: SupabaseClient,
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
  console.error("[NotesService] select lesson note link error:", selectError);
  return false;
 }

 if ((existingLink as { id?: string } | null)?.id) {
  const { error: updateError } = await supabase
   .from("lesson_note_links")
   .update({
    note_id: input.noteId,
    updated_at: new Date().toISOString(),
   })
   .eq("id", (existingLink as { id: string }).id);

  if (updateError) {
   console.error("[NotesService] update lesson note link error:", updateError);
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
  console.error("[NotesService] insert lesson note link error:", insertError);
  return false;
 }

 return true;
}
