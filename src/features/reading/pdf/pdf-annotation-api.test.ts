import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPdfAnnotation, savePdfAnnotation } from "./pdf-annotation-api";

const fetchRequest = vi.fn<typeof fetch>();
const input = { assetId: "asset-1", pageNumber: 1, payload: { strokes: [] }, expectedRevision: 0 };

beforeEach(() => {
 fetchRequest.mockReset();
 vi.stubGlobal("fetch", fetchRequest);
});
afterEach(() => vi.unstubAllGlobals());

describe("PDF annotation transport", () => {
 it("keeps guest GET empty while rejecting an unauthenticated PUT", async () => {
  fetchRequest.mockResolvedValue(new Response(null, { status: 401 }));
  await expect(
   fetchPdfAnnotation({ assetId: input.assetId, pageNumber: input.pageNumber }),
  ).resolves.toBeNull();
  await expect(savePdfAnnotation(input)).rejects.toThrow("Không lưu được ghi chú PDF");
 });
 it.each([403, 409, 503])("propagates failed write status %s", async (status) => {
  fetchRequest.mockResolvedValue(new Response(null, { status }));
  await expect(savePdfAnnotation(input)).rejects.toThrow();
 });
 it("requires a real acknowledgement even for HTTP 200", async () => {
  fetchRequest.mockResolvedValue(Response.json({ annotation: null }));
  await expect(savePdfAnnotation(input)).rejects.toThrow("Server chưa xác nhận");
 });
 it("validates the acknowledged row and preserves the revision request", async () => {
  const annotation = {
   id: "11111111-1111-4111-8111-111111111111",
   user_id: "22222222-2222-4222-8222-222222222222",
   asset_id: "asset-1",
   page_number: 1,
   payload: { strokes: [] },
   revision: 1,
   created_at: "2026-10-04T00:00:00Z",
   updated_at: "2026-10-04T00:00:00Z",
  };
  fetchRequest.mockResolvedValue(Response.json({ annotation }));
  await expect(savePdfAnnotation(input)).resolves.toEqual(annotation);
  expect(fetchRequest).toHaveBeenCalledWith(
   "/api/reading/pdf/annotations",
   expect.objectContaining({ method: "PUT", body: JSON.stringify(input) }),
  );
 });
});
