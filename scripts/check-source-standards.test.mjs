import { describe, expect, it } from "vitest";

import { inspectUnsafeTypeConstructs } from "./check-source-standards.mjs";

const assertionFile = "src/example.ts";
const assertionKey = `${assertionFile}::as::payload::string`;
const assertionException = new Map([
 [assertionKey, { count: 1, reason: "Audited pre-existing assertion debt." }],
]);

function inspect(source, options = {}) {
 return inspectUnsafeTypeConstructs({
  sources: [{ file: assertionFile, source }],
  assertionExceptionBudget: options.assertionExceptionBudget ?? new Map(),
  generatedTypeFiles: options.generatedTypeFiles ?? new Set(),
 });
}

describe("source standards unsafe-type guard", () => {
 it("rejects explicit any but permits unknown when it is narrowed by application code", () => {
  expect(inspect("type Payload = any;")).toEqual([
   expect.stringContaining("uses an unsafe explicit any type"),
  ]);
  expect(inspect("function read(value: unknown) { return typeof value === 'string' ? value : ''; }")).toEqual(
   [],
  );
 });

 it("rejects a new type assertion", () => {
  expect(inspect("const value = payload as string;")).toEqual([
   expect.stringContaining("uses an unaudited type assertion"),
  ]);
 });

 it("accepts an exact audited assertion occurrence", () => {
  expect(
   inspect("const value = payload as string;", {
    assertionExceptionBudget: assertionException,
   }),
  ).toEqual([]);
 });

 it("rejects an assertion signature change and the stale exception", () => {
  const failures = inspect("const value = payload as number;", {
   assertionExceptionBudget: assertionException,
  });

  expect(failures).toEqual([
   expect.stringContaining("uses an unaudited type assertion"),
   expect.stringContaining("stale type-assertion exception"),
  ]);
 });

 it("rejects assertion occurrences above the exact budget", () => {
  const failures = inspect("const first = payload as string;\nconst second = payload as string;", {
   assertionExceptionBudget: assertionException,
  });

  expect(failures).toEqual([expect.stringContaining("uses an unaudited type assertion")]);
 });

 it("rejects a stale unused assertion exception", () => {
  expect(
   inspect("const value = payload;", {
    assertionExceptionBudget: assertionException,
   }),
  ).toEqual([expect.stringContaining("stale type-assertion exception")]);
 });

 it("rejects non-null assertions and TypeScript suppressions", () => {
  const suppression = ["// @ts-", "expect-error"].join("");
  const failures = inspect(`${suppression}\nconst value = payload!;`);

  expect(failures).toEqual([
   expect.stringContaining("forbidden non-null assertion"),
   expect.stringContaining("forbidden TypeScript suppression"),
  ]);
 });

 it("keeps generated Supabase types outside the unsafe AST gate", () => {
  const generatedFile = "src/types/supabase.generated.ts";
  expect(
   inspectUnsafeTypeConstructs({
    sources: [{ file: generatedFile, source: "type Json = any; const value = payload!;" }],
    assertionExceptionBudget: new Map(),
   }),
  ).toEqual([]);
 });
});
