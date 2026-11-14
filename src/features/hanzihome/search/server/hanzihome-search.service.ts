import "server-only";

import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { getUserNotesForSearch } from "@/services/notes/notes.service";

import type { HanziHomeSearchRequest } from "../types";
import { collectNoteDocuments } from "./collect-note-documents";
import { collectReaderDocuments } from "./collect-reader-documents";
import { collectTextbookDocuments } from "./collect-textbook-documents";
import {
 collectStudioCourseDocuments,
 collectSupabaseCourseDocuments,
} from "./collect-course-documents";
import { createSearchEngine, prepareSearchQuery, type SearchEngine } from "./search-engine";
import { rankSearchHits } from "./search-ranking";

/** Supabase course content is re-read on this TTL; static content only changes on deploy. */
export const COURSE_SEARCH_INDEX_TTL_MS = 5 * 60 * 1000;
const MAX_CACHED_COURSE_OWNERS = 8;
/** Notes are read live per request; this bounds the per-request read to the most recent notes. */
export const NOTE_SEARCH_LIMIT = 300;

const staticEngineCache: { promise?: Promise<SearchEngine> } = {};

async function buildStaticSearchEngine() {
 const readerDocuments = await collectReaderDocuments();
 return createSearchEngine([
  ...collectTextbookDocuments(),
  ...collectStudioCourseDocuments(),
  ...readerDocuments,
 ]);
}

/** Static textbooks, the Studio course and Studio Reader, built once per server process. */
export function getStaticSearchEngine() {
 if (!staticEngineCache.promise) {
  const promise = buildStaticSearchEngine();
  staticEngineCache.promise = promise;
  promise.catch(() => {
   if (staticEngineCache.promise === promise) delete staticEngineCache.promise;
  });
 }
 return staticEngineCache.promise;
}

type CachedCourseEngine = { engine: SearchEngine; expiresAt: number };
const courseEngines = new Map<AuthenticatedRouteContext["user"]["id"], CachedCourseEngine>();

/**
 * Course visibility follows the requesting user's Supabase session (RLS), so
 * the course index is cached per owner and never served to another user.
 */
async function getCourseSearchEngine(ownerId: AuthenticatedRouteContext["user"]["id"]) {
 const now = Date.now();
 const cached = courseEngines.get(ownerId);
 if (cached && cached.expiresAt > now) return cached.engine;

 const data = await hanzihomeContentRepository.getSearchData();
 const engine = createSearchEngine(collectSupabaseCourseDocuments(data));
 for (const [key, entry] of courseEngines) {
  if (entry.expiresAt <= now) courseEngines.delete(key);
 }
 courseEngines.delete(ownerId);
 courseEngines.set(ownerId, { engine, expiresAt: now + COURSE_SEARCH_INDEX_TTL_MS });
 while (courseEngines.size > MAX_CACHED_COURSE_OWNERS) {
  const oldest = courseEngines.keys().next();
  if (oldest.done) break;
  courseEngines.delete(oldest.value);
 }
 return engine;
}

async function getNoteSearchEngine(context: AuthenticatedRouteContext) {
 const rows = await getUserNotesForSearch(context.supabase, context.user.id, NOTE_SEARCH_LIMIT);
 return createSearchEngine(collectNoteDocuments(rows));
}

/** Searches static content, the user's visible courses and the user's own notes. */
export async function searchHanziHome(
 context: AuthenticatedRouteContext,
 request: HanziHomeSearchRequest,
) {
 const query = prepareSearchQuery(request.q);
 const engines = await Promise.all([
  getStaticSearchEngine(),
  getCourseSearchEngine(context.user.id),
  getNoteSearchEngine(context),
 ]);
 return rankSearchHits(engines, query, request);
}
