import { describe, expect, it } from "vitest";

import { getCanonicalChangesSchema, mutationEnvelopeSchema } from "./canonical-content.schema";

describe("canonical content mutation contracts", () => {
 it("allows a single vocab core field update", () => {
  const schema = getCanonicalChangesSchema("vocab_item", "update");

  expect(schema.safeParse({ meaning: "xin chào" }).success).toBe(true);
 });

 it("rejects parent and sibling fields from a vocab example update", () => {
  const schema = getCanonicalChangesSchema("vocab_example", "update");

  expect(schema.safeParse({ vocab_item_id: "vocab-1", vi: "xin chào" }).success).toBe(false);
  expect(schema.safeParse({ vi: "xin chào", lines: ["unrelated sibling"] }).success).toBe(false);
 });

 it("requires at least one changed field for updates", () => {
  const schema = getCanonicalChangesSchema("grammar_example", "update");

  expect(schema.safeParse({}).success).toBe(false);
 });

 it("accepts JSON values but rejects undefined mutation values", () => {
  expect(mutationEnvelopeSchema.safeParse({ changes: { notes: ["A", null, true] } }).success).toBe(
   true,
  );
  expect(mutationEnvelopeSchema.safeParse({ changes: { meaning: undefined } }).success).toBe(false);
 });
});
