import { NextResponse } from "next/server";

import { mapHtmlArtifactFolderRow } from "@/features/hanzihome/html-artifacts/html-artifact.mapper";
import {
 updateHtmlArtifactFolderPayloadSchema,
 type UpdateHtmlArtifactFolderPayload,
} from "@/features/hanzihome/html-artifacts/html-artifact.schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
 params: Promise<{
  folderId: string;
 }>;
};

const folderColumns =
 "id, owner_id, parent_folder_id, name, color, position, created_at, updated_at";

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

function isMissingFoldersTable(code: string | undefined) {
 return code === "42P01" || code === "PGRST205";
}

function buildUpdatePatch(payload: UpdateHtmlArtifactFolderPayload) {
 const patch: {
  name?: string;
  parent_folder_id?: string | null;
  color?: UpdateHtmlArtifactFolderPayload["color"];
  position?: number;
 } = {};

 if (payload.name !== undefined) patch.name = payload.name;
 if (payload.parentFolderId !== undefined) patch.parent_folder_id = payload.parentFolderId;
 if (payload.color !== undefined) patch.color = payload.color;
 if (payload.position !== undefined) patch.position = payload.position;

 return patch;
}

function wouldCreateCycle({
 folderId,
 nextParentFolderId,
 folders,
}: {
 folderId: string;
 nextParentFolderId: string;
 folders: Array<{ id: string; parent_folder_id: string | null }>;
}) {
 if (folderId === nextParentFolderId) return true;

 const parentById = new Map(folders.map((folder) => [folder.id, folder.parent_folder_id]));
 let current: string | null | undefined = nextParentFolderId;
 const visited = new Set<string>();

 while (current) {
  if (current === folderId) return true;
  if (visited.has(current)) return true;
  visited.add(current);
  current = parentById.get(current);
 }

 return false;
}

export async function PATCH(request: Request, context: RouteContext) {
 const { folderId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: unknown = await request.json().catch(() => null);
 const parsed = updateHtmlArtifactFolderPayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid HTML artifact folder payload",
    issues: parsed.error.flatten(),
   },
   { status: 400 },
  );
 }

 if (parsed.data.parentFolderId !== undefined) {
  const nextParentFolderId = parsed.data.parentFolderId;

  if (nextParentFolderId) {
   const { data: parentFolder, error: parentError } = await supabase
    .from("hanzihome_html_artifact_folders")
    .select("id")
    .eq("id", nextParentFolderId)
    .eq("owner_id", user.id)
    .maybeSingle();

   if (parentError) {
    return jsonError("Could not verify parent folder", 500, parentError.code);
   }

   if (!parentFolder) {
    return jsonError("Parent folder not found", 404);
   }

   const { data: folderRows, error: folderRowsError } = await supabase
    .from("hanzihome_html_artifact_folders")
    .select("id, parent_folder_id")
    .eq("owner_id", user.id);

   if (folderRowsError) {
    return jsonError("Could not verify folder tree", 500, folderRowsError.code);
   }

   if (
    wouldCreateCycle({
     folderId,
     nextParentFolderId,
     folders: folderRows ?? [],
    })
   ) {
    return jsonError("Folder nesting would create a cycle", 400, "FOLDER_CYCLE");
   }
  }
 }

 const { data, error } = await supabase
  .from("hanzihome_html_artifact_folders")
  .update(buildUpdatePatch(parsed.data))
  .eq("id", folderId)
  .eq("owner_id", user.id)
  .select(folderColumns)
  .maybeSingle();

 if (error) {
  if (isMissingFoldersTable(error.code)) {
   return jsonError("HTML artifact folders table is not ready", 503, error.code);
  }

  return jsonError("Could not update HTML artifact folder", 500, error.code);
 }

 if (!data) {
  return jsonError("HTML artifact folder not found", 404);
 }

 return NextResponse.json({ item: mapHtmlArtifactFolderRow(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
 const { folderId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const { error } = await supabase
  .from("hanzihome_html_artifact_folders")
  .delete()
  .eq("id", folderId)
  .eq("owner_id", user.id);

 if (error) {
  if (isMissingFoldersTable(error.code)) {
   return jsonError("HTML artifact folders table is not ready", 503, error.code);
  }

  return jsonError("Could not delete HTML artifact folder", 500, error.code);
 }

 return NextResponse.json({ ok: true });
}
