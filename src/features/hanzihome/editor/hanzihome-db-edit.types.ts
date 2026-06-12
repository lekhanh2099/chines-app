import type { HanziHomeDbDataset } from "@/features/hanzihome/static-json/hanzihome-db.types";

export type HanziHomeDbEditTarget =
 | {
    kind: "lesson_meta";
    dataset: HanziHomeDbDataset;
    lessonFolder: string;
    path: "lesson.json";
   }
 | {
    kind: "section";
    dataset: HanziHomeDbDataset;
    lessonFolder: string;
    sectionFile: string;
   }
 | {
    kind: "vocabulary_item";
    dataset: HanziHomeDbDataset;
    lessonFolder: string;
    itemFile: string;
   }
 | {
    kind: "vocabulary_groups";
    dataset: HanziHomeDbDataset;
    lessonFolder: string;
   }
 | {
    kind: "relation_file";
    dataset: HanziHomeDbDataset;
    lessonFolder: string;
    relationFile: string;
   };

export type HanziHomeDbEditDraft = {
 id: string;
 target: HanziHomeDbEditTarget;
 original: unknown;
 next: unknown;
 status: "dirty" | "valid" | "invalid" | "saving" | "saved" | "failed";
 validationErrors: Array<{
  path: string;
  message: string;
 }>;
 updatedAt: string;
};

export type HanziHomeDbEditSaveResult = {
 ok: boolean;
 targetPath: string;
 rebuildSummary?: unknown;
 errors?: Array<{ path: string; message: string }>;
};
