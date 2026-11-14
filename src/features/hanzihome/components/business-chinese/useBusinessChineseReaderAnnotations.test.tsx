import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { fetchReaderAnnotations } from "@/features/reading/services/reading-annotation-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { useBusinessChineseReaderAnnotations } from "./useBusinessChineseReaderAnnotations";

const api = vi.hoisted(() => ({
 fetch: vi.fn<typeof fetchReaderAnnotations>(),
 userId: "owner-1",
 isResolved: true,
}));
vi.mock("@/features/reading/services/reading-annotation-api", () => ({
 fetchReaderAnnotations: api.fetch,
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: api.userId, isResolved: api.isResolved }),
}));
let client: QueryClient;
function controller(documentId: string) {
 const captures: ReturnType<typeof useBusinessChineseReaderAnnotations>[] = [];
 function Probe() {
  captures.push(useBusinessChineseReaderAnnotations(documentId));
  return null;
 }
 renderToStaticMarkup(
  <QueryClientProvider client={client}>
   <Probe />
   <Probe />
  </QueryClientProvider>,
 );
 const query = client
  .getQueryCache()
  .find({ queryKey: hanzihomeQueryKeys.readerAnnotations(api.userId, documentId) });
 if (!query) throw new Error("Missing annotation query");
 const result = captures[0];
 if (!result) throw new Error("Missing annotation observer");
 return { query, result };
}
beforeEach(() => {
 client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 api.fetch.mockReset().mockResolvedValue([]);
 api.userId = "owner-1";
 api.isResolved = true;
});
afterEach(() => client.clear());
it("deduplicates consumers and preserves account/document query isolation", async () => {
 const { query: first } = controller("lesson:text");
 await Promise.all([first.fetch(), first.fetch()]);
 expect(api.fetch).toHaveBeenCalledExactlyOnceWith("owner-1", "lesson:text");
 expect(first.state.data).toEqual([]);
 api.userId = "owner-2";
 const { query: second } = controller("lesson:text");
 await second.fetch();
 expect(api.fetch).toHaveBeenLastCalledWith("owner-2", "lesson:text");
 expect(first).not.toBe(second);
 expect(controller("other:text").query).not.toBe(second);
});
it("disables unauthenticated/unresolved loading and keeps request failure visible to Query", async () => {
 api.isResolved = false;
 expect(controller("unresolved").result.isEnabled).toBe(false);
 api.isResolved = true;
 api.userId = "";
 expect(controller("guest").result.isEnabled).toBe(false);
 api.userId = "owner-1";
 api.fetch.mockRejectedValueOnce(new Error("read failed"));
 const { query } = controller("failure");
 await expect(query.fetch()).rejects.toThrow("read failed");
 expect(query.state.status).toBe("error");
 expect(query.options.retry).toBe(false);
});
