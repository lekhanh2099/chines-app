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
 "id" | "title" | "tags" | "status" | "category" | "updated_at"
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
  .select("id, title, tags, status, category, updated_at")
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
  .select("id, title, tags, status, category, updated_at")
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
