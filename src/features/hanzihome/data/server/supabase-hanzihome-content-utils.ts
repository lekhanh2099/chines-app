import "server-only";

import type { StaticRadicalData } from "@/features/hanzihome/types";
import type { RadicalRow } from "./supabase-content-row.schemas";

export function radicalRowToViewModel(row: RadicalRow): StaticRadicalData {
 return {
  id: row.id,
  index: row.radical_index,
  radical: row.radical,
  nameVi: row.name_vi ?? undefined,
  strokes: row.strokes,
  coreMeaning: row.core_meaning,
  recognition: row.recognition ?? undefined,
  variants: row.variants,
  relatedComponents: row.related_components,
  distinguish: row.distinguish,
  groups: row.groups,
  editMeta: {
   entityType: "radical",
   entityId: row.id,
   dbId: row.id,
   updatedAt: row.updated_at,
   order: row.radical_index,
   orderField: "radical_index",
  },
 };
}

export function matchesTextQuery(values: string[], query: string) {
 const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
 return (
  !normalizedQuery ||
  values.some((value) => value.toLocaleLowerCase("vi-VN").includes(normalizedQuery))
 );
}
