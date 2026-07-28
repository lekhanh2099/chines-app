import type { JsonFieldValue } from "@/types/json";
import { timingSafeEqual } from "node:crypto";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createHtmlArtifactPayloadSchema } from "@/features/hanzihome/html-artifacts/html-artifact.schema";
import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase.generated";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const publishHtmlArtifactPayloadSchema = createHtmlArtifactPayloadSchema.extend({
 artifactId: z.uuid().optional(),
 mode: z.enum(["create", "update", "upsert"]).default("upsert"),
});

const detailColumns =
 "id, owner_id, folder_id, title, artifact_type, tags, html, created_at, updated_at";

const PublishAuthModeSchema = z.enum(["publish_token", "session", "user_token"]);

type PublishAuthContext = {
 supabase: SupabaseClient<Database>;
 ownerId: string;
 authMode: z.infer<typeof PublishAuthModeSchema>;
};
type PublishAuthResultMap = {
 success: { context: PublishAuthContext };
 failure: { response: NextResponse };
};
type PublishAuthResult = PublishAuthResultMap[keyof PublishAuthResultMap];

type PublishPayload = z.output<typeof publishHtmlArtifactPayloadSchema>;

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

function isMissingHtmlArtifactsTable(code: Parameters<typeof jsonError>[2]) {
 return code === "42P01" || code === "PGRST205";
}

function readBearerToken(request: Request) {
 const authorization = request.headers.get("authorization");
 const match = authorization?.match(/^Bearer\s+(.+)$/i);

 return match?.[1]?.trim() || null;
}

function isSameToken(value: string, expected: string) {
 const valueBuffer = Buffer.from(value);
 const expectedBuffer = Buffer.from(expected);

 return (
  valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer)
 );
}

function createBearerSupabaseClient(accessToken: string) {
 return createSupabaseClient<Database>(publicSupabaseEnv.url, publicSupabaseEnv.key, {
  auth: {
   autoRefreshToken: false,
   persistSession: false,
  },
  global: {
   headers: {
    Authorization: `Bearer ${accessToken}`,
   },
  },
 });
}

function createServiceSupabaseClient() {
 return createSupabaseClient<Database>(publicSupabaseEnv.url, getSupabaseServerSecret(), {
  auth: {
   autoRefreshToken: false,
   persistSession: false,
  },
 });
}

async function getPublishAuthContext(request: Request): Promise<PublishAuthResult> {
 const bearerToken = readBearerToken(request);
 const publishToken = process.env.HANZIHOME_HTML_PUBLISH_TOKEN;

 if (bearerToken && publishToken && isSameToken(bearerToken, publishToken)) {
  if (publishToken.length < 32) {
   return { response: jsonError("HTML publish token configuration is too weak.", 503) };
  }

  const ownerId = process.env.HANZIHOME_HTML_PUBLISH_OWNER_ID;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!ownerId || !serviceRoleKey) {
   return {
    response: jsonError("HTML publish token is configured without owner or service role env.", 500),
   };
  }

  return {
   context: {
    supabase: createServiceSupabaseClient(),
    ownerId,
    authMode: "publish_token",
   },
  };
 }

 if (bearerToken) {
  const supabase = createBearerSupabaseClient(bearerToken);
  const {
   data: { user },
   error,
  } = await supabase.auth.getUser(bearerToken);

  if (error || !user) {
   return { response: jsonError("Unauthorized", 401) };
  }

  return {
   context: {
    supabase,
    ownerId: user.id,
    authMode: "user_token",
   },
  };
 }

 const supabase = await createServerSupabaseClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return { response: jsonError("Unauthorized", 401) };
 }

 return {
  context: {
   supabase,
   ownerId: user.id,
   authMode: "session",
  },
 };
}

async function verifyFolderOwnership({
 supabase,
 ownerId,
 folderId,
}: {
 supabase: SupabaseClient<Database>;
 ownerId: string;
 folderId: PublishPayload["folderId"];
}) {
 if (!folderId) return null;

 const { data, error } = await supabase
  .from("hanzihome_html_artifact_folders")
  .select("id")
  .eq("id", folderId)
  .eq("owner_id", ownerId)
  .maybeSingle();

 if (error) return jsonError("Could not verify HTML artifact folder", 500, error.code);
 if (!data) return jsonError("HTML artifact folder not found", 404);

 return null;
}

function buildArtifactRow(payload: PublishPayload, ownerId: string) {
 return {
  ...(payload.artifactId ? { id: payload.artifactId } : {}),
  owner_id: ownerId,
  folder_id: payload.folderId ?? null,
  title: payload.title,
  artifact_type: payload.artifactType,
  tags: payload.tags,
  html: payload.html,
 };
}

function buildArtifactPatch(payload: PublishPayload) {
 return {
  folder_id: payload.folderId ?? null,
  title: payload.title,
  artifact_type: payload.artifactType,
  tags: payload.tags,
  html: payload.html,
 };
}

async function updateArtifact({
 supabase,
 ownerId,
 payload,
}: {
 supabase: SupabaseClient<Database>;
 ownerId: string;
 payload: PublishPayload;
}) {
 if (!payload.artifactId) {
  return { data: null, error: null };
 }

 return supabase
  .from("hanzihome_html_artifacts")
  .update(buildArtifactPatch(payload))
  .eq("id", payload.artifactId)
  .eq("owner_id", ownerId)
  .select(detailColumns)
  .maybeSingle();
}

async function createArtifact({
 supabase,
 ownerId,
 payload,
}: {
 supabase: SupabaseClient<Database>;
 ownerId: string;
 payload: PublishPayload;
}) {
 return supabase
  .from("hanzihome_html_artifacts")
  .insert(buildArtifactRow(payload, ownerId))
  .select(detailColumns)
  .single();
}

export async function GET() {
 const supabase = await createServerSupabaseClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 return NextResponse.json(
  {
   sessionUserId: user.id,
   publishTokenEnabled: Boolean(process.env.HANZIHOME_HTML_PUBLISH_TOKEN),
  },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}

export async function POST(request: Request) {
 const authResult = await getPublishAuthContext(request);

 if ("response" in authResult) {
  return authResult.response;
 }
 const authContext = authResult.context;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = publishHtmlArtifactPayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid HTML artifact publish payload",
    issues: z.flattenError(parsed.error),
   },
   { status: 400 },
  );
 }

 const payload = parsed.data;
 const folderError = await verifyFolderOwnership({
  supabase: authContext.supabase,
  ownerId: authContext.ownerId,
  folderId: payload.folderId,
 });

 if (folderError) {
  return folderError;
 }

 if (payload.mode === "update" && !payload.artifactId) {
  return jsonError("artifactId is required in update mode", 400);
 }

 if (payload.mode !== "create" && payload.artifactId) {
  const { data, error } = await updateArtifact({
   supabase: authContext.supabase,
   ownerId: authContext.ownerId,
   payload,
  });

  if (error) {
   if (isMissingHtmlArtifactsTable(error.code)) {
    return jsonError("HTML artifacts table is not ready", 503, error.code);
   }

   return jsonError("Could not publish HTML artifact", 500, error.code);
  }

  if (data) {
   return NextResponse.json({
    ok: true,
    mode: "updated",
    artifactId: data.id,
    updatedAt: data.updated_at,
    authMode: authContext.authMode,
   });
  }

  if (payload.mode === "update") {
   return jsonError("HTML artifact not found", 404);
  }
 }

 const { data, error } = await createArtifact({
  supabase: authContext.supabase,
  ownerId: authContext.ownerId,
  payload,
 });

 if (error) {
  if (isMissingHtmlArtifactsTable(error.code)) {
   return jsonError("HTML artifacts table is not ready", 503, error.code);
  }

  return jsonError("Could not publish HTML artifact", 500, error.code);
 }

 return NextResponse.json(
  {
   ok: true,
   mode: "created",
   artifactId: data.id,
   updatedAt: data.updated_at,
   authMode: authContext.authMode,
  },
  { status: 201 },
 );
}
