import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePdfAnnotations } from "./usePdfAnnotations";
import type { savePdfAnnotation, PdfAnnotationPayloadInput } from "./pdf-annotation-api";
import { createPdfStroke, type PdfAnnotationRow } from "./pdf-annotations";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

const mocks = vi.hoisted(() => ({ save: vi.fn<typeof savePdfAnnotation>() }));
vi.mock("./pdf-annotation-api", () => ({
 fetchPdfAnnotation: async () => null,
 savePdfAnnotation: mocks.save,
}));
let client: QueryClient;
const key = hanzihomeQueryKeys.readerPdfAnnotation("asset-1", 1);
function saved(input: PdfAnnotationPayloadInput): PdfAnnotationRow {
 return {
  id: "11111111-1111-4111-8111-111111111111",
  user_id: "22222222-2222-4222-8222-222222222222",
  asset_id: input.assetId,
  page_number: input.pageNumber,
  payload: input.payload,
  revision: input.expectedRevision + 1,
  created_at: "2026-10-04T00:00:00Z",
  updated_at: "2026-10-04T00:00:00Z",
 };
}
// Exercises actual callbacks and request coalescing, not mounted effects or UI.
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
 mocks.save.mockReset();
 mocks.save.mockImplementation(async (input) => saved(input));
});
afterEach(() => client.clear());

describe("PDF pending write lifecycle", () => {
 it("retains the latest intent after failure and retries it explicitly", async () => {
  let rejectRequest = (_error: Error) => {};
  mocks.save.mockImplementationOnce(
   () =>
    new Promise<PdfAnnotationRow>((_resolve, reject) => {
     rejectRequest = reject;
    }),
  );
  const hook = controller();
  const first = createPdfStroke("pen", "#ff0000", 4, { x: 0.1, y: 0.1 });
  const latest = createPdfStroke("pen", "#ff0000", 4, { x: 0.2, y: 0.2 });
  hook.replaceStrokes([first]);
  hook.replaceStrokes([first, latest]);
  rejectRequest(new Error("Save failed"));
  await hook.retrySave();
  expect(mocks.save).toHaveBeenCalledTimes(2);
  expect(mocks.save.mock.calls[1]?.[0]).toMatchObject({
   payload: { strokes: [first, latest] },
   expectedRevision: 0,
  });
  expect(client.getQueryData<PdfAnnotationRow>(key)?.payload.strokes).toEqual([first, latest]);
 });
 it("coalesces intermediate edits and advances the acknowledged revision", async () => {
  let resolveRequest = (_row: PdfAnnotationRow) => {};
  mocks.save.mockImplementationOnce(
   () =>
    new Promise<PdfAnnotationRow>((resolve) => {
     resolveRequest = resolve;
    }),
  );
  const hook = controller();
  const first = createPdfStroke("pen", "#ff0000", 4, { x: 0.1, y: 0.1 });
  const last = createPdfStroke("pen", "#ff0000", 4, { x: 0.3, y: 0.3 });
  hook.replaceStrokes([first]);
  hook.replaceStrokes([]);
  hook.replaceStrokes([last]);
  resolveRequest(
   saved({ assetId: "asset-1", pageNumber: 1, payload: { strokes: [first] }, expectedRevision: 0 }),
  );
  await hook.retrySave();
  expect(mocks.save).toHaveBeenCalledTimes(2);
  expect(mocks.save.mock.calls[1]?.[0]).toMatchObject({
   payload: { strokes: [last] },
   expectedRevision: 1,
  });
  await hook.retrySave();
  expect(mocks.save).toHaveBeenCalledTimes(2);
 });
});
