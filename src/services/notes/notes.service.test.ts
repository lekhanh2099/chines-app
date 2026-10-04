import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";
import {
 getNoteById,
 updateNoteContent,
 updateReadingContent,
 updateNoteTitle,
 updateNoteLibraryMetadata,
 getUserNotes,
 getNotesByCategory,
 getNoteFolders,
 type NoteListItem,
} from "./notes.service";

const fetchRequest = vi.fn<typeof fetch>();
const client = createClient<Database>("https://notes-test.supabase.co", "test-key", {
 global: { fetch: fetchRequest },
 auth: { persistSession: false, autoRefreshToken: false },
 db: { retry: false },
});

function requestUrl(input: Parameters<typeof fetch>[0]) {
 return new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
}
function listNote(index: number): Omit<NoteListItem, "links"> {
 return {
  id: `note-${String(index).padStart(4, "0")}`,
  title: `Note ${index}`,
  tags: [],
  status: "draft",
  category: "general",
  short_id: null,
  updated_at: "2026-10-04T00:00:00Z",
  linked_lesson_id: null,
  folder_id: null,
  reading_status: null,
  source_url: null,
  source_host: null,
  source_label: null,
  source_author: null,
  source_published_at: null,
  source_captured_at: null,
 };
}
describe("Notes complete collection reads", () => {
 it("loads 1001 notes across the configured row cap and bounds each link-ID batch", async () => {
  const notes = Array.from({ length: 1001 }, (_, index) => listNote(index));
  fetchRequest.mockImplementation(async (input) => {
   const url = requestUrl(input);
   if (url.pathname.endsWith("/notes")) {
    const from = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit"));
    expect(limit).toBe(1000);
    expect(url.searchParams.get("order")).toBe("updated_at.desc,id.asc");
    return Response.json(notes.slice(from, from + limit));
   }
   const ids = url.searchParams.get("note_id")?.slice(4, -1).split(",") ?? [];
   expect(ids.length).toBeLessThanOrEqual(200);
   expect(url.searchParams.get("limit")).toBe("1000");
   return Response.json([]);
  });
  const result = await getUserNotes(client, "user-1");
  expect(result).toHaveLength(1001);
  expect(result.at(-1)?.id).toBe("note-1000");
  expect(
   fetchRequest.mock.calls.filter(([input]) => requestUrl(input).pathname.endsWith("/notes")),
  ).toHaveLength(2);
  expect(
   fetchRequest.mock.calls.filter(([input]) =>
    requestUrl(input).pathname.endsWith("/lesson_note_links"),
   ),
  ).toHaveLength(6);
 });
 it("preserves the category filter on every page", async () => {
  fetchRequest.mockImplementation(async (input) => {
   const url = requestUrl(input);
   if (!url.pathname.endsWith("/notes")) return Response.json([]);
   expect(url.searchParams.get("category")).toBe("eq.general");
   const from = Number(url.searchParams.get("offset") ?? 0);
   return Response.json(
    from === 0 ? Array.from({ length: 1000 }, (_, index) => listNote(index)) : [listNote(1000)],
   );
  });
  await expect(getNotesByCategory(client, "user-1", "general")).resolves.toHaveLength(1001);
 });
 it("rejects a failed later page and a failed link read instead of returning partial data", async () => {
  fetchRequest.mockImplementation(async (input) => {
   const url = requestUrl(input);
   if (url.searchParams.get("offset") === "0")
    return Response.json(Array.from({ length: 1000 }, (_, index) => listNote(index)));
   return Response.json(
    { code: "42501", message: "Denied", details: "", hint: "" },
    { status: 403 },
   );
  });
  await expect(getUserNotes(client, "user-1")).rejects.toMatchObject({ code: "42501" });
  fetchRequest.mockImplementation(async (input) =>
   requestUrl(input).pathname.endsWith("/notes")
    ? Response.json([listNote(0)])
    : Response.json({ code: "42501", message: "Denied", details: "", hint: "" }, { status: 403 }),
  );
  await expect(getUserNotes(client, "user-1")).rejects.toMatchObject({ code: "42501" });
 });
 it("loads all folders beyond the configured cap with deterministic ties", async () => {
  fetchRequest.mockImplementation(async (input) => {
   const url = requestUrl(input);
   expect(url.searchParams.get("order")).toBe("position.asc,name.asc,id.asc");
   const from = Number(url.searchParams.get("offset") ?? 0);
   return Response.json(
    Array.from({ length: from === 0 ? 1000 : 1 }, (_, index) => ({
     id: `folder-${from + index}`,
     user_id: "user-1",
     parent_id: null,
     name: "Folder",
     color: "purple",
     position: 0,
     created_at: "2026-10-04T00:00:00Z",
     updated_at: "2026-10-04T00:00:00Z",
    })),
   );
  });
  await expect(getNoteFolders(client, "user-1")).resolves.toHaveLength(1001);
  expect(fetchRequest).toHaveBeenCalledTimes(2);
 });
});
beforeEach(() => {
 fetchRequest.mockReset();
});

describe("Notes service acknowledgements", () => {
 it("rejects a failed detail read instead of returning not-found", async () => {
  fetchRequest.mockResolvedValue(
   Response.json({ code: "42501", message: "Denied", details: "", hint: "" }, { status: 403 }),
  );
  await expect(getNoteById(client, "note-1", "user-1")).rejects.toMatchObject({ code: "42501" });
 });
 it("keeps a valid missing detail empty", async () => {
  fetchRequest.mockResolvedValue(Response.json([]));
  await expect(getNoteById(client, "note-1", "user-1")).resolves.toBeNull();
 });
 it("does not acknowledge content, reading or title when no row was updated", async () => {
  fetchRequest.mockImplementation(async () => Response.json([]));
  await expect(updateNoteContent(client, "note-1", { text: "unsaved" })).resolves.toBe(false);
  await expect(updateReadingContent(client, "note-1", null)).resolves.toBe(false);
  await expect(updateNoteTitle(client, "note-1", "New title")).resolves.toBe(false);
 });
 it("acknowledges an actual updated row", async () => {
  fetchRequest.mockResolvedValue(Response.json([{ id: "note-1" }]));
  await expect(updateNoteContent(client, "note-1", { text: "saved" })).resolves.toBe(true);
  const request = fetchRequest.mock.calls[0];
  expect(request?.[1]?.method).toBe("PATCH");
  expect(new Headers(request?.[1]?.headers).get("Prefer")).toBe("return=representation");
 });
 it("rejects a zero-row metadata import", async () => {
  fetchRequest.mockResolvedValue(Response.json([]));
  await expect(
   updateNoteLibraryMetadata(client, "note-1", { readingStatus: "reading" }),
  ).rejects.toThrow("not saved");
 });
});
