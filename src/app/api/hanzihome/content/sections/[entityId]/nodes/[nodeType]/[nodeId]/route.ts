import type { JsonFieldValue, JsonObject, JsonValue } from "@/types/json";
import { z } from "zod";

import { mutationEnvelopeSchema } from "@/features/hanzihome/schemas/canonical-content.schema";
import {
 mutateCanonicalContent,
 mutationError,
} from "@/features/hanzihome/server/canonical-content-mutation";
import { editableEntityTypes } from "@/features/hanzihome/editing/store/types";
import { SectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
 params: Promise<{ entityId: string; nodeType: string; nodeId: string }>;
};

const nestedNodeMutationSchema = mutationEnvelopeSchema.extend({
 nodePath: z.array(z.union([z.string(), z.number().int()])),
 after: z.json(),
});

const editableEntityTypeSchema = z.enum(editableEntityTypes);
type OptionalJsonValue = JsonFieldValue;
type NodePath = z.infer<typeof nestedNodeMutationSchema>["nodePath"];
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

function isJsonObject(value: OptionalJsonValue): value is JsonObject {
 return value !== null && typeof value === "object" && !Array.isArray(value);
}

function countNodesById(value: JsonValue, nodeId: string): number {
 if (Array.isArray(value)) {
  return value.reduce<number>((count, item) => count + countNodesById(item, nodeId), 0);
 }
 if (!isJsonObject(value)) return 0;

 let count = value.id === nodeId ? 1 : 0;
 for (const item of Object.values(value)) {
  count += countNodesById(item ?? null, nodeId);
 }
 return count;
}

function updateNodeById(
 value: JsonValue,
 nodeId: string,
 update: (current: JsonObject) => JsonValue,
): Nullable<JsonValue> {
 if (Array.isArray(value)) {
  let found = false;
  const next = value.map((item) => {
   const replaced = updateNodeById(item, nodeId, update);
   if (replaced === null) return item;
   found = true;
   return replaced;
  });
  return found ? next : null;
 }

 if (!isJsonObject(value)) return null;
 if (value.id === nodeId) return update(value);

 let found = false;
 const next: JsonObject = {};
 for (const [key, item] of Object.entries(value)) {
  const replaced = updateNodeById(item ?? null, nodeId, update);
  next[key] = replaced === null ? item : replaced;
  if (replaced !== null) found = true;
 }
 return found ? next : null;
}

function sectionRelativePath(path: NodePath) {
 const sectionsIndex = path.findIndex((segment) => segment === "sections");
 if (sectionsIndex < 0 || typeof path[sectionsIndex + 1] !== "number") return null;
 return path.slice(sectionsIndex + 2);
}

function valueAtPath(value: JsonValue, path: NodePath): OptionalJsonValue {
 let current: OptionalJsonValue = value;
 for (const segment of path) {
  if (typeof segment === "number") {
   if (!Array.isArray(current) || segment < 0 || segment >= current.length) return undefined;
   current = current[segment];
   continue;
  }
  if (!isJsonObject(current)) return undefined;
  current = current[segment];
 }
 return current;
}

function updateValueAtPath(
 value: JsonValue,
 path: NodePath,
 nextValue: JsonValue,
): Nullable<JsonValue> {
 if (path.length === 0) return nextValue;
 const [segment, ...rest] = path;

 if (typeof segment === "number") {
  if (!Array.isArray(value) || segment < 0 || segment >= value.length) return null;
  const nextChild = updateValueAtPath(value[segment], rest, nextValue);
  if (nextChild === null) return null;
  const next = value.slice();
  next[segment] = nextChild;
  return next;
 }

 if (!isJsonObject(value) || !(segment in value)) {
  return null;
 }
 const currentChild = value[segment];
 if (currentChild === undefined) return null;
 const nextChild = updateValueAtPath(currentChild, rest, nextValue);
 return nextChild === null ? null : { ...value, [segment]: nextChild };
}

function nodeIdMatches(value: OptionalJsonValue, nodeId: string) {
 if (!isJsonObject(value)) return true;
 const id = value.id;
 return typeof id !== "string" || id === nodeId;
}

export async function PATCH(request: Request, context: RouteContext) {
 const { entityId, nodeType, nodeId } = await context.params;
 const parsedNodeType = editableEntityTypeSchema.safeParse(nodeType);
 if (!parsedNodeType.success) return mutationError("Unsupported nested entity type", 400);
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();
 if (!user) return mutationError("Unauthorized", 401);

 const body: JsonValue = await request.json().catch(() => null);
 const parsed = nestedNodeMutationSchema.safeParse(body);
 if (!parsed.success) {
  return mutationError("Invalid nested section mutation", 400, z.flattenError(parsed.error));
 }
 if (!parsed.data.expectedUpdatedAt) {
  return mutationError("expectedUpdatedAt is required", 400);
 }

 const { data: section, error } = await sessionClient
  .from("hanzihome_lesson_sections")
  .select("id,payload,updated_at,deleted_at")
  .eq("id", entityId)
  .maybeSingle();

 if (error) return mutationError(error.message, 500, error.code);
 if (!section || section.deleted_at) return mutationError("Section not found", 404);
 if (section.updated_at !== parsed.data.expectedUpdatedAt) {
  return mutationError("HanziHome entity changed since it was loaded", 409);
 }
 const relativePath = sectionRelativePath(parsed.data.nodePath);
 const pathValue = relativePath ? valueAtPath(section.payload, relativePath) : undefined;
 if (relativePath && pathValue !== undefined && !nodeIdMatches(pathValue, nodeId)) {
  return mutationError(`${nodeType} ${nodeId} does not match the requested path`, 409);
 }

 const nextPayload =
  relativePath && pathValue !== undefined
   ? updateValueAtPath(section.payload, relativePath, parsed.data.after)
   : updateNodeById(section.payload, nodeId, () => parsed.data.after);
 if (nextPayload === null) {
  return mutationError(`${nodeType} ${nodeId} was not found in section`, 404);
 }

 const validatedSection = SectionSchema.safeParse(nextPayload);
 if (!validatedSection.success) {
  return mutationError("Edited section is invalid", 400, z.flattenError(validatedSection.error));
 }

 const nextRequest = new Request(request.url, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
   reason: parsed.data.reason,
   expectedUpdatedAt: parsed.data.expectedUpdatedAt,
   changes: { payload: nextPayload },
  }),
 });

 return mutateCanonicalContent({
  request: nextRequest,
  entityType: "section",
  operation: "update",
  entityId,
  audit: {
   operation: "update",
   entityType: nodeType,
   entityId: nodeId,
   parentEntityType: "section",
   parentEntityId: entityId,
  },
 });
}

async function setNestedNodeDeletedState(
 request: Request,
 context: RouteContext,
 deleted: boolean,
) {
 const { entityId, nodeType, nodeId } = await context.params;
 const parsedNodeType = editableEntityTypeSchema.safeParse(nodeType);
 if (!parsedNodeType.success) return mutationError("Unsupported nested entity type", 400);
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();
 if (!user) return mutationError("Unauthorized", 401);

 const body: JsonValue = await request.json().catch(() => null);
 const parsed = mutationEnvelopeSchema.safeParse(body);
 if (!parsed.success) {
  return mutationError("Invalid nested section mutation", 400, z.flattenError(parsed.error));
 }
 if (!parsed.data.expectedUpdatedAt) return mutationError("expectedUpdatedAt is required", 400);

 const { data: section, error } = await sessionClient
  .from("hanzihome_lesson_sections")
  .select("id,payload,updated_at,deleted_at")
  .eq("id", entityId)
  .maybeSingle();
 if (error) return mutationError(error.message, 500, error.code);
 if (!section || section.deleted_at) return mutationError("Section not found", 404);
 if (section.updated_at !== parsed.data.expectedUpdatedAt) {
  return mutationError("HanziHome entity changed since it was loaded", 409);
 }
 const matchingNodeCount = countNodesById(section.payload, nodeId);
 if (matchingNodeCount !== 1) {
  return mutationError(
   matchingNodeCount === 0
    ? `${nodeType} ${nodeId} was not found in section`
    : `${nodeType} ${nodeId} is ambiguous in section`,
   matchingNodeCount === 0 ? 404 : 409,
  );
 }

 const nextPayload = updateNodeById(section.payload, nodeId, (current) => {
  const next = { ...current };
  if (deleted) {
   next.deleted_at = new Date().toISOString();
   next.deleted_by = user.id;
   next.deleted_entity_type = parsedNodeType.data;
  } else {
   delete next.deleted_at;
   delete next.deleted_by;
   delete next.deleted_entity_type;
  }
  return next;
 });
 if (nextPayload === null) {
  return mutationError(`${nodeType} ${nodeId} was not found in section`, 404);
 }

 const validatedSection = SectionSchema.safeParse(nextPayload);
 if (!validatedSection.success) {
  return mutationError("Edited section is invalid", 400, z.flattenError(validatedSection.error));
 }

 const nextRequest = new Request(request.url, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
   reason: parsed.data.reason,
   expectedUpdatedAt: parsed.data.expectedUpdatedAt,
   changes: { payload: nextPayload },
  }),
 });
 return mutateCanonicalContent({
  request: nextRequest,
  entityType: "section",
  operation: "update",
  entityId,
  audit: {
   operation: deleted ? "delete" : "restore",
   entityType: nodeType,
   entityId: nodeId,
   parentEntityType: "section",
   parentEntityId: entityId,
  },
 });
}

export function DELETE(request: Request, context: RouteContext) {
 return setNestedNodeDeletedState(request, context, true);
}

export function POST(request: Request, context: RouteContext) {
 return setNestedNodeDeletedState(request, context, false);
}
