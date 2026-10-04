import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";
import { getDictionarySrsCollection } from "./dictionary-srs-api";

let client: SupabaseClient<Database>;
const fetchRequest = vi.fn<typeof fetch>();
beforeEach(() => {
 fetchRequest.mockReset();
 client = createClient<Database>("https://srs-test.supabase.co", "test-key", {
  db: { retry: false },
  global: { fetch: fetchRequest },
  auth: { persistSession: false, autoRefreshToken: false },
 });
});

describe("dictionary collection error boundaries", () => {
 it("loads 1001 saved rows and bounds each vocabulary identity request to 200", async () => {
  const requests: URL[] = [];
  const progress = Array.from({ length: 1001 }, (_, index) => ({
   vocab_id: `v-${index}`,
   dictionary_id: null,
   is_favorited: true,
  }));
  fetchRequest.mockImplementation(async (input) => {
   const url = new URL(input instanceof Request ? input.url : String(input));
   requests.push(url);
   if (url.pathname.endsWith("/user_vocab_progress")) {
    const offset = Number(url.searchParams.get("offset") ?? 0);
    return Response.json(progress.slice(offset, offset + 1000));
   }
   const ids = (url.searchParams.get("id") ?? "").slice(4, -1).split(",");
   return Response.json(ids.map((id) => ({ id, hanzi: `词${id.slice(2)}` })));
  });
  const collection = await getDictionarySrsCollection(client, "user-1");
  expect(collection.missingSchema).toBe(false);
  expect(collection.savedItems).toHaveLength(1001);
  expect(collection.savedItems.at(-1)?.hanzi).toBe("词1000");
  const progressRequests = requests.filter((request) =>
   request.pathname.endsWith("/user_vocab_progress"),
  );
  expect(progressRequests).toHaveLength(2);
  expect(progressRequests[0]?.searchParams.get("order")).toBe("updated_at.desc,vocab_id.asc");
  expect(progressRequests[1]?.searchParams.get("offset")).toBe("1000");
  const resources = requests.filter((request) => request.pathname.endsWith("/vocabularies"));
  expect(resources).toHaveLength(6);
  expect(
   resources.every((request) => (request.searchParams.get("id") ?? "").split(",").length <= 200),
  ).toBe(true);
 });
 it("rejects a failed later progress page instead of returning the first 1000 rows", async () => {
  fetchRequest.mockResolvedValueOnce(
   Response.json(Array.from({ length: 1000 }, (_, index) => ({ vocab_id: `v-${index}` }))),
  );
  fetchRequest.mockResolvedValueOnce(
   Response.json({ code: "XX000", message: "Later page failed" }, { status: 503 }),
  );
  await expect(getDictionarySrsCollection(client, "user-1")).rejects.toMatchObject({
   code: "XX000",
  });
  expect(fetchRequest).toHaveBeenCalledTimes(2);
 });
 it("distinguishes genuine empty data from a missing progress table", async () => {
  fetchRequest.mockResolvedValueOnce(Response.json([]));
  await expect(getDictionarySrsCollection(client, "user-1")).resolves.toEqual({
   savedItems: [],
   missingSchema: false,
  });
  fetchRequest.mockResolvedValueOnce(
   Response.json({ code: "42P01", message: "Missing table" }, { status: 404 }),
  );
  await expect(getDictionarySrsCollection(client, "user-1")).resolves.toEqual({
   savedItems: [],
   missingSchema: true,
  });
 });
 it("propagates a transient progress failure without attempting legacy fallback", async () => {
  fetchRequest.mockResolvedValue(
   Response.json({ code: "XX000", message: "Unavailable" }, { status: 503 }),
  );
  await expect(getDictionarySrsCollection(client, "user-1")).rejects.toMatchObject({
   code: "XX000",
  });
  expect(fetchRequest).toHaveBeenCalledOnce();
 });
 it("uses legacy fallback only for missing columns and propagates its failure", async () => {
  fetchRequest
   .mockResolvedValueOnce(
    Response.json({ code: "42703", message: "Missing column" }, { status: 400 }),
   )
   .mockResolvedValueOnce(Response.json({ code: "42501", message: "Denied" }, { status: 403 }));
  await expect(getDictionarySrsCollection(client, "user-1")).rejects.toMatchObject({
   code: "42501",
  });
  expect(fetchRequest).toHaveBeenCalledTimes(2);
 });
 it("propagates a vocabulary resource failure instead of rendering an empty collection", async () => {
  fetchRequest
   .mockResolvedValueOnce(
    Response.json([{ vocab_id: "v-1", dictionary_id: null, is_favorited: true }]),
   )
   .mockResolvedValueOnce(
    Response.json({ code: "XX000", message: "Unavailable" }, { status: 503 }),
   );
  await expect(getDictionarySrsCollection(client, "user-1")).rejects.toMatchObject({
   code: "XX000",
  });
 });
 it("rejects malformed progress rows and unresolved saved entries", async () => {
  fetchRequest.mockResolvedValueOnce(Response.json([{ vocab_id: 4 }]));
  await expect(getDictionarySrsCollection(client, "user-1")).rejects.toThrow();
  fetchRequest
   .mockResolvedValueOnce(Response.json([{ vocab_id: "v-1", dictionary_id: null }]))
   .mockResolvedValueOnce(Response.json([]));
  await expect(getDictionarySrsCollection(client, "user-1")).rejects.toThrow(
   "could not be resolved",
  );
 });
});
