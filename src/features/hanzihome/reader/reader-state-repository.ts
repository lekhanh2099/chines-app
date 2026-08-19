import "server-only";

import type { JsonObject } from "@/types/json";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";

import {
 dailyReadingStateRowSchema,
 learningEventRowSchema,
 learningLoopItemRowSchema,
 personalLearningStateRowSchema,
 practiceAttemptRowSchema,
 readerProgressRowSchema,
 type DailyReadingStateRow,
 type LearningEventRow,
 type LearningLoopItemRow,
 type PersonalLearningStateRow,
 type PracticeAttemptRow,
 type ReaderProgressRow,
} from "./reader-state.schemas";
import {
 readerAnnotationRowSchema,
 readerPronunciationOverrideRowSchema,
 type ReaderAnnotationRow,
 type ReaderPronunciationOverrideRow,
} from "./reader.schemas";
import { getReaderAsset, getReaderDocument } from "./reader-content-repository";

type ReaderStateContext = AuthenticatedRouteContext;

function contextClient(context: ReaderStateContext | undefined) {
 return context === undefined
  ? authenticatedClient()
  : Promise.resolve({ client: context.supabase, user: context.user });
}

async function staticReaderResource(documentId: string) {
 const resource = await getReaderDocument(documentId);
 if (resource === null) throw new Error("Reader document is not in the static package");
 return resource;
}

async function validateReaderTarget(
 documentId: string,
 paragraphId: string | null,
 assetId: string | null,
 startOffset: number | null,
 endOffset: number | null,
) {
 const resource = await staticReaderResource(documentId);
 if ((paragraphId === null) === (assetId === null)) {
  throw new Error("Reader annotation target is invalid");
 }
 if (paragraphId !== null) {
  const paragraph = resource.paragraphs.find((candidate) => candidate.id === paragraphId);
  if (paragraph === undefined) throw new Error("Reader paragraph is not in the document");
  const length = Array.from(paragraph.zh).length;
  if (
   (startOffset !== null && startOffset < 0) ||
   (endOffset !== null && endOffset < 0) ||
   (startOffset !== null && startOffset > length) ||
   (endOffset !== null && endOffset > length) ||
   (startOffset !== null && endOffset !== null && endOffset <= startOffset)
  ) {
   throw new Error("Reader annotation range is invalid");
  }
 }
 if (assetId !== null) {
  const asset = await getReaderAsset(assetId);
  if (asset === null || (asset.document_id !== null && asset.document_id !== documentId)) {
   throw new Error("Reader asset is not in the static package");
  }
 }
 return resource;
}

async function authenticatedClient() {
 const client = await createClient();
 const {
  data: { user },
 } = await client.auth.getUser();
 if (!user) throw new Error("Authentication required");
 return { client, user };
}

export async function getReaderProgress(
 documentId: string,
 context?: ReaderStateContext,
): Promise<ReaderProgressRow | null> {
 await staticReaderResource(documentId);
 const { client, user } = await contextClient(context);
 const { data, error } = await client
  .from("hanzihome_reader_progress")
  .select("*")
  .eq("user_id", user.id)
  .eq("document_id", documentId)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : readerProgressRowSchema.parse(data);
}

export async function saveReaderProgress(
 input: {
  documentId: string;
  showPinyin: boolean;
  showMeaning: boolean;
  completed: boolean;
  summaryText: string;
  answers: JsonObject;
  expectedRevision: number;
 },
 context?: ReaderStateContext,
): Promise<ReaderProgressRow> {
 await staticReaderResource(input.documentId);
 const { client } = await contextClient(context);
 const { data, error } = await client.rpc("hanzihome_upsert_reader_progress", {
  p_document_id: input.documentId,
  p_show_pinyin: input.showPinyin,
  p_show_meaning: input.showMeaning,
  p_completed: input.completed,
  p_summary_text: input.summaryText,
  p_answers: input.answers,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return readerProgressRowSchema.parse(data);
}

export async function getPersonalLearningState(
 nodeId: string,
): Promise<PersonalLearningStateRow | null> {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_personal_learning_state")
  .select("*")
  .eq("user_id", user.id)
  .eq("node_id", nodeId)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : personalLearningStateRowSchema.parse(data);
}

export async function savePersonalLearningState(input: {
 nodeId: string;
 state: JsonObject;
 expectedRevision: number;
}): Promise<PersonalLearningStateRow> {
 const { client } = await authenticatedClient();
 const { data, error } = await client.rpc("hanzihome_upsert_personal_learning_state", {
  p_node_id: input.nodeId,
  p_state: input.state,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return personalLearningStateRowSchema.parse(data);
}

export async function getDailyReadingState(
 publishedDate: string,
): Promise<DailyReadingStateRow | null> {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_daily_reading_state")
  .select("*")
  .eq("user_id", user.id)
  .eq("published_date", publishedDate)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : dailyReadingStateRowSchema.parse(data);
}

export async function saveDailyReadingState(input: {
 publishedDate: string;
 state: JsonObject;
 expectedRevision: number;
}): Promise<DailyReadingStateRow> {
 const { client } = await authenticatedClient();
 const { data, error } = await client.rpc("hanzihome_upsert_daily_reading_state", {
  p_published_date: input.publishedDate,
  p_state: input.state,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return dailyReadingStateRowSchema.parse(data);
}

export async function savePracticeAttempt(input: {
 surface: "reader" | "dictation" | "translation" | "listening" | "personal-learning" | "shadowing";
 contentId: string;
 direction: string | null;
 answer: JsonObject;
 scorePercent: number | null;
 responseMs: number | null;
}): Promise<PracticeAttemptRow> {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_practice_attempts")
  .insert({
   user_id: user.id,
   surface: input.surface,
   content_id: input.contentId,
   direction: input.direction,
   answer: input.answer,
   score: input.scorePercent === null ? null : input.scorePercent / 100,
   response_ms: input.responseMs,
  })
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return practiceAttemptRowSchema.parse(data);
}

export async function listPracticeAttempts(input: {
 surface: "reader" | "dictation" | "translation" | "listening" | "personal-learning" | "shadowing";
 contentId: string;
}): Promise<PracticeAttemptRow[]> {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_practice_attempts")
  .select("*")
  .eq("user_id", user.id)
  .eq("surface", input.surface)
  .eq("content_id", input.contentId)
  .order("created_at", { ascending: false });
 if (error) throw new Error(error.message);
 return practiceAttemptRowSchema.array().parse(data);
}

export async function listReaderAnnotations(
 documentId: string,
 context?: ReaderStateContext,
): Promise<ReaderAnnotationRow[]> {
 await staticReaderResource(documentId);
 const { client, user } = await contextClient(context);
 const { data, error } = await client
  .from("hanzihome_reader_annotations")
  .select("*")
  .eq("user_id", user.id)
  .eq("document_id", documentId)
  .is("deleted_at", null)
  .order("updated_at", { ascending: false });
 if (error) throw new Error(error.message);
 return readerAnnotationRowSchema.array().parse(data);
}

export async function createReaderAnnotation(
 input: {
  documentId: string;
  paragraphId: string | null;
  assetId: string | null;
  annotationType: "highlight" | "underline" | "note" | "ink";
  pageNumber: number | null;
  startOffset: number | null;
  endOffset: number | null;
  selectedText: string;
  noteText: string;
  color: "yellow" | "green" | "blue" | "pink";
  payload: JsonObject;
 },
 context?: ReaderStateContext,
): Promise<ReaderAnnotationRow> {
 await validateReaderTarget(
  input.documentId,
  input.paragraphId,
  input.assetId,
  input.startOffset,
  input.endOffset,
 );
 const { client, user } = await contextClient(context);
 const { data, error } = await client
  .from("hanzihome_reader_annotations")
  .insert({
   user_id: user.id,
   document_id: input.documentId,
   paragraph_id: input.paragraphId,
   asset_id: input.assetId,
   annotation_type: input.annotationType,
   page_number: input.pageNumber,
   start_offset: input.startOffset,
   end_offset: input.endOffset,
   selected_text: input.selectedText,
   note_text: input.noteText,
   color: input.color,
   payload: input.payload,
  })
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return readerAnnotationRowSchema.parse(data);
}

export async function updateReaderAnnotation(
 input: {
  annotationId: string;
  assetId: string | null;
  color: "yellow" | "green" | "blue" | "pink";
  endOffset: number | null;
  expectedRevision: number;
  noteText: string;
  pageNumber: number | null;
  payload: JsonObject;
  paragraphId: string | null;
  selectedText: string;
  startOffset: number | null;
 },
 context?: ReaderStateContext,
): Promise<ReaderAnnotationRow> {
 const { client, user } = await contextClient(context);
 const { data: current, error: currentError } = await client
  .from("hanzihome_reader_annotations")
  .select("*")
  .eq("id", input.annotationId)
  .eq("user_id", user.id)
  .is("deleted_at", null)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current === null) throw new Error("Reader annotation not found");
 await validateReaderTarget(
  current.document_id,
  input.paragraphId,
  input.assetId,
  input.startOffset,
  input.endOffset,
 );
 const { data, error } = await client.rpc("hanzihome_update_reader_annotation", {
  p_annotation_id: input.annotationId,
  p_asset_id: input.assetId ?? "",
  p_color: input.color,
  p_end_offset: input.endOffset ?? -1,
  p_expected_revision: input.expectedRevision,
  p_note_text: input.noteText,
  p_page_number: input.pageNumber ?? -1,
  p_payload: input.payload,
  p_paragraph_id: input.paragraphId ?? "",
  p_selected_text: input.selectedText,
  p_start_offset: input.startOffset ?? -1,
 });
 if (error) throw new Error(error.message);
 return readerAnnotationRowSchema.parse(data);
}

export async function deleteReaderAnnotation(
 input: {
  annotationId: string;
  expectedRevision: number;
 },
 context?: ReaderStateContext,
): Promise<boolean> {
 const { client, user } = await contextClient(context);
 const { data: current, error: currentError } = await client
  .from("hanzihome_reader_annotations")
  .select("*")
  .eq("id", input.annotationId)
  .eq("user_id", user.id)
  .is("deleted_at", null)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current === null) throw new Error("Reader annotation not found");
 await validateReaderTarget(
  current.document_id,
  current.paragraph_id,
  current.asset_id,
  current.start_offset,
  current.end_offset,
 );
 const { data, error } = await client.rpc("hanzihome_delete_reader_annotation", {
  p_annotation_id: input.annotationId,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return z.boolean().parse(data);
}

export async function listReaderPronunciationOverrides(
 documentId: string,
 context?: ReaderStateContext,
): Promise<ReaderPronunciationOverrideRow[]> {
 await staticReaderResource(documentId);
 const { client, user } = await contextClient(context);
 const { data, error } = await client
  .from("hanzihome_reader_pronunciation_overrides")
  .select("*")
  .eq("user_id", user.id)
  .eq("document_id", documentId)
  .order("updated_at", { ascending: false });
 if (error) throw new Error(error.message);
 return readerPronunciationOverrideRowSchema.array().parse(data);
}

export async function getReaderStateBootstrap(
 documentId: string,
 context: ReaderStateContext,
): Promise<{
 progress: ReaderProgressRow | null;
 annotations: ReaderAnnotationRow[];
 overrides: ReaderPronunciationOverrideRow[];
}> {
 await staticReaderResource(documentId);
 const [progress, annotations, overrides] = await Promise.all([
  getReaderProgress(documentId, context),
  listReaderAnnotations(documentId, context),
  listReaderPronunciationOverrides(documentId, context),
 ]);
 return { progress, annotations, overrides };
}

export async function saveReaderPronunciationOverride(
 input: {
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
 },
 context?: ReaderStateContext,
): Promise<ReaderPronunciationOverrideRow> {
 const resource = await staticReaderResource(input.documentId);
 const paragraph = resource.paragraphs.find((candidate) => candidate.id === input.paragraphId);
 if (paragraph === undefined) throw new Error("Reader paragraph is not in the document");
 const length = Array.from(paragraph.zh).length;
 if (
  (input.startOffset !== null && input.startOffset < 0) ||
  (input.endOffset !== null && input.endOffset < 0) ||
  (input.startOffset !== null && input.startOffset > length) ||
  (input.endOffset !== null && input.endOffset > length) ||
  (input.startOffset !== null && input.endOffset !== null && input.endOffset <= input.startOffset)
 ) {
  throw new Error("Reader pronunciation range is invalid");
 }
 const { client } = await contextClient(context);
 const { data, error } = await client.rpc("hanzihome_upsert_reader_pronunciation_override", {
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
 });
 if (error) throw new Error(error.message);
 return readerPronunciationOverrideRowSchema.parse(data);
}

export async function deleteReaderPronunciationOverride(
 input: {
  id: string;
  expectedRevision: number;
 },
 context?: ReaderStateContext,
): Promise<boolean> {
 const { client, user } = await contextClient(context);
 const { data: current, error: currentError } = await client
  .from("hanzihome_reader_pronunciation_overrides")
  .select("*")
  .eq("id", input.id)
  .eq("user_id", user.id)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current === null) throw new Error("Reader pronunciation override not found");
 const resource = await staticReaderResource(current.document_id);
 if (!resource.paragraphs.some((paragraph) => paragraph.id === current.paragraph_id)) {
  throw new Error("Reader paragraph is not in the document");
 }
 const { data, error } = await client.rpc("hanzihome_delete_reader_pronunciation_override", {
  p_override_id: input.id,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return z.boolean().parse(data);
}

export async function listLearningLoopItems(): Promise<LearningLoopItemRow[]> {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_learning_loop_items")
  .select("*")
  .eq("user_id", user.id)
  .order("due_at", { ascending: true });
 if (error) throw new Error(error.message);
 return learningLoopItemRowSchema.array().parse(data);
}

export async function saveLearningLoopItem(input: {
 item: Omit<LearningLoopItemRow, "user_id" | "created_at" | "updated_at">;
}): Promise<LearningLoopItemRow> {
 const { client, user } = await authenticatedClient();
 const { data: current, error: currentError } = await client
  .from("hanzihome_learning_loop_items")
  .select("*")
  .eq("user_id", user.id)
  .eq("id", input.item.id)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current !== null && current.state !== "new") {
  return learningLoopItemRowSchema.parse(current);
 }
 const { data, error } = await client
  .from("hanzihome_learning_loop_items")
  .upsert({ user_id: user.id, ...input.item }, { onConflict: "user_id,id" })
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return learningLoopItemRowSchema.parse(data);
}

export async function rateLearningLoopItem(input: {
 itemId: string;
 rating: "again" | "hard" | "good";
 expectedRevision: number;
}): Promise<LearningLoopItemRow> {
 const { client } = await authenticatedClient();
 const { data, error } = await client.rpc("hanzihome_rate_learning_loop_item", {
  p_item_id: input.itemId,
  p_rating: input.rating,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return learningLoopItemRowSchema.parse(data);
}

export async function appendLearningEvent(input: {
 kind: "encountered" | "inspected" | "review-added";
 sourceId: string;
 sourceHref: string;
 term: string;
 contextText: string;
}): Promise<LearningEventRow> {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_learning_events")
  .insert({
   user_id: user.id,
   kind: input.kind,
   source_id: input.sourceId,
   source_href: input.sourceHref,
   term: input.term,
   context_text: input.contextText,
  })
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return learningEventRowSchema.parse(data);
}
