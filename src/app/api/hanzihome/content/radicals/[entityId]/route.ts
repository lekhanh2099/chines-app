import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
 params: Promise<{ entityId: string }>;
};

const optionalText = z.string().nullable().optional();
const radicalComponentSchema = z.object({
 form: z.string().trim().min(1),
 note: z.string().default(""),
});
const radicalGroupSchema = z.object({
 name: z.string().trim().min(1),
 chars: z.array(z.string().trim().min(1)),
});

const updateRadicalChangesSchema = z
 .object({
  radical: z.string().trim().min(1).optional(),
  name_vi: optionalText,
  strokes: z.number().int().positive().nullable().optional(),
  core_meaning: z
   .object({
    modern: z.string().optional(),
    history: z.string().optional(),
   })
   .optional(),
  variants: z.array(radicalComponentSchema).optional(),
  related_components: z.array(radicalComponentSchema).optional(),
  recognition: optionalText,
  distinguish: z.array(z.string()).optional(),
  groups: z.array(radicalGroupSchema).optional(),
 })
 .strict()
 .refine((value) => Object.keys(value).length > 0, "At least one changed field is required");

const updateRadicalPayloadSchema = z.object({
 reason: z.string().trim().min(1).default("Cập nhật bộ thủ HanziHome"),
 expectedUpdatedAt: z.iso.datetime({ offset: true }),
 changes: updateRadicalChangesSchema,
});

type RpcError = {
 code?: string;
 message: string;
};

function statusForError(error: RpcError) {
 if (error.code === "40001") return 409;
 if (error.code === "28000") return 401;
 if (error.code === "42501") return 403;
 if (error.code === "P0002") return 404;
 if (error.code === "22023" || error.code === "23505" || error.code === "23514") return 400;
 return 500;
}

function mutationError(message: string, status: number, details?: unknown) {
 return NextResponse.json({ error: message, details }, { status });
}

export async function PATCH(request: Request, context: RouteContext) {
 const { entityId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) return mutationError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsedBody = updateRadicalPayloadSchema.safeParse(body);
 if (!parsedBody.success) {
  return mutationError("Invalid HanziHome radical payload", 400, parsedBody.error.flatten());
 }

 const { data, error } = await supabase.rpc("hanzihome_update_radical_as_user", {
  p_entity_id: entityId,
  p_expected_updated_at: parsedBody.data.expectedUpdatedAt,
  p_changes: parsedBody.data.changes,
  p_reason: parsedBody.data.reason,
 });

 if (error) {
  return mutationError(error.message, statusForError(error), error.code);
 }

 return NextResponse.json(data);
}
