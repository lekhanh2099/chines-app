import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
 fetchPdfAnnotation,
 savePdfAnnotation,
 PdfAnnotationConflictError,
} from "./pdf-annotation-api";

const fetchRequest = vi.fn<typeof fetch>();
const ownerId = "22222222-2222-4222-8222-222222222222";
const input = {
 assetId: "asset-1",
 pageNumber: 1,
 payload: { strokes: [] },
 expectedRevision: 0,
 expectedAbsent: true,
};

beforeEach(() => {
 fetchRequest.mockReset();
 vi.stubGlobal("fetch", fetchRequest);
});
afterEach(() => vi.unstubAllGlobals());

describe("PDF annotation transport", () => {
 it("keeps guest GET empty while rejecting an unauthenticated PUT", async () => {
  fetchRequest.mockResolvedValue(new Response(null, { status: 401 }));
  await expect(
   fetchPdfAnnotation({ assetId: input.assetId, pageNumber: input.pageNumber }, ownerId),
  ).resolves.toBeNull();
  await expect(savePdfAnnotation(input, ownerId)).rejects.toThrow("Không lưu được ghi chú PDF");
 });
 it.each([403, 409, 503])("propagates failed write status %s", async (status) => {
  fetchRequest.mockResolvedValue(new Response(null, { status }));
  await expect(savePdfAnnotation(input, ownerId)).rejects.toThrow();
 });
 it("requires a real acknowledgement even for HTTP 200", async () => {
  fetchRequest.mockResolvedValue(Response.json({ annotation: null }));
  await expect(savePdfAnnotation(input, ownerId)).rejects.toThrow("Server chưa xác nhận");
 });
 it.each([0, 1])(
  "validates initial and updated acknowledgements at revision %s",
  async (revision) => {
   const annotation = {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    asset_id: "asset-1",
    page_number: 1,
    payload: { strokes: [] },
    revision,
    created_at: "2026-10-04T00:00:00Z",
    updated_at: "2026-10-04T00:00:00Z",
   };
   const write = { ...input, expectedAbsent: revision === 0 };
   fetchRequest.mockResolvedValue(Response.json({ annotation }));
   await expect(savePdfAnnotation(write, ownerId)).resolves.toEqual(annotation);
   expect(fetchRequest).toHaveBeenCalledWith(
    "/api/reading/pdf/annotations",
    expect.objectContaining({
     method: "PUT",
     body: JSON.stringify(write),
     headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerId },
    }),
   );
   fetchRequest.mockResolvedValue(Response.json({ annotation: { ...annotation, revision: 3 } }));
   await expect(savePdfAnnotation(write, ownerId)).rejects.toThrow("không khớp thao tác lưu");
   fetchRequest.mockResolvedValue(
    Response.json({ annotation: { ...annotation, revision: revision === 0 ? 1 : 0 } }),
   );
   await expect(savePdfAnnotation(write, ownerId)).rejects.toThrow("không khớp thao tác lưu");
   fetchRequest.mockResolvedValue(
    Response.json({
     annotation: {
      ...annotation,
      payload: {
       strokes: [
        { id: "different", tool: "pen", color: "#ff0000", width: 4, points: [{ x: 0.1, y: 0.2 }] },
       ],
      },
     },
    }),
   );
   await expect(savePdfAnnotation(write, ownerId)).rejects.toThrow("không khớp thao tác lưu");
  },
 );
 it("retains the full conflict snapshot and rejects a different owner's snapshot", async () => {
  const annotation = {
   id: "11111111-1111-4111-8111-111111111111",
   user_id: ownerId,
   asset_id: input.assetId,
   page_number: input.pageNumber,
   revision: 0,
   payload: {
    strokes: [
     {
      id: "other-device",
      tool: "pen",
      color: "#ff0000",
      width: 4,
      points: [
       { x: 0.1, y: 0.2 },
       { x: 0.3, y: 0.4 },
      ],
     },
    ],
   },
   created_at: "2026-10-08T00:00:00Z",
   updated_at: "2026-10-08T00:00:00Z",
  };
  fetchRequest.mockImplementation(async () => Response.json({ annotation }, { status: 409 }));
  await expect(savePdfAnnotation(input, ownerId)).rejects.toBeInstanceOf(
   PdfAnnotationConflictError,
  );
  await expect(savePdfAnnotation(input, ownerId)).rejects.toMatchObject({ annotation });
  fetchRequest.mockResolvedValue(
   Response.json(
    { annotation: { ...annotation, user_id: "33333333-3333-4333-8333-333333333333" } },
    { status: 409 },
   ),
  );
  await expect(savePdfAnnotation(input, ownerId)).rejects.toThrow("không thuộc tài khoản");
 });
});
