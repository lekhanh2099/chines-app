import "server-only";

import speakingDrillsSeed from "../static-json/khau-ngu-doubao.json";
import { speakingDrillsContentSchema } from "./speaking-drills.schemas";
import type { SpeakingDrillsCatalogBook, SpeakingDrillSelection } from "./speaking-drills.types";

const speakingDrillsContent = speakingDrillsContentSchema.parse(speakingDrillsSeed);

export function getSpeakingDrillsCatalog(): SpeakingDrillsCatalogBook[] {
 return speakingDrillsContent.books.map((book) => ({
  id: book.id,
  name: book.name,
  title: book.title,
  subtitle: book.subtitle,
  lessons: book.lessons.map((lesson) => ({
   id: lesson.id,
   no: lesson.no,
   title: lesson.title,
   topics: lesson.topics.map((topic) => ({
    id: topic.id,
    no: topic.no,
    titleVi: topic.titleVi,
   })),
  })),
 }));
}

/** Resolves the requested topic, falling back to the first topic of the first book. */
export function getSpeakingDrillSelection(topicId: string): SpeakingDrillSelection {
 for (const book of speakingDrillsContent.books) {
  for (const lesson of book.lessons) {
   const topic = lesson.topics.find((candidate) => candidate.id === topicId);
   if (topic) return toSelection(book, lesson, topic);
  }
 }

 const [book] = speakingDrillsContent.books;
 const [lesson] = book.lessons;
 const [topic] = lesson.topics;
 return toSelection(book, lesson, topic);
}

function toSelection(
 book: (typeof speakingDrillsContent.books)[number],
 lesson: (typeof book.lessons)[number],
 topic: (typeof lesson.topics)[number],
): SpeakingDrillSelection {
 return {
  bookId: book.id,
  generalPrompt: book.generalPrompt,
  lesson: {
   id: lesson.id,
   no: lesson.no,
   title: lesson.title,
   vocab: lesson.vocab,
   patterns: lesson.patterns,
   expressions: lesson.expressions,
   notes: lesson.notes,
  },
  topic,
 };
}
