import { NextResponse } from "next/server";

import {
 mapHtmlArtifactFolderRow,
 mapHtmlArtifactFolderRows,
} from "@/features/hanzihome/html-artifacts/html-artifact.mapper";
import { createHtmlArtifactFolderPayloadSchema } from "@/features/hanzihome/html-artifacts/html-artifact.schema";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const folderColumns =
 "id, owner_id, parent_folder_id, name, color, position, created_at, updated_at";

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

function isMissingFoldersTable(code: string | undefined) {
 return code === "42P01" || code === "PGRST205";
}

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const { data, error } = await supabase
  .from("hanzihome_html_artifact_folders")
  .select(folderColumns)
  .eq("owner_id", user.id)
  .order("position", { ascending: true })
  .order("updated_at", { ascending: false });

 if (error) {
  if (isMissingFoldersTable(error.code)) {
   return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  return jsonError("Could not load HTML artifact folders", 500, error.code);
 }

 return NextResponse.json(
  { items: mapHtmlArtifactFolderRows(data ?? []) },
  { headers: { "Cache-Control": "no-store" } },
 );
}

export async function POST(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: unknown = await request.json().catch(() => null);
 const parsed = createHtmlArtifactFolderPayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid HTML artifact folder payload",
    issues: parsed.error.flatten(),
   },
   { status: 400 },
  );
 }

 const payload = parsed.data;
 if (payload.parentFolderId) {
  const { data: parentFolder, error: parentError } = await supabase
   .from("hanzihome_html_artifact_folders")
   .select("id")
   .eq("id", payload.parentFolderId)
   .eq("owner_id", user.id)
   .maybeSingle();

  if (parentError) {
   return jsonError("Could not verify parent folder", 500, parentError.code);
  }

  if (!parentFolder) {
   return jsonError("Parent folder not found", 404);
  }
 }

 const { data, error } = await supabase
  .from("hanzihome_html_artifact_folders")
  .insert({
   owner_id: user.id,
   parent_folder_id: payload.parentFolderId ?? null,
   name: payload.name,
   color: payload.color,
   position: payload.position,
  })
  .select(folderColumns)
  .single();

 if (error) {
  if (isMissingFoldersTable(error.code)) {
   return jsonError("HTML artifact folders table is not ready", 503, error.code);
  }

  return jsonError("Could not create HTML artifact folder", 500, error.code);
 }

 return NextResponse.json({ item: mapHtmlArtifactFolderRow(data) }, { status: 201 });
}
