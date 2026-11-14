import { describe, expect, it } from "vitest";

import { annotationErrorMessage, NoteDialogSchema } from "./annotation-note-dialog-model";

describe("annotation note dialog model", () => {
 it("explains a missing annotation migration", () => {
  expect(annotationErrorMessage({ code: "PGRST205" }, "Không thể lưu")).toBe(
   "Database chưa có migration ghi chú. Hãy đồng bộ migration rồi thử lại.",
  );
  expect(annotationErrorMessage({ code: "42883", message: "x" }, "Không thể lưu")).toBe(
   "Database chưa có migration ghi chú. Hãy đồng bộ migration rồi thử lại.",
  );
 });

 it("appends the error message to the fallback when present", () => {
  expect(annotationErrorMessage({ message: "timeout" }, "Không thể lưu")).toBe(
   "Không thể lưu: timeout",
  );
  expect(annotationErrorMessage({}, "Không thể lưu")).toBe("Không thể lưu");
  expect(annotationErrorMessage(null, "Không thể lưu")).toBe("Không thể lưu");
 });

 it("keeps the anchor dialog kind as the first discriminated option", () => {
  expect(NoteDialogSchema.options[0].shape.kind.value).toBe("anchor");
 });
});
