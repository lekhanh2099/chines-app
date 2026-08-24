import "server-only";

import { z } from "zod";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

import {
 readerPronunciationOverrideRowSchema,
 type ReaderPronunciationOverrideRow,
} from "./reader.schemas";
import { getReaderDocument } from "./reader-content-repository";

const readerGraphemeSegmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });

type ReaderPronunciationOverrideInput = {
 id: string;
 documentId: string;
 paragraphId: string;
 text: string;
 readings: string[];
 scope: "character-global" | "phrase" | "sentence-instance";
 sentenceText: string | null;
 startOffset: number | null;
 endOffset: number | null;
 expectedRevision: number;
};

async function requireStaticReaderDocument(documentId: string) {
 const resource = await getReaderDocument(documentId);
 if (resource === null) throw new Error("Reader document is not in the static package");
 return resource;
}

export function validateReaderPronunciationOverride(
 input: ReaderPronunciationOverrideInput,
 paragraphText: string,
) {
 const textGraphemes = [...readerGraphemeSegmenter.segment(input.text)];
 if (textGraphemes.length !== input.readings.length) {
  throw new Error("Reader pronunciation readings must match the selected text");
 }

 const boundaries = new Set<number>([paragraphText.length]);
 for (const grapheme of readerGraphemeSegmenter.segment(paragraphText)) {
  boundaries.add(grapheme.index);
 }

 if (input.scope === "sentence-instance") {
  if (
   input.sentenceText !== paragraphText ||
   input.startOffset === null ||
   input.endOffset === null ||
   input.startOffset >= input.endOffset ||
   !boundaries.has(input.startOffset) ||
   !boundaries.has(input.endOffset) ||
   paragraphText.slice(input.startOffset, input.endOffset) !== input.text
  ) {
   throw new Error("Reader pronunciation range is invalid");
  }
  return;
 }

 if (
  input.sentenceText !== null ||
  input.startOffset !== null ||
  input.endOffset !== null ||
  !paragraphText.includes(input.text)
 ) {
  throw new Error("Reader pronunciation override does not match its paragraph");
 }

 if (input.scope === "character-global" && textGraphemes.length !== 1) {
  throw new Error("Reader character pronunciation override must target one character");
 }
}

export async function listReaderPronunciationOverrides(
 documentId: string,
 context: AuthenticatedRouteContext,
): Promise<ReaderPronunciationOverrideRow[]> {
 await requireStaticReaderDocument(documentId);
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_reader_pronunciation_overrides")
  .select("*")
  .eq("user_id", context.user.id)
  .eq("document_id", documentId)
  .order("updated_at", { ascending: false });
 if (error) throw new Error(error.message);
 return readerPronunciationOverrideRowSchema.array().parse(data);
}

export async function saveReaderPronunciationOverride(
 input: ReaderPronunciationOverrideInput,
 context: AuthenticatedRouteContext,
): Promise<ReaderPronunciationOverrideRow> {
 const resource = await requireStaticReaderDocument(input.documentId);
 const paragraph = resource.paragraphs.find((candidate) => candidate.id === input.paragraphId);
 if (paragraph === undefined) throw new Error("Reader paragraph is not in the document");
 validateReaderPronunciationOverride(input, paragraph.zh);
 const { data, error } = await createServiceRoleSupabaseClient().rpc(
  "hanzihome_upsert_reader_pronunciation_override_as_server",
  {
   p_user_id: context.user.id,
   p_override_id: input.id,
   p_document_id: input.documentId,
   p_paragraph_id: input.paragraphId,
   p_text: input.text,
   p_readings: input.readings,
   p_scope: input.scope,
   p_sentence_text: input.sentenceText ?? "",
   p_start_offset: input.startOffset ?? -1,
   p_end_offset: input.endOffset ?? -1,
   p_expected_revision: input.expectedRevision,
  },
 );
 if (error) throw new Error(error.message);
 return readerPronunciationOverrideRowSchema.parse(data);
}

export async function deleteReaderPronunciationOverride(
 input: { id: string; expectedRevision: number },
 context: AuthenticatedRouteContext,
): Promise<boolean> {
 const authority = createServiceRoleSupabaseClient();
 const { data: current, error: currentError } = await authority
  .from("hanzihome_reader_pronunciation_overrides")
  .select("*")
  .eq("id", input.id)
  .eq("user_id", context.user.id)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current === null) throw new Error("Reader pronunciation override not found");
 const resource = await requireStaticReaderDocument(current.document_id);
 if (!resource.paragraphs.some((paragraph) => paragraph.id === current.paragraph_id)) {
  throw new Error("Reader paragraph is not in the document");
 }
 const { data, error } = await authority.rpc(
  "hanzihome_delete_reader_pronunciation_override_as_server",
  {
   p_user_id: context.user.id,
   p_override_id: input.id,
   p_expected_revision: input.expectedRevision,
  },
 );
 if (error) throw new Error(error.message);
 return z.boolean().parse(data);
}
