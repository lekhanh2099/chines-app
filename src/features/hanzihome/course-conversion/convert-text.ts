import type { JsonObject, JsonValue } from "@/types/json";

import {
 arrayValue,
 byOrder,
 cleanLines,
 cleanText,
 containsHan,
 recordList,
 textOf,
} from "./conversion-text";
import type { CourseExport } from "./course-export.schema";
import type { SectionWriter } from "./section-writer";

/** Pairs the lines of a paragraph with its translation when both have the same line count. */
function writeParagraph(writer: SectionWriter, zh: string, vi: string, speaker: string) {
 const lines = cleanLines(zh);
 const translated = cleanLines(vi);
 const paired = lines.length === translated.length;
 const texts = paired ? lines : [lines.join(" ")];
 texts.forEach((text, index) =>
  writer.paragraph(text, {
   translation: paired ? (translated[index] ?? "") : translated.join(" "),
   ...(speaker ? { speaker } : {}),
  }),
 );
}

function writeLines(writer: SectionWriter, lines: readonly JsonObject[]) {
 for (const line of byOrder(lines)) {
  writeParagraph(writer, textOf(line.zh), textOf(line.vi), textOf(line.speaker));
 }
}

/**
 * Writes the lesson text (dialogue scenes/lines, narrative paragraphs) and
 * returns the comprehension questions the text payload carries, which belong
 * to practice. Source pinyin is dropped: the reader generates it.
 */
export function writeLessonText(payload: JsonObject, writer: SectionWriter): JsonValue[] {
 const questions = [...arrayValue(payload, "comprehension_questions")];
 for (const block of byOrder(recordList(payload.blocks))) {
  const context = [textOf(block.title_vi), textOf(block.summary_vi) || textOf(block.situation_vi)]
   .filter(Boolean)
   .join(" — ");
  writer.subheading(textOf(block.title), {
   translation: context === textOf(block.title) ? "" : context,
  });
  for (const scene of byOrder(recordList(block.scenes))) {
   writeLines(writer, recordList(scene.lines));
  }
  writeLines(writer, recordList(block.lines));
  for (const paragraph of byOrder(recordList(block.paragraphs))) {
   writeParagraph(writer, textOf(paragraph.zh), textOf(paragraph.vi), "");
  }
  questions.push(...arrayValue(block, "comprehension_questions"));
 }
 return questions;
}

const SPEAKER_PATTERN = /^([^：:]{1,12})[：:]\s*(.+)$/u;

/**
 * Fallback for a lesson whose text section has no usable blocks: the markdown
 * of `hanzihome_lesson_texts`. Italic lines are the source pinyin and are
 * dropped; a Vietnamese paragraph translates the Chinese paragraph before it.
 */
export function writeLessonTextFromMarkdown(
 texts: readonly CourseExport["texts"][number][],
 writer: SectionWriter,
) {
 const ordered = [...texts].sort((left, right) =>
  left.text_key.localeCompare(right.text_key, "en", { numeric: true }),
 );
 for (const text of ordered) {
  const paragraphs = text.content
   .split(/\n\s*\n/u)
   .map((paragraph) => paragraph.trim())
   .filter((paragraph) => paragraph && !/^_[^_][\s\S]*_$/u.test(paragraph));
  let pending = "";
  const flush = (translation: string) => {
   if (!pending) return;
   const turn = SPEAKER_PATTERN.exec(pending);
   const speaker = turn?.[1] ?? "";
   writer.paragraph(turn?.[2] ?? pending, { translation, ...(speaker ? { speaker } : {}) });
   pending = "";
  };
  for (const paragraph of paragraphs) {
   if (paragraph.startsWith("#")) {
    flush("");
    const title = cleanText(paragraph);
    writer.subheading(containsHan(title) ? title : (text.title ?? title), {
     translation: containsHan(title) ? "" : title,
    });
   } else if (containsHan(cleanText(paragraph).replace(SPEAKER_PATTERN, "$2"))) {
    flush("");
    pending = cleanText(paragraph);
   } else {
    flush(cleanText(paragraph).replace(SPEAKER_PATTERN, "$2"));
   }
  }
  flush("");
 }
}
