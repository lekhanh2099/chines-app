"use client";

import type { HanziHomeLesson } from "@/features/hanzihome/types";
import {
 HanziHomeEditableRecordMetaSchema,
 EditableFieldPathSchema,
 type HanziHomeEditableRecordMeta,
} from "@/features/hanzihome/types";
import type {
 EditableNodePath,
 EditableNodeRequest,
} from "@/features/hanzihome/editing/store/types";
import { z } from "zod";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type OptionalPathSegment = z.infer<z.ZodOptional<typeof EditableFieldPathSchema.element>>;

export type HanziHomeFeatureServices = {
 resolveEditableRecord: (node: EditableNodeRequest) => Nullable<HanziHomeEditableRecordMeta>;
};

function editableRecordKey(entityType: string, entityId: string) {
 return `${entityType}:${entityId}`;
}

function resolveSectionEditableRecord(
 lesson: HanziHomeLesson,
 path: EditableNodePath,
): Nullable<HanziHomeEditableRecordMeta> {
 if (path[0] !== "lesson" || path[1] !== "sections") return null;
 const sectionIndex = numericSegment(path[2]);
 const section =
  sectionIndex === null ? undefined : lesson.sourceLesson?.lesson.sections[sectionIndex];
 if (!section) return null;

 return lesson.editableRecords?.[editableRecordKey("section", section.id)] ?? null;
}

function numericSegment(value: OptionalPathSegment) {
 if (typeof value === "number" && Number.isInteger(value)) return value;
 if (typeof value === "string" && value.trim()) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
 }
 return null;
}

export function createHanziHomeFeatureServices(lesson: HanziHomeLesson): HanziHomeFeatureServices {
 return {
  resolveEditableRecord: (node) => {
   const direct = lesson.editableRecords?.[editableRecordKey(node.entityType, node.entityId)];
   if (direct) return direct;

   if (node.entityType === "lesson") return lesson.editMeta ?? null;

   const valueWithEditMeta = z
    .object({ editMeta: HanziHomeEditableRecordMetaSchema.optional() })
    .safeParse(node.value);
   if (valueWithEditMeta.success) {
    const editMeta = valueWithEditMeta.data.editMeta;
    if (editMeta?.dbId && editMeta.updatedAt) return editMeta;
   }

   return resolveSectionEditableRecord(lesson, node.path);
  },
 };
}
