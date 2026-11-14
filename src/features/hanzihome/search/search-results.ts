import type {
 HanziHomeSearchCategory,
 HanziHomeSearchCategoryCounts,
 HanziHomeSearchKind,
} from "./types";
import { HanziHomeSearchCategorySchema } from "./types";

export const HANZIHOME_SEARCH_CATEGORIES = HanziHomeSearchCategorySchema.options;

/** The dialog tab that owns a result kind. Kinds without their own tab belong to "lesson". */
export function searchResultCategory(kind: HanziHomeSearchKind): HanziHomeSearchCategory {
 switch (kind) {
  case "vocab":
  case "grammar":
  case "exercise":
  case "radical":
  case "note":
   return kind;
  case "reader_document":
   return "reading";
  case "lesson_text":
  case "section":
  case "navigation":
   return "lesson";
 }
}

export function emptySearchCategoryCounts(): HanziHomeSearchCategoryCounts {
 return {
  all: 0,
  vocab: 0,
  grammar: 0,
  exercise: 0,
  lesson: 0,
  reading: 0,
  note: 0,
  radical: 0,
 };
}

export function countSearchResultCategories(kinds: Iterable<HanziHomeSearchKind>) {
 const counts = emptySearchCategoryCounts();
 for (const kind of kinds) {
  counts.all += 1;
  counts[searchResultCategory(kind)] += 1;
 }
 return counts;
}

export function splitSearchHighlight(text: string, rawQuery: string) {
 const query = rawQuery.trim();
 const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
 return index < 0
  ? { before: text, match: "", after: "" }
  : {
     before: text.slice(0, index),
     match: text.slice(index, index + query.length),
     after: text.slice(index + query.length),
    };
}
