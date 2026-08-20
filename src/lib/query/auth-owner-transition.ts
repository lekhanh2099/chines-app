import type { QueryClient } from "@tanstack/react-query";

export type AuthenticatedOwner = string | null;
export type PreviousAuthenticatedOwner = AuthenticatedOwner | undefined;

type AuthenticatedQueryOwnerTransition = {
 client: QueryClient;
 owner: AuthenticatedOwner;
 rotated: boolean;
};

export function transitionAuthenticatedQueryOwner({
 previousOwner,
 nextOwner,
 client,
 makeClient,
}: {
 previousOwner: PreviousAuthenticatedOwner;
 nextOwner: AuthenticatedOwner;
 client: QueryClient;
 makeClient: () => QueryClient;
}): AuthenticatedQueryOwnerTransition {
 if (previousOwner === undefined || previousOwner === nextOwner) {
  return { client, owner: nextOwner, rotated: false };
 }

 void client.cancelQueries();
 client.clear();

 return {
  client: makeClient(),
  owner: nextOwner,
  rotated: true,
 };
}
