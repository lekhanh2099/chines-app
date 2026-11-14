import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { transitionAuthenticatedQueryOwner } from "./auth-owner-transition";

function makeClient() {
 return new QueryClient({
  defaultOptions: { queries: { retry: false } },
 });
}

describe("transitionAuthenticatedQueryOwner", () => {
 it("keeps the initial QueryClient while resolving the first owner", () => {
  const client = makeClient();
  const factory = vi.fn(makeClient);

  const result = transitionAuthenticatedQueryOwner({
   previousOwner: undefined,
   nextOwner: "user-a",
   client,
   makeClient: factory,
  });

  expect(result).toEqual({ client, owner: "user-a", rotated: false });
  expect(factory).not.toHaveBeenCalled();
 });

 it("does not rotate when the authenticated owner is unchanged", () => {
  const client = makeClient();
  client.setQueryData(["notes", "user-a"], { title: "A private note" });
  const factory = vi.fn(makeClient);

  const result = transitionAuthenticatedQueryOwner({
   previousOwner: "user-a",
   nextOwner: "user-a",
   client,
   makeClient: factory,
  });

  expect(result.rotated).toBe(false);
  expect(result.client).toBe(client);
  expect(client.getQueryData(["notes", "user-a"])).toEqual({ title: "A private note" });
  expect(factory).not.toHaveBeenCalled();
 });

 it("clears A cache and returns an empty client when A logs out", () => {
  const clientA = makeClient();
  clientA.setQueryData(["notes", "user-a"], { title: "A private note" });
  clientA.setQueryData(["dictionary", "user-a", "学习"], { personalNote: "A note" });
  const factory = vi.fn(makeClient);

  const result = transitionAuthenticatedQueryOwner({
   previousOwner: "user-a",
   nextOwner: null,
   client: clientA,
   makeClient: factory,
  });

  expect(result.rotated).toBe(true);
  expect(result.owner).toBeNull();
  expect(result.client).not.toBe(clientA);
  expect(clientA.getQueryCache().getAll()).toHaveLength(0);
  expect(result.client.getQueryCache().getAll()).toHaveLength(0);
  expect(factory).toHaveBeenCalledOnce();
 });

 it("rotates again from signed-out state to B without reusing A data", () => {
  const clientA = makeClient();
  clientA.setQueryData(["learning-state", "user-a"], { bookmarks: ["a"] });

  const logout = transitionAuthenticatedQueryOwner({
   previousOwner: "user-a",
   nextOwner: null,
   client: clientA,
   makeClient,
  });
  const loginB = transitionAuthenticatedQueryOwner({
   previousOwner: logout.owner,
   nextOwner: "user-b",
   client: logout.client,
   makeClient,
  });

  expect(loginB.rotated).toBe(true);
  expect(loginB.owner).toBe("user-b");
  expect(loginB.client).not.toBe(logout.client);
  expect(loginB.client.getQueryCache().getAll()).toHaveLength(0);
  expect(loginB.client.getQueryData(["learning-state", "user-a"])).toBeUndefined();
 });
});
