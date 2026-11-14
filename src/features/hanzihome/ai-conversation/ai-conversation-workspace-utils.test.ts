import { describe, expect, it } from "vitest";

import {
 conversationSessionQueryKey,
 readRuntimeOverride,
 runtimeOverrideStorageKey,
} from "./ai-conversation-workspace-utils";

const keyId = "8b0f5d6e-2a51-4c1e-9f3d-6a7b8c9d0e1f";

describe("ai-conversation-workspace-utils", () => {
 it("keys the session query by conversation id or the latest session", () => {
  expect(conversationSessionQueryKey(null)).toEqual([
   "hanzihome",
   "ai-conversation",
   "session",
   "latest",
  ]);
  expect(conversationSessionQueryKey("conversation-1")).toEqual([
   "hanzihome",
   "ai-conversation",
   "session",
   "conversation-1",
  ]);
 });

 it("scopes the runtime override storage key to one conversation", () => {
  expect(runtimeOverrideStorageKey("conversation-1")).toBe(
   "hanzihome.ai-conversation.runtime-override.v2:conversation-1",
  );
 });

 it("reads only a valid persisted runtime override", () => {
  expect(readRuntimeOverride(null)).toBeNull();
  expect(readRuntimeOverride("")).toBeNull();
  expect(readRuntimeOverride("{not json")).toBeNull();
  expect(readRuntimeOverride(JSON.stringify({ keyId: "not-a-uuid", model: "m" }))).toBeNull();
  expect(readRuntimeOverride(JSON.stringify({ keyId, model: "gpt-test" }))).toEqual({
   keyId,
   model: "gpt-test",
  });
 });
});
