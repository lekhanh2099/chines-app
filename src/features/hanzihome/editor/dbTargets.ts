import type { HanziHomeDbEditTarget } from "./hanzihome-db-edit.types";

export function getHanziHomeDbEditTargetKey(target: HanziHomeDbEditTarget) {
 switch (target.kind) {
  case "lesson_meta":
   return `${target.dataset}/${target.lessonFolder}/lesson.json`;
  case "section":
   return `${target.dataset}/${target.lessonFolder}/sections/${target.sectionFile}`;
  case "vocabulary_item":
   return `${target.dataset}/${target.lessonFolder}/${target.itemFile}`;
  case "vocabulary_groups":
   return `${target.dataset}/${target.lessonFolder}/vocabulary/groups.json`;
  case "relation_file":
   return `${target.dataset}/${target.lessonFolder}/relations/${target.relationFile}`;
 }
}

