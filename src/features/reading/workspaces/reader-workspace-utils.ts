import type { ReaderDocumentRow } from "../model/reading-resource.schemas";

/**
 * Groups Reader documents by unit (`other` last, units in numeric order) and
 * orders each group by reading number, unnumbered readings last.
 */
export function groupReaderDocumentsByUnit(documents: ReadonlyArray<ReaderDocumentRow>) {
 const groups = new Map<string, ReaderDocumentRow[]>();
 for (const document of documents) {
  const groupId = document.unit_id ?? "other";
  const current = groups.get(groupId) ?? [];
  current.push(document);
  groups.set(groupId, current);
 }
 return [...groups.entries()]
  .sort(([left], [right]) => {
   if (left === "other") return 1;
   if (right === "other") return -1;
   return left.localeCompare(right, undefined, { numeric: true });
  })
  .map(([id, grouped]) => ({
   id,
   documents: grouped.sort(
    (left, right) =>
     (left.reading_number ?? Number.MAX_SAFE_INTEGER) -
     (right.reading_number ?? Number.MAX_SAFE_INTEGER),
   ),
  }));
}
