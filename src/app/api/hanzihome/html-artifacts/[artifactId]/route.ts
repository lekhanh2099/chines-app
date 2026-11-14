import type { JsonFieldValue } from "@/types/json";
import { NextResponse } from "next/server";
import { z } from "zod";

import { mapHtmlArtifactRow } from "@/features/hanzihome/html-artifacts/html-artifact.mapper";
import {
 updateHtmlArtifactPayloadSchema,
 type UpdateHtmlArtifactPayload,
} from "@/features/hanzihome/html-artifacts/html-artifact.schema";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/supabase.generated";

type RouteContext = {
 params: Promise<{
  artifactId: string;
 }>;
};

const detailColumns =
 "id, owner_id, folder_id, title, artifact_type, tags, html, created_at, updated_at";

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

function isMissingHtmlArtifactsTable(code: Parameters<typeof jsonError>[2]) {
 return code === "42P01" || code === "PGRST205";
}

function buildUpdatePatch(payload: UpdateHtmlArtifactPayload) {
 const patch: TablesUpdate<"hanzihome_html_artifacts"> = {};

 if (payload.title !== undefined) patch.title = payload.title;
 if (payload.folderId !== undefined) patch.folder_id = payload.folderId;
 if (payload.artifactType !== undefined) patch.artifact_type = payload.artifactType;
 if (payload.tags !== undefined) patch.tags = payload.tags;
 if (payload.html !== undefined) patch.html = payload.html;

 return patch;
}

export async function GET(_request: Request, context: RouteContext) {
 const { artifactId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }
 if (!(await hasHanziHomeContentCapability(supabase, user.id))) {
  return jsonError("Forbidden", 403, "HANZIHOME_CONTENT_ROLE_REQUIRED");
 }

 const { data, error } = await supabase
  .from("hanzihome_html_artifacts")
  .select(detailColumns)
  .eq("id", artifactId)
  .eq("owner_id", user.id)
  .maybeSingle();

 if (error) {
  if (isMissingHtmlArtifactsTable(error.code)) {
   return jsonError("HTML artifacts table is not ready", 503, error.code);
  }

  return jsonError("Could not load HTML artifact", 500, error.code);
 }

 if (!data) {
  return jsonError("HTML artifact not found", 404);
 }

 return NextResponse.json({ item: mapHtmlArtifactRow(data) });
}

export async function PATCH(request: Request, context: RouteContext) {
 const { artifactId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }
 if (!(await hasHanziHomeContentCapability(supabase, user.id))) {
  return jsonError("Forbidden", 403, "HANZIHOME_CONTENT_ROLE_REQUIRED");
 }

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = updateHtmlArtifactPayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid HTML artifact payload",
    issues: z.flattenError(parsed.error),
   },
   { status: 400 },
  );
 }

 const { data, error } = await supabase
  .from("hanzihome_html_artifacts")
  .update(buildUpdatePatch(parsed.data))
  .eq("id", artifactId)
  .eq("owner_id", user.id)
  .select(detailColumns)
  .maybeSingle();

 if (error) {
  if (isMissingHtmlArtifactsTable(error.code)) {
   return jsonError("HTML artifacts table is not ready", 503, error.code);
  }

  return jsonError("Could not update HTML artifact", 500, error.code);
 }

 if (!data) {
  return jsonError("HTML artifact not found", 404);
 }

 return NextResponse.json({ item: mapHtmlArtifactRow(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
 const { artifactId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }
 if (!(await hasHanziHomeContentCapability(supabase, user.id))) {
  return jsonError("Forbidden", 403, "HANZIHOME_CONTENT_ROLE_REQUIRED");
 }

 const { error } = await supabase
  .from("hanzihome_html_artifacts")
  .delete()
  .eq("id", artifactId)
  .eq("owner_id", user.id);

 if (error) {
  if (isMissingHtmlArtifactsTable(error.code)) {
   return jsonError("HTML artifacts table is not ready", 503, error.code);
  }

  return jsonError("Could not delete HTML artifact", 500, error.code);
 }

 return NextResponse.json({ ok: true });
}
