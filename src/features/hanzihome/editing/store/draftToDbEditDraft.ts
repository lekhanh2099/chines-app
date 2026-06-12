"use client";

import type {
 HanziHomeDbEditDraft,
 HanziHomeDbEditTarget,
} from "@/features/hanzihome/editor/hanzihome-db-edit.types";
import { getHanziHomeDbEditTargetKey } from "@/features/hanzihome/editor/dbTargets";
import type { HanziHomeLesson, HanziHomeVocabItem } from "@/features/hanzihome/types";

import { setValueAtPath } from "./pathUtils";
import type { DraftPatch } from "./types";

type BuildResult = {
 drafts: Array<{
  draft: HanziHomeDbEditDraft;
  patchIds: string[];
 }>;
 unsupported: Array<{
  patchId: string;
  entityType: string;
  reason: string;
 }>;
};

type ModuleDraft = {
 target: HanziHomeDbEditTarget;
 original: unknown;
 next: unknown;
 patchIds: string[];
};

function clone<T>(value: T): T {
 return structuredClone(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
 return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getLessonTitlePatch(original: unknown, after: unknown) {
 if (!isRecord(original) || !isRecord(after)) return null;

 const title = isRecord(after.title) ? after.title : null;
 if (!title) return null;

 return {
  ...original,
  title: {
   ...(isRecord(original.title) ? original.title : {}),
   zh: typeof title.zh === "string" ? title.zh : "",
   pinyin: typeof title.pinyin === "string" ? title.pinyin : "",
   vi: typeof title.vi === "string" ? title.vi : "",
   en: typeof title.en === "string" ? title.en : "",
  },
 };
}

function getCanonicalVocabPayload(original: unknown, after: unknown) {
 if (!isRecord(after)) return after;
 const originalRecord = isRecord(original) ? original : {};
 const next = clone(originalRecord);

 for (const [key, value] of Object.entries(after)) {
  if (["runtimeId", "lessonId", "category"].includes(key)) continue;
  next[key] = value;
 }

 if (isRecord(after.meaning)) {
  next.meaning = after.meaning;
 } else {
  if (typeof after.meaning_vi === "string") next.meaning_vi = after.meaning_vi;
  if (typeof after.meaning_en === "string") next.meaning_en = after.meaning_en;
 }

 if (after.pos !== undefined) next.pos = after.pos;
 if (Array.isArray(after.tags)) next.tags = after.tags;

 return next;
}

function targetKey(target: HanziHomeDbEditTarget) {
 return getHanziHomeDbEditTargetKey(target);
}

function addModulePatch(
 modules: Map<string, ModuleDraft>,
 target: HanziHomeDbEditTarget,
 original: unknown,
 patch: DraftPatch,
 relativePath: Array<string | number>,
 after: unknown,
) {
 const key = targetKey(target);
 const current =
  modules.get(key) ??
  ({
   target,
   original: clone(original),
   next: clone(original),
   patchIds: [],
  } satisfies ModuleDraft);

 const applied =
  relativePath.length === 0
   ? ((current.next = clone(after)), true)
   : setValueAtPath(current.next, relativePath, clone(after));

 if (!applied) {
  throw new Error(`Could not apply patch to module path ${relativePath.join(".")}`);
 }

 current.patchIds.push(patch.id);
 modules.set(key, current);
}

function getSectionTarget(lesson: HanziHomeLesson, sectionIndex: number) {
 const dbSource = lesson.dbSource;
 const section = lesson.sourceLesson?.lesson.sections[sectionIndex];
 const sectionFile = section ? dbSource?.sectionFilesById[section.id] : "";

 if (!dbSource || !section || !sectionFile) return null;

 return {
  target: {
   kind: "section",
   dataset: dbSource.dataset,
   lessonFolder: dbSource.lessonFolder,
   sectionFile,
  } satisfies HanziHomeDbEditTarget,
  original: section,
 };
}

function getVocabTarget(lesson: HanziHomeLesson, vocabIndex: number) {
 const dbSource = lesson.dbSource;
 const item = lesson.vocab[vocabIndex] as HanziHomeVocabItem | undefined;
 const runtimeId = item?.runtimeId;
 const itemFile = runtimeId ? dbSource?.vocabularyItemFilesByRuntimeId[runtimeId] : "";
 const original = runtimeId
  ? dbSource?.vocabularyItemPayloadsByRuntimeId[runtimeId]
  : undefined;

 if (!dbSource || !item || !runtimeId || !itemFile || original === undefined) {
  return null;
 }

 return {
  target: {
   kind: "vocabulary_item",
   dataset: dbSource.dataset,
   lessonFolder: dbSource.lessonFolder,
   itemFile,
  } satisfies HanziHomeDbEditTarget,
  original,
 };
}

function getOriginalForTarget(
 lesson: HanziHomeLesson,
 target: HanziHomeDbEditTarget,
) {
 const dbSource = lesson.dbSource;
 if (!dbSource) return undefined;

 switch (target.kind) {
  case "lesson_meta":
   return dbSource.lessonMeta;
  case "section": {
   const entry = Object.entries(dbSource.sectionFilesById).find(
    ([, sectionFile]) => sectionFile === target.sectionFile,
   );
   const sectionId = entry?.[0];
   return lesson.sourceLesson?.lesson.sections.find(
    (section) => section.id === sectionId,
   );
  }
  case "vocabulary_item": {
   const entry = Object.entries(dbSource.vocabularyItemFilesByRuntimeId).find(
    ([, itemFile]) => itemFile === target.itemFile,
   );
   const runtimeId = entry?.[0];
   return runtimeId
    ? dbSource.vocabularyItemPayloadsByRuntimeId[runtimeId]
    : undefined;
  }
  case "vocabulary_groups":
   return lesson.vocabCategories ?? [];
  case "relation_file":
   return undefined;
 }
}

function getCanonicalAfterForTarget(
 target: HanziHomeDbEditTarget,
 original: unknown,
 patch: DraftPatch,
 relativePath: Array<string | number>,
) {
 if (target.kind === "lesson_meta" && relativePath.length === 0) {
  return getLessonTitlePatch(original, patch.after) ?? patch.after;
 }

 if (target.kind === "vocabulary_item" && relativePath.length === 0) {
  return getCanonicalVocabPayload(original, patch.after);
 }

 return patch.after;
}

export function buildHanziHomeDbEditDraftsFromPatches(
 lesson: HanziHomeLesson,
 patches: DraftPatch[],
): BuildResult {
 const modules = new Map<string, ModuleDraft>();
 const unsupported: BuildResult["unsupported"] = [];

 for (const patch of patches) {
  try {
   if (patch.target) {
    const original = getOriginalForTarget(lesson, patch.target);

    if (original === undefined) {
     unsupported.push({
      patchId: patch.id,
      entityType: patch.entityType,
      reason:
       "Patch có DB target nhưng không tìm được module gốc trong lesson hiện tại.",
     });
     continue;
    }

    addModulePatch(
     modules,
     patch.target,
     original,
     patch,
     patch.targetRelativePath ?? [],
     getCanonicalAfterForTarget(
      patch.target,
      original,
      patch,
      patch.targetRelativePath ?? [],
     ),
    );
    continue;
   }

   if (patch.path[0] === "lesson" && patch.path.length === 1) {
    const dbSource = lesson.dbSource;
    const next = getLessonTitlePatch(dbSource?.lessonMeta, patch.after);

    if (!dbSource || !next) {
     unsupported.push({
      patchId: patch.id,
      entityType: patch.entityType,
      reason: "Lesson metadata patch không map được sang lesson.json.",
     });
     continue;
    }

    addModulePatch(
     modules,
     {
      kind: "lesson_meta",
      dataset: dbSource.dataset,
      lessonFolder: dbSource.lessonFolder,
      path: "lesson.json",
     },
     dbSource.lessonMeta,
     patch,
     [],
     next,
    );
    continue;
   }

   if (patch.path[0] === "lesson" && patch.path[1] === "sections") {
    const sectionIndex = Number(patch.path[2]);
    const sectionTarget = getSectionTarget(lesson, sectionIndex);

    if (!Number.isInteger(sectionIndex) || !sectionTarget) {
     unsupported.push({
      patchId: patch.id,
      entityType: patch.entityType,
      reason: "Section patch không có section file tương ứng.",
     });
     continue;
    }

    addModulePatch(
     modules,
     sectionTarget.target,
     sectionTarget.original,
     patch,
     patch.path.slice(3),
     patch.after,
    );
    continue;
   }

   if (patch.path[0] === "vocab") {
    const vocabIndex = Number(patch.path[1]);
    const vocabTarget = getVocabTarget(lesson, vocabIndex);

    if (!Number.isInteger(vocabIndex) || !vocabTarget) {
     unsupported.push({
      patchId: patch.id,
      entityType: patch.entityType,
      reason: "Vocab patch không có vocabulary item file tương ứng.",
     });
     continue;
    }

    addModulePatch(
     modules,
     vocabTarget.target,
     vocabTarget.original,
     patch,
     patch.path.slice(2),
     patch.path.length === 2
      ? getCanonicalVocabPayload(vocabTarget.original, patch.after)
      : patch.after,
    );
    continue;
   }

   unsupported.push({
    patchId: patch.id,
    entityType: patch.entityType,
    reason:
     "Patch này đang nằm trên view model hoặc node chưa có map an toàn sang module DB.",
   });
  } catch (error) {
   unsupported.push({
    patchId: patch.id,
    entityType: patch.entityType,
    reason: error instanceof Error ? error.message : "Không apply được patch.",
   });
  }
 }

 return {
  drafts: Array.from(modules.values()).map((moduleDraft) => ({
   draft: {
    id: crypto.randomUUID(),
    target: moduleDraft.target,
    original: moduleDraft.original,
    next: moduleDraft.next,
    status: "valid",
    validationErrors: [],
    updatedAt: new Date().toISOString(),
   },
   patchIds: moduleDraft.patchIds,
  })),
  unsupported,
 };
}
