import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 mapHtmlArtifactFolderRows,
 mapHtmlArtifactRow,
 mapHtmlArtifactSummaryRows,
} from "@/features/hanzihome/html-artifacts/html-artifact.mapper";
import { createHtmlArtifactPayloadSchema } from "@/features/hanzihome/html-artifacts/html-artifact.schema";
import {
 apiError,
 privateNoStoreJson,
 requireSessionOrBearerAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const summaryColumns =
 "id, owner_id, folder_id, title, artifact_type, tags, created_at, updated_at";
const detailColumns = `${summaryColumns}, html`;
const folderColumns =
 "id, owner_id, parent_folder_id, name, color, position, created_at, updated_at";

function jsonError(message: string, status: number, code?: string) {
 return apiError(message, status, code);
}

function isMissingHtmlArtifactsTable(code: Parameters<typeof jsonError>[2]) {
 return code === "42P01" || code === "PGRST205";
}

function parseLimit(value: ReturnType<URLSearchParams["get"]>) {
 if (!value) return 100;

 const parsed = Number(value);
 if (!Number.isFinite(parsed)) return 100;

 return Math.min(Math.max(Math.trunc(parsed), 1), 200);
}

export async function GET(request: Request) {
 const auth = await requireSessionOrBearerAuthenticatedRoute(request);
 if (!auth.authenticated) return auth.response;
 const { supabase, user } = auth.context;

 const url = new URL(request.url);
 const limit = parseLimit(url.searchParams.get("limit"));

 const [artifactsResult, foldersResult] = await Promise.all([
  supabase
   .from("hanzihome_html_artifacts")
   .select(summaryColumns)
   .eq("owner_id", user.id)
   .order("updated_at", { ascending: false })
   .limit(limit),
  supabase
   .from("hanzihome_html_artifact_folders")
   .select(folderColumns)
   .eq("owner_id", user.id)
   .order("position", { ascending: true })
   .order("updated_at", { ascending: false }),
 ]);

 const { data, error } = artifactsResult;

 if (error) {
  if (isMissingHtmlArtifactsTable(error.code)) {
   return jsonError("HTML artifacts table is not ready", 503, error.code);
  }

  return jsonError("Could not load HTML artifacts", 500, error.code);
 }

 if (foldersResult.error) {
  if (isMissingHtmlArtifactsTable(foldersResult.error.code)) {
   return jsonError("HTML artifact folders table is not ready", 503, foldersResult.error.code);
  }

  return jsonError("Could not load HTML artifact folders", 500, foldersResult.error.code);
 }

 return privateNoStoreJson({
  items: mapHtmlArtifactSummaryRows(data ?? []),
  folders: mapHtmlArtifactFolderRows(foldersResult.data ?? []),
 });
}

export async function POST(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = createHtmlArtifactPayloadSchema.safeParse(body);

 if (!parsed.success) {
  return privateNoStoreJson(
   {
    error: "Invalid HTML artifact payload",
    issues: z.flattenError(parsed.error),
   },
   { status: 400 },
  );
 }

 const payload = parsed.data;
 const { data, error } = await supabase
  .from("hanzihome_html_artifacts")
  .insert({
   owner_id: user.id,
   folder_id: payload.folderId ?? null,
   title: payload.title,
   artifact_type: payload.artifactType,
   tags: payload.tags,
   html: payload.html,
  })
  .select(detailColumns)
  .single();

 if (error) {
  if (isMissingHtmlArtifactsTable(error.code)) {
   return jsonError("HTML artifacts table is not ready", 503, error.code);
  }

  return jsonError("Could not create HTML artifact", 500, error.code);
 }

 return privateNoStoreJson({ item: mapHtmlArtifactRow(data) }, { status: 201 });
}
