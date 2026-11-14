import { expect, it } from "vitest";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import {
 countRadicalStrokeFilters,
 countRadicalSupportingItems,
 filterRadicals,
} from "./radical-workspace-utils";

const radicals: StaticRadicalData[] = [
 {
  id: "water",
  index: 85,
  radical: "水",
  nameVi: "Thủy",
  strokes: 4,
  coreMeaning: { modern: "Nước" },
  variants: [{ form: "氵", note: "ba chấm" }],
  distinguish: [],
 },
 {
  id: "ground",
  index: 32,
  radical: "土",
  strokes: 3,
  coreMeaning: {},
  variants: [],
  distinguish: [],
 },
 { id: "unset", index: 1, radical: "一", coreMeaning: {}, variants: [], distinguish: [] },
];
it("keeps missing strokes only in the all bucket and preserves input order", () => {
 expect(filterRadicals(radicals, "", "all").map((item) => item.id)).toEqual([
  "water",
  "ground",
  "unset",
 ]);
 expect(filterRadicals(radicals, "", "4").map((item) => item.id)).toEqual(["water"]);
 const counts = countRadicalStrokeFilters(radicals);
 expect(counts.get("all")).toBe(3);
 expect(counts.get("4")).toBe(1);
 expect(counts.get("7+")).toBe(0);
});
it("searches learner aliases and meaning with the original trimmed lowercase semantics", () => {
 expect(filterRadicals(radicals, " THỦY ", "all").map((item) => item.id)).toEqual(["water"]);
 expect(filterRadicals(radicals, "氵", "4").map((item) => item.id)).toEqual(["water"]);
 expect(filterRadicals(radicals, "nước", "3")).toEqual([]);
});
it("counts variant, related and grouped items while keeping absent lists empty", () => {
 const radical = radicals[0];
 if (!radical) throw new Error("Missing water radical");
 expect(countRadicalSupportingItems(radical)).toBe(1);
 expect(
  countRadicalSupportingItems({
   ...radical,
   relatedComponents: [{ form: "冰", note: "ice" }],
   groups: [{ name: "water", chars: ["河", "海"] }],
  }),
 ).toBe(4);
});
