import type {
 HanziHomeDbEditDraft,
 HanziHomeDbEditTarget,
} from "@/features/hanzihome/editor/hanzihome-db-edit.types";

function joinDbPath(...parts: string[]) {
 return parts
  .map((part) => part.replace(/^\/+|\/+$/g, ""))
  .filter(Boolean)
  .join("/");
}

function assertSafeLessonFolder(lessonFolder: string) {
 if (!/^lesson_\d+$/u.test(lessonFolder)) {
  throw new Error(`Invalid HanziHome DB lesson folder: ${lessonFolder}`);
 }
}

function assertSafeDataset(dataset: string) {
 if (!["q2", "q3"].includes(dataset)) {
  throw new Error(`Invalid HanziHome DB dataset: ${dataset}`);
 }
}

function assertSafeJsonPath(filePath: string, requiredPrefix?: string) {
 if (
  !filePath.endsWith(".json") ||
  filePath.startsWith("/") ||
  filePath.includes("\\") ||
  filePath.split("/").includes("..") ||
  (requiredPrefix && !filePath.startsWith(requiredPrefix))
 ) {
  throw new Error(`Invalid HanziHome DB JSON target: ${filePath}`);
 }
}

function assertSafeJsonFileName(fileName: string) {
 assertSafeJsonPath(fileName);
 if (fileName.includes("/")) {
  throw new Error(`Invalid HanziHome DB JSON file name: ${fileName}`);
 }
}

export function getHanziHomeDbEditTargetPath(target: HanziHomeDbEditTarget) {
 assertSafeDataset(target.dataset);
 assertSafeLessonFolder(target.lessonFolder);

 const lessonBase = joinDbPath("data/hanzihome-db", target.dataset, "lessons", target.lessonFolder);

 switch (target.kind) {
  case "lesson_meta":
   if (target.path !== "lesson.json") {
    throw new Error(`Invalid HanziHome DB lesson target: ${target.path}`);
   }
   return joinDbPath(lessonBase, target.path);
  case "section":
   assertSafeJsonFileName(target.sectionFile);
   return joinDbPath(lessonBase, "sections", target.sectionFile);
  case "vocabulary_item":
   assertSafeJsonPath(target.itemFile, "vocabulary/items/");
   return joinDbPath(lessonBase, target.itemFile);
  case "vocabulary_groups":
   return joinDbPath(lessonBase, "vocabulary/groups.json");
  case "relation_file":
   assertSafeJsonFileName(target.relationFile);
   return joinDbPath(lessonBase, "relations", target.relationFile);
 }
}

export function exportHanziHomeDbEditDraft(draft: HanziHomeDbEditDraft): {
 targetPath: string;
 json: unknown;
} {
 return {
  targetPath: getHanziHomeDbEditTargetPath(draft.target),
  json: draft.next,
 };
}
