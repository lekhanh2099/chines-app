import { BookOpenText } from "lucide-react";
import { describe, expect, it } from "vitest";

import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import {
 groupReaderWorkspaceTabs,
 readerSurfaceAnnotations,
 type ReaderWorkspaceTabItem,
} from "./reader-document-study-model";

const tabs: ReaderWorkspaceTabItem[] = [
 { id: "overview", label: "Overview", icon: BookOpenText },
 { id: "reader", label: "Reader", icon: BookOpenText },
 { id: "exercises", label: "Exercises", icon: BookOpenText },
 { id: "translation", label: "Translation", icon: BookOpenText },
 { id: "notes", label: "Notes", icon: BookOpenText },
 { id: "summary", label: "Summary", icon: BookOpenText },
];

const annotation: ReaderAnnotationRow = {
 id: "ann-1",
 user_id: "user-1",
 document_id: "doc-1",
 paragraph_id: "seg-1",
 asset_id: null,
 annotation_type: "note",
 page_number: null,
 start_offset: 0,
 end_offset: 2,
 selected_text: "你好",
 note_text: "note",
 color: "yellow",
 payload: {},
 created_at: "2026-09-10T00:00:00.000Z",
 updated_at: "2026-09-10T00:00:00.000Z",
 deleted_at: null,
 revision: 1,
};

describe("groupReaderWorkspaceTabs", () => {
 it("splits tabs into reading, practice and resource groups in source order", () => {
  const groups = groupReaderWorkspaceTabs(tabs, "reader");
  expect(groups.readingTabs.map((item) => item.id)).toEqual(["reader", "summary"]);
  expect(groups.practiceTabs.map((item) => item.id)).toEqual(["exercises", "translation"]);
  expect(groups.resourceTabs.map((item) => item.id)).toEqual(["overview", "notes"]);
  expect(groups.activeGroup).toBe("reader");
  expect(groups.activeGroupTabs).toBe(groups.readingTabs);
 });

 it("resolves the group of the active tab and falls back to resources", () => {
  expect(groupReaderWorkspaceTabs(tabs, "translation").activeGroup).toBe("exercises");
  expect(groupReaderWorkspaceTabs(tabs, "notes").activeGroup).toBe("vocabulary");
  expect(groupReaderWorkspaceTabs([], "reader").activeGroup).toBe("vocabulary");
 });
});

describe("readerSurfaceAnnotations", () => {
 it("maps ranged annotations to Reader surface marks", () => {
  expect(readerSurfaceAnnotations([annotation])).toEqual([
   {
    id: "ann-1",
    segmentId: "seg-1",
    text: "你好",
    noteText: "note",
    start: 0,
    end: 2,
    color: "yellow",
   },
  ]);
 });

 it("drops annotations without a usable paragraph range", () => {
  expect(
   readerSurfaceAnnotations([
    { ...annotation, id: "no-paragraph", paragraph_id: null },
    { ...annotation, id: "no-start", start_offset: null },
    { ...annotation, id: "empty-range", start_offset: 2, end_offset: 2 },
    { ...annotation, id: "no-text", selected_text: "" },
   ]),
  ).toEqual([]);
 });
});
