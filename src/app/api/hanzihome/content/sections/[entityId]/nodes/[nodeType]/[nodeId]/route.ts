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
 after: z.unknown(),
});

const editableEntityTypeSchema = z.enum(editableEntityTypes);

function countNodesById(value: unknown, nodeId: string): number {
 if (Array.isArray(value)) {
  return value.reduce((count, item) => count + countNodesById(item, nodeId), 0);
 }
 if (!value || typeof value !== "object") return 0;

 const record = value as Record<string, unknown>;
 let count = record.id === nodeId ? 1 : 0;
 for (const item of Object.values(record)) {
  count += countNodesById(item, nodeId);
 }
 return count;
}

function updateNodeById(
 value: unknown,
 nodeId: string,
 update: (current: Record<string, unknown>) => unknown,
): unknown | null {
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

 if (!value || typeof value !== "object") return null;
 const record = value as Record<string, unknown>;
 if (record.id === nodeId) return update(record);

 let found = false;
 const next: Record<string, unknown> = {};
 for (const [key, item] of Object.entries(record)) {
  const replaced = updateNodeById(item, nodeId, update);
  next[key] = replaced === null ? item : replaced;
  if (replaced !== null) found = true;
 }
 return found ? next : null;
}

function sectionRelativePath(path: Array<string | number>) {
 const sectionsIndex = path.findIndex((segment) => segment === "sections");
 if (sectionsIndex < 0 || typeof path[sectionsIndex + 1] !== "number") return null;
 return path.slice(sectionsIndex + 2);
}

function valueAtPath(value: unknown, path: Array<string | number>): unknown {
 let current = value;
 for (const segment of path) {
  if (typeof segment === "number") {
   if (!Array.isArray(current) || segment < 0 || segment >= current.length) return undefined;
   current = current[segment];
   continue;
  }
  if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
  current = (current as Record<string, unknown>)[segment];
 }
 return current;
}

function updateValueAtPath(
 value: unknown,
 path: Array<string | number>,
 nextValue: unknown,
): unknown | null {
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

 if (!value || typeof value !== "object" || Array.isArray(value) || !(segment in value)) {
  return null;
 }
 const record = value as Record<string, unknown>;
 const nextChild = updateValueAtPath(record[segment], rest, nextValue);
 return nextChild === null ? null : { ...record, [segment]: nextChild };
}

function nodeIdMatches(value: unknown, nodeId: string) {
 if (!value || typeof value !== "object" || Array.isArray(value)) return true;
 const id = (value as Record<string, unknown>).id;
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

 const body: unknown = await request.json().catch(() => null);
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

 const body: unknown = await request.json().catch(() => null);
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
