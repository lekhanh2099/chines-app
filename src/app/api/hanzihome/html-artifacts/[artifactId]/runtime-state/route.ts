import { NextResponse } from "next/server";

import {
 htmlArtifactRuntimeStateSchema,
 updateHtmlArtifactRuntimeStatePayloadSchema,
} from "@/features/hanzihome/html-artifacts/html-artifact.schema";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{
  artifactId: string;
 }>;
};

type RuntimeStateRow = {
 state: unknown;
};

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

function isMissingRuntimeStateTable(code: string | undefined) {
 return code === "42P01" || code === "PGRST205";
}

function mapRuntimeState(row: RuntimeStateRow | null) {
 const parsed = htmlArtifactRuntimeStateSchema.safeParse(row?.state ?? {});

 return parsed.success ? parsed.data : {};
}

async function verifyOwnedArtifact(
 supabase: Awaited<ReturnType<typeof createClient>>,
 artifactId: string,
 ownerId: string,
) {
 const { data, error } = await supabase
  .from("hanzihome_html_artifacts")
  .select("id")
  .eq("id", artifactId)
  .eq("owner_id", ownerId)
  .maybeSingle();

 if (error) return { ok: false, error };
 if (!data) return { ok: false, notFound: true };

 return { ok: true };
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

 const artifact = await verifyOwnedArtifact(supabase, artifactId, user.id);
 if (!artifact.ok) {
  if (artifact.notFound) return jsonError("HTML artifact not found", 404);
  if (isMissingRuntimeStateTable(artifact.error?.code)) {
   return jsonError("HTML artifacts table is not ready", 503, artifact.error?.code);
  }
  return jsonError("Could not verify HTML artifact", 500, artifact.error?.code);
 }

 const { data, error } = await supabase
  .from("hanzihome_html_artifact_runtime_states")
  .select("state")
  .eq("artifact_id", artifactId)
  .eq("owner_id", user.id)
  .maybeSingle();

 if (error) {
  if (isMissingRuntimeStateTable(error.code)) {
   return jsonError("HTML artifact runtime state table is not ready", 503, error.code);
  }

  return jsonError("Could not load HTML artifact runtime state", 500, error.code);
 }

 return NextResponse.json(
  { state: mapRuntimeState(data) },
  { headers: { "Cache-Control": "no-store" } },
 );
}

export async function PUT(request: Request, context: RouteContext) {
 const { artifactId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: unknown = await request.json().catch(() => null);
 const parsed = updateHtmlArtifactRuntimeStatePayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid HTML artifact runtime state payload",
    issues: parsed.error.flatten(),
   },
   { status: 400 },
  );
 }

 const artifact = await verifyOwnedArtifact(supabase, artifactId, user.id);
 if (!artifact.ok) {
  if (artifact.notFound) return jsonError("HTML artifact not found", 404);
  if (isMissingRuntimeStateTable(artifact.error?.code)) {
   return jsonError("HTML artifacts table is not ready", 503, artifact.error?.code);
  }
  return jsonError("Could not verify HTML artifact", 500, artifact.error?.code);
 }

 const { data, error } = await supabase
  .from("hanzihome_html_artifact_runtime_states")
  .upsert(
   {
    owner_id: user.id,
    artifact_id: artifactId,
    state: parsed.data.state,
   },
   { onConflict: "owner_id,artifact_id" },
  )
  .select("state")
  .maybeSingle();

 if (error) {
  if (isMissingRuntimeStateTable(error.code)) {
   return jsonError("HTML artifact runtime state table is not ready", 503, error.code);
  }

  return jsonError("Could not save HTML artifact runtime state", 500, error.code);
 }

 return NextResponse.json({ state: mapRuntimeState(data) });
}
