import type { NoteCategory } from "@/types/database";

export const noteQueryKeys = {
 root: ["notes"],
 listRoot: ["notes-list"],
 list: (category?: NoteCategory) => ["notes-list", category ?? "all"],
 detail: (noteId: string) => ["note-detail", noteId],
 recent: (limit: number) => ["notes", "recent", limit],
 folders: ["notes", "folders"],
 lessonLinkedRoot: ["lesson-linked-note"],
 lessonLinked: (lessonIds: string[], relationType: string) => [
  "lesson-linked-note",
  lessonIds,
  relationType,
 ],
};
