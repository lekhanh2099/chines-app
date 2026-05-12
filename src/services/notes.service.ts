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

export type NoteListItem = Pick<
 DbNote,
 "id" | "title" | "tags" | "status" | "category" | "short_id" | "updated_at"
>;

export type CreateNoteInput = {
 title: string;
 tags: string[];
 category?: NoteCategory;
 content?: Record<string, unknown>;
};

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
  .select("id, title, tags, status, category, short_id, updated_at")
  .eq("user_id", userId)
  .order("updated_at", { ascending: false });

 if (error) {
  console.error("[NotesService] fetch error:", error);
  return [];
 }

 return (data || []) as NoteListItem[];
}

/** Fetch notes by category */
export async function getNotesByCategory(
 supabase: SupabaseClient,
 userId: string,
 category: NoteCategory,
): Promise<NoteListItem[]> {
 const { data, error } = await supabase
  .from("notes")
  .select("id, title, tags, status, category, short_id, updated_at")
  .eq("user_id", userId)
  .eq("category", category)
  .order("updated_at", { ascending: false });

 if (error) {
  console.error("[NotesService] fetch by category error:", error);
  return [];
 }

 return (data || []) as NoteListItem[];
}

/** Fetch a single note by ID */
export async function getNoteById(
 supabase: SupabaseClient,
 noteId: string,
 userId: string,
): Promise<DbNote | null> {
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

 return data as DbNote;
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
export async function deleteNote(
 supabase: SupabaseClient,
 noteId: string,
): Promise<boolean> {
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
 readingContent: Record<string, unknown>,
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
  .select("id, title, tags, status, category, short_id, updated_at")
  .eq("user_id", userId)
  .ilike("title", `%${query}%`)
  .order("updated_at", { ascending: false })
  .limit(limit);

 if (error) {
  console.error("[NotesService] search error:", error);
  return [];
 }
 return (data || []) as NoteListItem[];
}
