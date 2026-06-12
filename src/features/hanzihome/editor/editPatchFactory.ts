"use client";

import type { DraftPatch, EditableNodeRequest } from "@/features/hanzihome/editing/store/types";

export function createHanziHomeUpdatePatch(params: {
 node: EditableNodeRequest;
 after: unknown;
}): DraftPatch {
 const { node, after } = params;

 return {
  id: crypto.randomUUID(),
  lessonId: node.lessonId,
  entityType: node.entityType,
  entityId: node.entityId,
  parentEntityType: node.parentEntityType,
  parentEntityId: node.parentEntityId,
  path: node.path,
  target: node.target,
  targetRelativePath: node.targetRelativePath,
  op: "update",
  before: node.value,
  after,
  createdAt: new Date().toISOString(),
 };
}
