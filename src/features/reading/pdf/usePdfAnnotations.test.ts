import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePdfAnnotations } from "./usePdfAnnotations";
import type { enqueuePdfAnnotation, flushPendingPdfAnnotation } from "./pdf-annotation-outbox";
import { createPdfStroke, type PdfAnnotationRow } from "./pdf-annotations";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

const ownerId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({
 enqueue: vi.fn<typeof enqueuePdfAnnotation>(),
 flush: vi.fn<typeof flushPendingPdfAnnotation>(),
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "22222222-2222-4222-8222-222222222222", isResolved: true }),
}));
vi.mock("./pdf-annotation-api", async (importOriginal) => ({
 ...(await importOriginal<typeof import("./pdf-annotation-api")>()),
 fetchPdfAnnotation: async () => null,
}));
vi.mock("./pdf-annotation-outbox", () => ({
 enqueuePdfAnnotation: mocks.enqueue,
 flushPendingPdfAnnotation: mocks.flush,
 getPendingPdfAnnotation: async () => null,
}));
let client: QueryClient;
const key = hanzihomeQueryKeys.readerPdfAnnotation(ownerId, "asset-1", 1);
function controller() {
 const captures: ReturnType<typeof usePdfAnnotations>[] = [];
 function Probe() {
  captures.push(usePdfAnnotations({ assetId: "asset-1", pageNumber: 1 }));
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const hook = captures[0];
 if (!hook) throw new Error("Missing PDF hook");
 return hook;
}
beforeEach(() => {
 client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 client.setQueryData(key, null);
 mocks.enqueue.mockReset();
 mocks.enqueue.mockResolvedValue();
 mocks.flush.mockReset();
 mocks.flush.mockResolvedValue(null);
});
afterEach(() => client.clear());

describe("PDF durable write hook boundary", () => {
 it("commits under the authenticated owner and does not manufacture an acknowledgement", async () => {
  const stroke = createPdfStroke("pen", "#ff0000", 4, { x: 0.1, y: 0.1 });
  controller().replaceStrokes([stroke]);
  await vi.waitFor(() => expect(mocks.flush).toHaveBeenCalled());
  expect(mocks.enqueue).toHaveBeenCalledWith(
   {
    assetId: "asset-1",
    pageNumber: 1,
    payload: { strokes: [stroke] },
    expectedRevision: 0,
    expectedAbsent: true,
   },
   ownerId,
  );
  expect(client.getQueryData(key)).toBeNull();
 });
 it("publishes only the acknowledged row and retries a failed drain", async () => {
  const hook = controller();
  mocks.flush.mockRejectedValueOnce(new Error("Save failed"));
  await expect(hook.retrySave()).rejects.toThrow("Save failed");
  expect(client.getQueryData(key)).toBeNull();
  const saved: PdfAnnotationRow = {
   id: "11111111-1111-4111-8111-111111111111",
   user_id: ownerId,
   asset_id: "asset-1",
   page_number: 1,
   payload: { strokes: [] },
   revision: 1,
   created_at: "2026-10-08T00:00:00Z",
   updated_at: "2026-10-08T00:00:00Z",
  };
  mocks.flush.mockResolvedValueOnce(saved);
  await hook.retrySave();
  expect(client.getQueryData(key)).toEqual(saved);
 });
});
