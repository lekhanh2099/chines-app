import type { ReaderDocumentRow } from "../model/reading-resource.schemas";

export function resolveReadingDocumentHref(document: ReaderDocumentRow): string {
 switch (document.kind) {
  case "core":
   return `/reader/course/${document.slug}`;
  case "hsk":
   return `/hsk/${document.slug.replace(/^hsk-/u, "")}`;
  case "reinforcement":
   return `/reader/practice/${document.slug}`;
  case "mock":
   return `/reader/mock/${document.slug}`;
  case "humanities":
   return `/humanities?document=${encodeURIComponent(document.id)}`;
  case "personal":
   return `/personal-learning/${document.slug}`;
  case "daily":
   return "/daily-reading";
 }
}
