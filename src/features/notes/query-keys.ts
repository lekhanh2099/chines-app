import type { NoteCategory } from "@/types/database";

type UserScope = string | null;

export const noteQueryKeys = {
 root: (userId: UserScope) => ["notes", userId],
 listRoot: (userId: UserScope) => ["notes", userId, "list"],
 list: (userId: UserScope, category?: NoteCategory) => ["notes", userId, "list", category ?? "all"],
 detail: (userId: UserScope, noteId: string) => ["notes", userId, "detail", noteId],
 recent: (userId: UserScope, limit: number) => ["notes", userId, "recent", limit],
 folders: (userId: UserScope) => ["notes", userId, "folders"],
 lessonLinkedRoot: (userId: UserScope) => ["notes", userId, "lesson-linked"],
 lessonLinked: (userId: UserScope, lessonIds: string[], relationType: string) => [
  "notes",
  userId,
  "lesson-linked",
  lessonIds,
  relationType,
 ],
};
