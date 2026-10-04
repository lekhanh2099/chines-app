import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { HanziHomeMutationError } from "./mutation-error";
import { updateRadical } from "./radical-edit-api";

const request = vi.fn<typeof fetch>();
const radical: StaticRadicalData = {
 id: "radical/water",
 index: 85,
 radical: "水",
 coreMeaning: {},
 variants: [],
 distinguish: [],
 editMeta: {
  entityType: "radical",
  entityId: "radical/water",
  dbId: "radical/water",
  updatedAt: "2026-10-04T00:00:00Z",
 },
};
beforeEach(() => {
 request.mockReset();
 vi.stubGlobal("fetch", request);
});
afterEach(() => vi.unstubAllGlobals());

describe("radical edit transport", () => {
 it("sends the existing optimistic concurrency contract and requires the matching row", async () => {
  const acknowledgement = { item: { id: radical.id, updated_at: "2026-10-04T00:01:00Z" } };
  request.mockResolvedValue(Response.json(acknowledgement));
  await expect(updateRadical({ radical, changes: { name_vi: "Thủy" } })).resolves.toEqual(
   acknowledgement,
  );
  expect(request).toHaveBeenCalledWith("/api/hanzihome/content/radicals/radical%2Fwater", {
   method: "PATCH",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({
    reason: "Cập nhật bộ thủ 水",
    expectedUpdatedAt: radical.editMeta?.updatedAt,
    changes: { name_vi: "Thủy" },
   }),
  });
 });

 it.each([401, 403, 409, 503])(
  "preserves HTTP %s rejection and conflict details",
  async (status) => {
   request.mockResolvedValue(
    Response.json({ error: "Rejected", details: { revision: 2 } }, { status }),
   );
   await expect(updateRadical({ radical, changes: { strokes: 5 } })).rejects.toEqual(
    new HanziHomeMutationError("Rejected", status, { revision: 2 }),
   );
  },
 );

 it.each([
  null,
  {},
  { item: null },
  { item: { id: radical.id } },
  { item: { id: radical.id, updated_at: "" } },
  { item: { id: "another-radical", updated_at: "2026-10-04T00:01:00Z" } },
 ])("rejects a 2xx body without an authoritative acknowledgement: %j", async (body) => {
  request.mockResolvedValue(Response.json(body));
  await expect(updateRadical({ radical, changes: { strokes: 5 } })).rejects.toThrow();
 });

 it("does not dispatch a write for a radical without a database revision", async () => {
  const { editMeta: _editMeta, ...withoutWriteTarget } = radical;
  await expect(
   updateRadical({ radical: withoutWriteTarget, changes: { strokes: 5 } }),
  ).rejects.toThrow("DB write target");
  expect(request).not.toHaveBeenCalled();
 });
});
