import { NextResponse } from "next/server";

import type {
 UpdateGrammarCorePayload,
 UpdateGrammarDetailSectionPayload,
 UpdateGrammarExamplePayload,
 UpdateVocabCorePayload,
 UpdateVocabDetailSectionPayload,
 UpdateVocabExamplePayload,
} from "@/features/hanzihome/schemas/node-edit.schema";
import { createClient } from "@/lib/supabase/server";

export type NodeEditRouteContext<ParamName extends string> = {
 params: Promise<Record<ParamName, string>>;
};

type DbPatchValue = string | number | string[] | null;
type DbPatch = Partial<Record<string, DbPatchValue>>;

type PatchError = {
 code?: string;
};

function nullableText(value: string | undefined) {
 if (value === undefined) return undefined;

 const trimmed = value.trim();
 return trimmed || null;
}

export function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

export function isMissingEditableContentTable(code: string | undefined) {
 return code === "42P01" || code === "PGRST205";
}

export async function getAuthenticatedSupabase() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 return { supabase, user };
}

export function invalidPayloadResponse(error: { flatten: () => unknown }) {
 return NextResponse.json(
  {
   error: "Invalid HanziHome edit payload",
   issues: error.flatten(),
  },
  { status: 400 },
 );
}

export function handlePatchResult<T>(
 data: T | null,
 error: PatchError | null,
 entityLabel: string,
) {
 if (error) {
  if (isMissingEditableContentTable(error.code)) {
   return jsonError("HanziHome editable content tables are not ready", 503, error.code);
  }

  return jsonError(`Could not update ${entityLabel}`, 500, error.code);
 }

 if (!data) {
  return jsonError(`${entityLabel} not found`, 404);
 }

 return NextResponse.json({ item: data });
}

export function buildVocabCorePatch(payload: UpdateVocabCorePayload) {
 const patch: DbPatch = {};

 if (payload.itemOrder !== undefined) patch.item_order = payload.itemOrder;
 if (payload.word !== undefined) patch.word = payload.word;
 if (payload.pinyin !== undefined) patch.pinyin = payload.pinyin;
 if (payload.hanViet !== undefined) patch.han_viet = payload.hanViet;
 if (payload.meaning !== undefined) patch.meaning = payload.meaning;
 if (payload.category !== undefined) patch.category = payload.category;
 if (payload.level !== undefined) patch.level = nullableText(payload.level);
 if (payload.posVi !== undefined) patch.pos_vi = nullableText(payload.posVi);
 if (payload.posZh !== undefined) patch.pos_zh = nullableText(payload.posZh);
 if (payload.tone !== undefined) patch.tone = nullableText(payload.tone);

 return patch;
}

export function buildVocabExamplePatch(payload: UpdateVocabExamplePayload) {
 const patch: DbPatch = {};

 if (payload.exampleOrder !== undefined) {
  patch.example_order = payload.exampleOrder;
 }
 if (payload.zh !== undefined) patch.zh = payload.zh;
 if (payload.pinyin !== undefined) patch.pinyin = nullableText(payload.pinyin);
 if (payload.vi !== undefined) patch.vi = nullableText(payload.vi);
 if (payload.note !== undefined) patch.note = nullableText(payload.note);

 return patch;
}

export function buildVocabDetailSectionPatch(payload: UpdateVocabDetailSectionPayload) {
 const patch: DbPatch = {};

 if (payload.sectionKey !== undefined) patch.section_key = payload.sectionKey;
 if (payload.title !== undefined) patch.title = payload.title;
 if (payload.lines !== undefined) patch.lines = payload.lines;
 if (payload.sectionOrder !== undefined) {
  patch.section_order = payload.sectionOrder;
 }

 return patch;
}

export function buildGrammarCorePatch(payload: UpdateGrammarCorePayload) {
 const patch: DbPatch = {};

 if (payload.pointOrder !== undefined) patch.point_order = payload.pointOrder;
 if (payload.title !== undefined) patch.title = payload.title;
 if (payload.cleanTitle !== undefined) patch.clean_title = payload.cleanTitle;
 if (payload.core !== undefined) patch.core = payload.core;
 if (payload.contentMd !== undefined) {
  patch.content_md = nullableText(payload.contentMd);
 }
 if (payload.structuresView !== undefined) {
  patch.structures_view = payload.structuresView;
 }
 if (payload.notes !== undefined) patch.notes = payload.notes;

 return patch;
}

export function buildGrammarExamplePatch(payload: UpdateGrammarExamplePayload) {
 const patch: DbPatch = {};

 if (payload.exampleOrder !== undefined) {
  patch.example_order = payload.exampleOrder;
 }
 if (payload.zh !== undefined) patch.zh = payload.zh;
 if (payload.pinyin !== undefined) patch.pinyin = nullableText(payload.pinyin);
 if (payload.vi !== undefined) patch.vi = nullableText(payload.vi);
 if (payload.note !== undefined) patch.note = nullableText(payload.note);

 return patch;
}

export function buildGrammarDetailSectionPatch(payload: UpdateGrammarDetailSectionPayload) {
 const patch: DbPatch = {};

 if (payload.sectionKey !== undefined) patch.section_key = payload.sectionKey;
 if (payload.title !== undefined) patch.title = payload.title;
 if (payload.lines !== undefined) patch.lines = payload.lines;
 if (payload.sectionOrder !== undefined) {
  patch.section_order = payload.sectionOrder;
 }

 return patch;
}
