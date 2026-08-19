import { describe, expect, it } from "vitest";
import ts from "typescript";

import {
 filterPublicApiEndpoints,
 getOperationTypeScript,
 publicV1Endpoints,
} from "../src/features/developer-api/api-registry";
import { runApiRegistryCheck } from "./check-api-registry.mjs";

describe("API registry", () => {
 it("covers every current route handler and required direct data flow", () => {
  expect(runApiRegistryCheck()).toEqual([]);
 });

 it("gives every documented operation a valid request and response contract sample", () => {
  for (const endpoint of publicV1Endpoints) {
   expect(endpoint.operations.map((operation) => operation.method).sort()).toEqual(
    endpoint.methods.slice().sort(),
   );

   for (const operation of endpoint.operations) {
    expect(operation.responseStatus).toBeGreaterThanOrEqual(100);
    expect(operation.responseStatus).toBeLessThanOrEqual(599);
    expect(operation.responseContentType).not.toBe("");

    if (operation.requestBody) {
     expect(() => JSON.parse(operation.requestBody)).not.toThrow();
    }
    if (operation.responseBody) {
     expect(() => JSON.parse(operation.responseBody)).not.toThrow();
    }
   }
  }
 });

 it("keeps feature filters and copied TypeScript contracts aligned with the registry", () => {
  const notesReadEndpoints = filterPublicApiEndpoints({
   feature: "Ghi chú",
   method: "GET",
   scope: "notes:read",
   searchQuery: "",
  });
  const ttsEndpoints = filterPublicApiEndpoints({
   feature: "all",
   method: "all",
   scope: "all",
   searchQuery: "tts",
  });

  expect(notesReadEndpoints.length).toBeGreaterThan(0);
  expect(notesReadEndpoints.every((endpoint) => endpoint.group === "Ghi chú")).toBe(true);
  expect(notesReadEndpoints.every((endpoint) => endpoint.scope === "notes:read")).toBe(true);
  expect(notesReadEndpoints.every((endpoint) => endpoint.methods.includes("GET"))).toBe(true);
  expect(ttsEndpoints.map((endpoint) => endpoint.path)).toContain("/api/v1/tts");

  for (const endpoint of publicV1Endpoints) {
   for (const operation of endpoint.operations) {
    const typeScript = getOperationTypeScript(endpoint, operation);

    expect(typeScript).toContain("export type JsonValue");
    expect(typeScript).toContain(`path: \"${endpoint.path}\";`);
    expect(typeScript).toContain(`scope: \"${endpoint.scope}\";`);
    expect(typeScript).not.toContain("unknown");
    expect(
     ts.createSourceFile(
      `${operation.method}-${endpoint.path}.ts`,
      typeScript,
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS,
     ).parseDiagnostics,
    ).toEqual([]);
   }
  }
 });
});
