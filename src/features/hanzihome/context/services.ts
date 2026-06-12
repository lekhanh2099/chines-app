"use client";

import type { HanziHomeDbEditTarget } from "@/features/hanzihome/editor/hanzihome-db-edit.types";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type {
 DraftPatchPath,
 EditableNodeRequest,
} from "@/features/hanzihome/editing/store/types";

export type ResolvedEditTarget = {
 target: HanziHomeDbEditTarget;
 targetRelativePath: DraftPatchPath;
};

export type HanziHomeFeatureServices = {
 resolveEditTarget: (node: EditableNodeRequest) => ResolvedEditTarget | null;
};

function numericSegment(value: string | number | undefined) {
 if (typeof value === "number" && Number.isInteger(value)) return value;
 if (typeof value === "string" && value.trim()) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
 }
 return null;
}

function resolveSectionTarget(
 lesson: HanziHomeLesson,
 path: DraftPatchPath,
): ResolvedEditTarget | null {
 if (path[0] !== "lesson" || path[1] !== "sections") return null;

 const sectionIndex = numericSegment(path[2]);
 const dbSource = lesson.dbSource;
 const section =
  sectionIndex === null
   ? undefined
   : lesson.sourceLesson?.lesson.sections[sectionIndex];
 const sectionFile = section ? dbSource?.sectionFilesById[section.id] : "";

 if (!dbSource || !section || !sectionFile) return null;

 return {
  target: {
   kind: "section",
   dataset: dbSource.dataset,
   lessonFolder: dbSource.lessonFolder,
   sectionFile,
  },
  targetRelativePath: path.slice(3),
 };
}

function resolveLessonTarget(
 lesson: HanziHomeLesson,
 path: DraftPatchPath,
): ResolvedEditTarget | null {
 const dbSource = lesson.dbSource;

 if (!dbSource || path[0] !== "lesson" || path.length !== 1) return null;

 return {
  target: {
   kind: "lesson_meta",
   dataset: dbSource.dataset,
   lessonFolder: dbSource.lessonFolder,
   path: "lesson.json",
  },
  targetRelativePath: [],
 };
}

function resolveVocabTarget(
 lesson: HanziHomeLesson,
 path: DraftPatchPath,
): ResolvedEditTarget | null {
 if (path[0] !== "vocab") return null;

 const vocabIndex = numericSegment(path[1]);
 const dbSource = lesson.dbSource;
 const runtimeId =
  vocabIndex === null ? undefined : lesson.vocab[vocabIndex]?.runtimeId;
 const itemFile = runtimeId
  ? dbSource?.vocabularyItemFilesByRuntimeId[runtimeId]
  : "";

 if (!dbSource || !runtimeId || !itemFile) return null;

 return {
  target: {
   kind: "vocabulary_item",
   dataset: dbSource.dataset,
   lessonFolder: dbSource.lessonFolder,
   itemFile,
  },
  targetRelativePath: path.slice(2),
 };
}

export function createHanziHomeFeatureServices(
 lesson: HanziHomeLesson,
): HanziHomeFeatureServices {
 return {
  resolveEditTarget: (node) => {
   if (node.target) {
    return {
     target: node.target,
     targetRelativePath: node.targetRelativePath ?? [],
    };
   }

   return (
    resolveLessonTarget(lesson, node.path) ??
    resolveSectionTarget(lesson, node.path) ??
    resolveVocabTarget(lesson, node.path)
   );
  },
 };
}

