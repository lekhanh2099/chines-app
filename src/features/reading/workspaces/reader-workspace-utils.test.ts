import { expect, it } from "vitest";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";
import { readerDocumentRowSchema } from "../model/reading-resource.schemas";
import type { ReaderDocumentRow } from "../model/reading-resource.schemas";
import { groupReaderDocumentsByUnit } from "./reader-workspace-utils";

const base = readerDocumentRowSchema.array().parse(studioSeed.reader.documents)[0];
if (!base) throw new Error("Missing Reader corpus");
function document(
 id: string,
 unit: ReaderDocumentRow["unit_id"],
 number: ReaderDocumentRow["reading_number"],
): ReaderDocumentRow {
 return { ...base, id, unit_id: unit, reading_number: number };
}

it("groups by unit in numeric order with unassigned documents last", () => {
 const documents = [
  document("ten", "U10", 1),
  document("other", null, 1),
  document("later", "U2", 2),
  document("unnumbered", "U2", null),
  document("first", "U2", 1),
 ];
 const groups = groupReaderDocumentsByUnit(documents);
 expect(groups.map((group) => group.id)).toEqual(["U2", "U10", "other"]);
 expect(groups[0]?.documents.map((item) => item.id)).toEqual(["first", "later", "unnumbered"]);
 expect(documents.map((item) => item.id)).toEqual(["ten", "other", "later", "unnumbered", "first"]);
});

it("returns no groups for an empty catalog", () => {
 expect(groupReaderDocumentsByUnit([])).toEqual([]);
});
