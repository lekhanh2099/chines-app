import "server-only";

import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import { getCourseTextbookCatalog } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { getTextbookLessonOnServer } from "@/features/hanzihome/static-json/course-textbooks.server";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { getUserNotesForSearch } from "@/services/notes/notes.service";

import type { HanziHomeSearchRequest } from "../types";
import { collectNoteDocuments } from "./collect-note-documents";
import { collectReaderDocuments } from "./collect-reader-documents";
import { collectTextbookDocuments } from "./collect-textbook-documents";
import {
 collectNavigationDocuments,
 collectRadicalDocuments,
 collectStudioCourseDocuments,
} from "./collect-course-documents";
import { createSearchEngine, prepareSearchQuery, type SearchEngine } from "./search-engine";
import { rankSearchHits } from "./search-ranking";

/** Radicals are editable, so they are re-read on this TTL; static content only changes on deploy. */
const RADICAL_SEARCH_INDEX_TTL_MS = 5 * 60 * 1000;
/** Notes are read live per request; this bounds the per-request read to the most recent notes. */
export const NOTE_SEARCH_LIMIT = 300;

const staticEngineCache: { promise?: Promise<SearchEngine> } = {};

async function buildStaticSearchEngine() {
 const readerDocuments = await collectReaderDocuments();
 return createSearchEngine([
  ...collectTextbookDocuments(),
  ...collectTextbookDocuments({
   catalog: getCourseTextbookCatalog(),
   getLesson: getTextbookLessonOnServer,
  }),
  ...collectStudioCourseDocuments(),
  ...collectNavigationDocuments(),
  ...readerDocuments,
 ]);
}

/**
 * Static textbooks, the converted course books, the Studio course, Studio Reader
 * and the navigation shortcuts, built once per server process.
 */
function getStaticSearchEngine() {
 if (!staticEngineCache.promise) {
  const promise = buildStaticSearchEngine();
  staticEngineCache.promise = promise;
  promise.catch(() => {
   if (staticEngineCache.promise === promise) delete staticEngineCache.promise;
  });
 }
 return staticEngineCache.promise;
}

const radicalEngineCache: { engine?: SearchEngine; expiresAt: number } = { expiresAt: 0 };

/** Radicals are shared seed rows, so one index serves every signed-in learner. */
async function getRadicalSearchEngine() {
 const now = Date.now();
 if (radicalEngineCache.engine && radicalEngineCache.expiresAt > now) {
  return radicalEngineCache.engine;
 }
 const engine = createSearchEngine(
  collectRadicalDocuments(await hanzihomeContentRepository.getRadicals()),
 );
 radicalEngineCache.engine = engine;
 radicalEngineCache.expiresAt = now + RADICAL_SEARCH_INDEX_TTL_MS;
 return engine;
}

async function getNoteSearchEngine(context: AuthenticatedRouteContext) {
 const rows = await getUserNotesForSearch(context.supabase, context.user.id, NOTE_SEARCH_LIMIT);
 return createSearchEngine(collectNoteDocuments(rows));
}

/** Searches static content, the radicals and the user's own notes. */
export async function searchHanziHome(
 context: AuthenticatedRouteContext,
 request: HanziHomeSearchRequest,
) {
 const query = prepareSearchQuery(request.q);
 const engines = await Promise.all([
  getStaticSearchEngine(),
  getRadicalSearchEngine(),
  getNoteSearchEngine(context),
 ]);
 return rankSearchHits(engines, query, request);
}
