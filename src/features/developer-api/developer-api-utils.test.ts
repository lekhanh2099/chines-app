import { describe, expect, it } from "vitest";

import type { PublicApiEndpoint, PublicApiOperation } from "./api-registry";
import { curlForOperation, demoOutputForOperation, methodLabel } from "./developer-api-utils";

const jsonOperation: PublicApiOperation = {
 method: "POST",
 query: "limit=5",
 requestBody: '{"title":"x"}',
 responseStatus: 201,
 responseContentType: "application/json",
 responseBody: '{"ok":true}',
};

const audioOperation: PublicApiOperation = {
 method: "GET",
 query: null,
 requestBody: null,
 responseStatus: 200,
 responseContentType: "audio/mpeg",
 responseBody: null,
};

const endpoint: PublicApiEndpoint = {
 group: "Notes",
 methods: ["GET", "POST"],
 operations: [audioOperation, jsonOperation],
 path: "/api/v1/notes/[noteId]",
 scope: "notes:write",
 summary: "Notes",
};

describe("developer-api-utils", () => {
 it("builds a curl command with replaced path params, query and JSON body", () => {
  expect(curlForOperation(endpoint, jsonOperation)).toBe(`curl --request POST \\
  --url "$HANZIHOME_API_BASE/api/v1/notes/REPLACE_ME?limit=5" \\
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \\
  --header "Accept: application/json" \\
  --header "Content-Type: application/json" \\
  --data '{"title":"x"}'`);
 });

 it("accepts audio for audio operations without a body", () => {
  expect(curlForOperation(endpoint, audioOperation)).toBe(`curl --request GET \\
  --url "$HANZIHOME_API_BASE/api/v1/notes/REPLACE_ME" \\
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \\
  --header "Accept: audio/mpeg"`);
 });

 it("joins operation methods and describes binary demo output", () => {
  expect(methodLabel(endpoint.operations)).toBe("GET · POST");
  expect(demoOutputForOperation(jsonOperation)).toBe('{"ok":true}');
  expect(demoOutputForOperation(audioOperation)).toBe(`{
  "status": 200,
  "contentType": "audio/mpeg",
  "body": "[binary stream]"
}`);
 });
});
