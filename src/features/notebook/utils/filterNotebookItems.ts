import type { NotebookItem } from "@/features/notebook/types";

export function filterNotebookItems(items: NotebookItem[], groupId: string, query: string) {
 const normalizedQuery = query.trim().toLocaleLowerCase("vi");

 return items.filter((item) => {
  if (groupId !== "all" && item.g !== groupId) return false;
  if (!normalizedQuery) return true;

  return [
   item.term,
   item.p,
   item.vi,
   item.essence,
   item.pattern,
   item.use,
   item.avoid,
   ...item.tags,
  ].some((value) => value.toLocaleLowerCase("vi").includes(normalizedQuery));
 });
}
