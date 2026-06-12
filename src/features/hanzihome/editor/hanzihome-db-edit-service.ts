import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
 HanziHomeDbEditDraft,
 HanziHomeDbEditSaveResult,
} from "@/features/hanzihome/editor/hanzihome-db-edit.types";
import { exportHanziHomeDbEditDraft } from "@/features/hanzihome/editor/hanzihome-db-exporter";
import {
 auditHanziHomeDbAfterEdit,
 rebuildHanziHomeDbAfterEdit,
} from "@/features/hanzihome/editor/hanzihome-db-importer";

function stableStringify(value: unknown) {
 return `${JSON.stringify(value, null, 2)}\n`;
}

function isEditorEnabled() {
 return process.env.NODE_ENV === "development" || process.env.HANZIHOME_EDITOR_ENABLED === "true";
}

function validateDraft(draft: HanziHomeDbEditDraft) {
 if (draft.validationErrors.length > 0) {
  return draft.validationErrors;
 }

 if (!draft.id.trim()) {
  return [{ path: "id", message: "Draft id is required." }];
 }

 if (draft.next === undefined) {
  return [{ path: "next", message: "Draft next payload is required." }];
 }

 return [];
}

export async function saveHanziHomeDbEditDraft(
 draft: HanziHomeDbEditDraft,
): Promise<HanziHomeDbEditSaveResult> {
 let exported: ReturnType<typeof exportHanziHomeDbEditDraft>;

 try {
  exported = exportHanziHomeDbEditDraft(draft);
 } catch (error) {
  return {
   ok: false,
   targetPath: "",
   errors: [
    {
     path: "target",
     message: error instanceof Error ? error.message : "Invalid edit target.",
    },
   ],
  };
 }

 if (!isEditorEnabled()) {
  return {
   ok: false,
   targetPath: exported.targetPath,
   errors: [
    {
     path: "env",
     message:
      "HanziHome DB editor persistence is available only in development or when HANZIHOME_EDITOR_ENABLED=true.",
    },
   ],
  };
 }

 const validationErrors = validateDraft(draft);
 if (validationErrors.length > 0) {
  return {
   ok: false,
   targetPath: exported.targetPath,
   errors: validationErrors,
  };
 }

 const absoluteTargetPath = path.join(process.cwd(), exported.targetPath);
 const originalJson = await readFile(absoluteTargetPath, "utf8").catch(() => null);

 try {
  if (originalJson === null) {
   throw new Error(`Edit target does not exist: ${exported.targetPath}`);
  }

  await writeFile(absoluteTargetPath, stableStringify(exported.json), "utf8");
  const rebuild = await rebuildHanziHomeDbAfterEdit();
  const audit = await auditHanziHomeDbAfterEdit();

  return {
   ok: true,
   targetPath: exported.targetPath,
   rebuildSummary: { rebuild, audit },
  };
 } catch (error) {
  if (originalJson !== null) {
   await writeFile(absoluteTargetPath, originalJson, "utf8");
   await rebuildHanziHomeDbAfterEdit().catch(() => undefined);
  }

  return {
   ok: false,
   targetPath: exported.targetPath,
   errors: [
    {
     path: exported.targetPath,
     message: error instanceof Error ? error.message : "Unknown save error.",
    },
   ],
  };
 }
}
