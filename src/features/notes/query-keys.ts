import type { NoteCategory } from "@/types/database";

export const noteQueryKeys = {
 root: ["notes"] as const,
 listRoot: ["notes-list"] as const,
 list: (category?: NoteCategory) => ["notes-list", category ?? "all"] as const,
 detail: (noteId: string) => ["note-detail", noteId] as const,
 recent: (limit: number) => ["notes", "recent", limit] as const,
 folders: ["notes", "folders"] as const,
 lessonLinkedRoot: ["lesson-linked-note"] as const,
 lessonLinked: (lessonIds: string[], relationType: string) =>
  ["lesson-linked-note", lessonIds, relationType] as const,
};
