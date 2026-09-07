import { containsHanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { ReaderDocumentModel, ReaderSegment } from "../model/reader-document.types";

const chineseSpeechSegmentPattern =
 /[\p{Script=Han}\p{Number}%％，。！？；：、“”‘’（）《》〈〉…—\s]+/gu;

export function buildTextbookHref(book: TextbookLesson["bookKey"], lessonNumber: number) {
 if (book === "nhip-cau") return `/hsk/nhip-cau-han-ngu?lesson=${lessonNumber}`;
 if (book === "doc-hieu") return `/hsk/doc-hieu?lesson=${lessonNumber}`;
 return `/hsk/han-thuong-mai?book=${book}&lesson=${lessonNumber}`;
}

export function stripLeadingEmoji(value: string) {
 return value.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "").trim();
}

export function lessonDisplayTitle(value: string) {
 return value.replace(/^BÀI\s+\d+\s*:\s*/iu, "").trim();
}

export function splitTrailingTranslation(value: string) {
 const separatorIndex = value.lastIndexOf(" (");
 if (separatorIndex < 0 || !value.endsWith(")")) {
  return { source: value.trim(), translation: "" };
 }

 const source = value.slice(0, separatorIndex).trim();
 const translation = value.slice(separatorIndex + 2, -1).trim();
 if (
  !containsHanziText(source) ||
  containsHanziText(translation) ||
  !/[A-Za-zÀ-ỹ]/u.test(translation)
 ) {
  return { source: value.trim(), translation: "" };
 }

 return { source, translation };
}

export function splitDialogueTurn(value: string) {
 const fullWidthColonIndex = value.indexOf("：");
 const asciiColonIndex = value.indexOf(":");
 const separatorIndex =
  fullWidthColonIndex >= 0 && asciiColonIndex >= 0
   ? Math.min(fullWidthColonIndex, asciiColonIndex)
   : Math.max(fullWidthColonIndex, asciiColonIndex);
 if (separatorIndex <= 0 || separatorIndex > 24) {
  return { speaker: "", content: value.trim() };
 }

 const speaker = value.slice(0, separatorIndex).trim();
 const content = value.slice(separatorIndex + 1).trim();
 if (!content || /[。！？；]/u.test(speaker)) {
  return { speaker: "", content: value.trim() };
 }

 return { speaker, content };
}

export function getChineseSpeechSegments(value: string) {
 const { source } = splitTrailingTranslation(value);
 return (source.match(chineseSpeechSegmentPattern) ?? [])
  .map((segment) => segment.trim())
  .filter((segment) => containsHanziText(segment));
}

export function buildBusinessChineseReaderDocument(
 lesson: TextbookLesson,
 activeView: string,
): ReaderDocumentModel {
 const segments: ReaderSegment[] = [];
 const sections: ReaderDocumentModel["sections"][number][] = [];
 const lessonTitle = splitTrailingTranslation(lessonDisplayTitle(lesson.title));
 const translationIndex = lesson.sections.findIndex((section) =>
  section.title.includes("DỊCH BÀI KHÓA"),
 );
 const translatedSection = lesson.sections[translationIndex];
 const sourceSection = translationIndex > 0 ? lesson.sections[translationIndex - 1] : undefined;

 for (const section of lesson.sections) {
  if (
   section.title.includes("DỊCH BÀI KHÓA") ||
   section.blocks.length === 0 ||
   (activeView !== "all" && section.category !== activeView)
  ) {
   continue;
  }

  const segmentIds: string[] = [];
  for (const block of section.blocks) {
   if (
    block.type === "subheading" &&
    segments.length === 0 &&
    block.text === lessonTitle.source &&
    (!block.translation || block.translation === lessonTitle.translation)
   ) {
    continue;
   }
   if (block.type === "table") {
    const headers = block.rows[0] ?? [];
    const pinyinColumnIndex = headers.findIndex((header) => /pinyin/iu.test(header));
    const hanziColumnIndex = headers.findIndex((header) =>
     /tiếng trung|giản thể|hán tự|từ vựng|^từ$/iu.test(header),
    );
    block.rows.slice(1).forEach((row, rowIndex) => {
     row.forEach((cell, cellIndex) => {
      if (cellIndex === pinyinColumnIndex) return;
      const speechSegments = getChineseSpeechSegments(cell);
      if (speechSegments.length === 0) return;
      const id = `${block.id}:row:${rowIndex}:cell:${cellIndex}`;
      const speechText = speechSegments.join(" ");
      segmentIds.push(id);
      segments.push({
       id,
       kind: "sentence",
       sectionId: section.id,
       zh: speechText,
       pinyin:
        cellIndex === hanziColumnIndex && pinyinColumnIndex >= 0
         ? row[pinyinColumnIndex]
         : undefined,
       speechText,
      });
     });
    });
    continue;
   }

   const blockText =
    section.category === "practice" && block.text.includes("→")
     ? block.text.slice(0, block.text.indexOf("→")).trim()
     : block.text;
   const inlineText = splitTrailingTranslation(blockText);
   const sourceTurn =
    block.translation !== undefined
     ? { speaker: block.speaker ?? "", content: block.text }
     : splitDialogueTurn(inlineText.source);
   const translatedBlock =
    section.id === sourceSection?.id
     ? translatedSection?.blocks[section.blocks.indexOf(block)]
     : undefined;
   const translationTurn =
    block.translation !== undefined
     ? { speaker: "", content: block.translation }
     : splitDialogueTurn(translatedBlock?.text || inlineText.translation);
   const sourceText = sourceTurn.content;
   const speechSegments = getChineseSpeechSegments(sourceText);
   if (speechSegments.length === 0) continue;
   const id =
    section.category === "practice" && block.text.includes("→") ? `${block.id}:prompt` : block.id;
   const speechText = block.translation !== undefined ? sourceText : speechSegments.join(" ");
   segmentIds.push(id);
   segments.push({
    id,
    kind:
     block.type === "subheading" ? "heading" : sourceTurn.speaker ? "dialogue-turn" : "paragraph",
    sectionId: section.id,
    zh: section.category === "text" ? sourceText : speechText,
    vi: translationTurn.content || undefined,
    speaker: sourceTurn.speaker ? { label: sourceTurn.speaker } : undefined,
    speechText,
   });
  }

  if (segmentIds.length > 0) {
   sections.push({
    id: section.id,
    title: stripLeadingEmoji(section.title),
    segmentIds,
   });
  }
 }

 return {
  id: `${lesson.id}:${activeView}`,
  language: "zh-CN",
  source: {
   kind: "lesson",
   sourceId: lesson.id,
   href: buildTextbookHref(lesson.bookKey, lesson.number),
   label: lesson.title,
  },
  title: lessonTitle.source,
  titleVi: lessonTitle.translation,
  sections,
  segments,
  metadata: [],
  capabilities: ["pinyin", "translation"],
 };
}
