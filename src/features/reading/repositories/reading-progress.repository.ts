import "server-only";

import type { JsonObject } from "@/types/json";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

import { getReaderDocument } from "@/features/reading/repositories/reading-content.repository";
import {
 readerProgressRowSchema,
 type ReaderProgressRow,
} from "@/features/reading/model/reading-progress.schemas";

async function requireStaticReaderDocument(documentId: string) {
 const resource = await getReaderDocument(documentId);
 if (resource === null) throw new Error("Reader document is not in the static package");
}

export async function getReaderProgress(
 documentId: string,
 context: AuthenticatedRouteContext,
): Promise<ReaderProgressRow | null> {
 await requireStaticReaderDocument(documentId);
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_reader_progress")
  .select("*")
  .eq("user_id", context.user.id)
  .eq("document_id", documentId)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : readerProgressRowSchema.parse(data);
}

export async function getLatestIncompleteReaderProgress(
 context: AuthenticatedRouteContext,
): Promise<ReaderProgressRow | null> {
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_reader_progress")
  .select("*")
  .eq("user_id", context.user.id)
  .eq("completed", false)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : readerProgressRowSchema.parse(data);
}

export async function saveReaderProgressOwnedState(
 input: {
  documentId: string;
  completed: boolean;
  answers: JsonObject;
  expectedRevision: number;
 },
 context: AuthenticatedRouteContext,
): Promise<ReaderProgressRow> {
 await requireStaticReaderDocument(input.documentId);
 const authority = createServiceRoleSupabaseClient();
 const { user } = context;
 const { data: current, error: currentError } = await authority
  .from("hanzihome_reader_progress")
  .select("*")
  .eq("user_id", user.id)
  .eq("document_id", input.documentId)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);

 if (current === null) {
  if (input.expectedRevision !== 0) {
   throw new Error("Reader progress changed before it was created");
  }
  const { data, error } = await authority
   .from("hanzihome_reader_progress")
   .insert({
    user_id: user.id,
    document_id: input.documentId,
    completed: input.completed,
    answers: input.answers,
    revision: 0,
   })
   .select("*")
   .single();
  if (error) throw new Error(error.message);
  return readerProgressRowSchema.parse(data);
 }

 const currentProgress = readerProgressRowSchema.parse(current);
 if (currentProgress.revision !== input.expectedRevision) {
  throw new Error("Reader progress changed since it was loaded");
 }

 const { data, error } = await authority
  .from("hanzihome_reader_progress")
  .update({
   completed: input.completed,
   answers: input.answers,
   revision: currentProgress.revision + 1,
  })
  .eq("user_id", user.id)
  .eq("document_id", input.documentId)
  .eq("revision", input.expectedRevision)
  .select("*")
  .maybeSingle();
 if (error) throw new Error(error.message);
 if (data === null) throw new Error("Reader progress changed since it was loaded");
 return readerProgressRowSchema.parse(data);
}
