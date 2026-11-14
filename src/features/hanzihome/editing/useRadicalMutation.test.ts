import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { updateRadical } from "./radical-edit-api";
import { HanziHomeMutationError } from "./mutation-error";
import { useRadicalMutation } from "./useRadicalMutation";
import { hanzihomeQueryKeys } from "../query-keys";

const mocks = vi.hoisted(() => ({ update: vi.fn<typeof updateRadical>() }));
vi.mock("./radical-edit-api", () => ({ updateRadical: mocks.update }));
let client: QueryClient;
const input: Parameters<typeof updateRadical>[0] = {
 radical: {
  id: "water",
  index: 85,
  radical: "水",
  coreMeaning: {},
  variants: [],
  distinguish: [],
  editMeta: {
   entityType: "radical",
   entityId: "water",
   dbId: "water",
   updatedAt: "2026-10-04T00:00:00Z",
  },
 },
 changes: { strokes: 5 },
};
function controller() {
 const captures: ReturnType<typeof useRadicalMutation>[] = [];
 function Probe() {
  captures.push(useRadicalMutation());
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const hook = captures[0];
 if (!hook) throw new Error("Missing radical mutation hook");
 return hook;
}
beforeEach(() => {
 client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
 client.setQueryData(hanzihomeQueryKeys.catalogRoot, []);
 client.setQueryData(hanzihomeQueryKeys.searchIndexRoot, []);
 mocks.update.mockReset();
});
afterEach(() => client.clear());

it("invalidates catalog and search only after an acknowledged save", async () => {
 mocks.update.mockResolvedValue({ item: { id: "water", updated_at: "2026-10-04T00:01:00Z" } });
 await controller().mutateAsync(input);
 expect(mocks.update).toHaveBeenCalledWith(input, expect.anything());
 expect(client.getQueryState(hanzihomeQueryKeys.catalogRoot)?.isInvalidated).toBe(true);
 expect(client.getQueryState(hanzihomeQueryKeys.searchIndexRoot)?.isInvalidated).toBe(true);
});

it("rejects a conflict and refreshes only the catalog revision", async () => {
 mocks.update.mockRejectedValue(new HanziHomeMutationError("Conflict", 409));
 await expect(controller().mutateAsync(input)).rejects.toThrow("Conflict");
 expect(client.getQueryState(hanzihomeQueryKeys.catalogRoot)?.isInvalidated).toBe(true);
 expect(client.getQueryState(hanzihomeQueryKeys.searchIndexRoot)?.isInvalidated).toBe(false);
});

it("retains cache state on a failed write instead of announcing a successful refresh", async () => {
 mocks.update.mockRejectedValue(new HanziHomeMutationError("Unavailable", 503));
 await expect(controller().mutateAsync(input)).rejects.toThrow("Unavailable");
 expect(client.getQueryState(hanzihomeQueryKeys.catalogRoot)?.isInvalidated).toBe(false);
 expect(client.getQueryState(hanzihomeQueryKeys.searchIndexRoot)?.isInvalidated).toBe(false);
});
