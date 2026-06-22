import "server-only";

import type { CanonicalEntityType } from "@/features/hanzihome/schemas/canonical-content.schema";
import { mutateCanonicalContent } from "@/features/hanzihome/server/canonical-content-mutation";

type ItemRouteContext = {
 params: Promise<{ entityId: string }>;
};

export function createCollectionPost(entityType: CanonicalEntityType) {
 return (request: Request) => mutateCanonicalContent({ request, entityType, operation: "create" });
}

export function createItemPatch(entityType: CanonicalEntityType) {
 return async (request: Request, context: ItemRouteContext) => {
  const { entityId } = await context.params;
  return mutateCanonicalContent({ request, entityType, operation: "update", entityId });
 };
}

export function createItemDelete(entityType: CanonicalEntityType) {
 return async (request: Request, context: ItemRouteContext) => {
  const { entityId } = await context.params;
  return mutateCanonicalContent({ request, entityType, operation: "delete", entityId });
 };
}

export function createRestorePost(entityType: CanonicalEntityType) {
 return async (request: Request, context: ItemRouteContext) => {
  const { entityId } = await context.params;
  return mutateCanonicalContent({ request, entityType, operation: "restore", entityId });
 };
}

export function createReorderPost(entityType: CanonicalEntityType) {
 return async (request: Request, context: ItemRouteContext) => {
  const { entityId } = await context.params;
  return mutateCanonicalContent({ request, entityType, operation: "reorder", entityId });
 };
}
