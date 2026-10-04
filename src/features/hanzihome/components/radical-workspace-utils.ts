import { z } from "zod";
import type { StaticRadicalData } from "@/features/hanzihome/types";

export const StrokeFilterSchema = z.enum(["all", "1", "2", "3", "4", "5-6", "7+"]);
export type StrokeFilter = z.infer<typeof StrokeFilterSchema>;
function matchesStrokeFilter(strokes: StaticRadicalData["strokes"], filter: StrokeFilter) {
 if (filter === "all") return true;
 if (strokes == null) return false;
 if (filter === "5-6") return strokes >= 5 && strokes <= 6;
 if (filter === "7+") return strokes >= 7;
 return strokes === Number(filter);
}

function radicalSearchText(radical: StaticRadicalData) {
 return [
  radical.radical,
  radical.nameVi ?? "",
  radical.coreMeaning.history ?? "",
  radical.coreMeaning.modern ?? "",
  radical.recognition ?? "",
  radical.variants.map((variant) => `${variant.form} ${variant.note}`).join(" "),
  radical.relatedComponents?.map((component) => `${component.form} ${component.note}`).join(" ") ??
   "",
  radical.groups?.map((group) => `${group.name} ${group.chars.join(" ")}`).join(" ") ?? "",
 ]
  .join(" ")
  .toLowerCase();
}

export function filterRadicals(
 radicals: readonly StaticRadicalData[],
 searchValue: string,
 strokeFilter: StrokeFilter,
) {
 const keyword = searchValue.trim().toLowerCase();
 return radicals.filter(
  (radical) =>
   matchesStrokeFilter(radical.strokes, strokeFilter) &&
   (!keyword || radicalSearchText(radical).includes(keyword)),
 );
}
export function countRadicalStrokeFilters(radicals: readonly StaticRadicalData[]) {
 return new Map(
  Object.values(StrokeFilterSchema.enum).map((filter) => [
   filter,
   radicals.filter((radical) => matchesStrokeFilter(radical.strokes, filter)).length,
  ]),
 );
}

export function countRadicalSupportingItems(radical: StaticRadicalData) {
 return (
  radical.variants.length +
  (radical.relatedComponents?.length ?? 0) +
  (radical.groups?.reduce((total, group) => total + group.chars.length, 0) ?? 0)
 );
}
