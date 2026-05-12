import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const inputDocx = process.argv[2];
const outputDir = process.argv[3] || path.join(process.cwd(), "data/import");
const sourceFileName = path.basename(inputDocx || "");
const courseKey = `docx:${sourceFileName.replace(/\.[^.]+$/, "")}`;

if (!inputDocx) {
 console.error("Usage: node scripts/parse-hanyu-vocab-docx.mjs <file.docx> [outputDir]");
 process.exit(1);
}

function decodeXml(value) {
 return value
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'");
}

function extractParagraphs(docxPath) {
 const xml = execFileSync("unzip", ["-p", docxPath, "word/document.xml"], {
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 64,
 });

 return [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
  .map((paragraph) =>
   [...paragraph[0].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) => decodeXml(match[1]))
    .join("")
    .trim(),
  )
  .filter(Boolean);
}

function parseLessonNumber(text) {
 const match = text.match(/Bài\s+(\d+)/i);
 return match ? Number(match[1]) : null;
}

function lessonKeyFromTitle(text) {
 const match = text.match(/Bài\s+(.+)$/i);
 if (!match) return "L00";
 const normalized = match[1].replace(/\s+/g, "").replace(/&/g, "-");
 return `L${normalized.padStart(2, "0")}`;
}

function isEntryHeader(line) {
 return /^[\u3400-\u9fff（）()·]+(?:\s*\/\s*[\u3400-\u9fff（）()·]+)?\s+[–-]\s+[^–-]+?\s+[–-]\s+[^–-]+?\s+[–-]\s+.+/.test(
  line,
 );
}

function parseEntryHeader(line) {
 const parts = line.split(/\s+[–-]\s+/);
 return {
  hanzi: parts[0]?.trim() || "",
  pinyin: parts[1]?.trim() || "",
  sino_vietnamese: parts[2]?.trim() || "",
  meaning_summary: parts.slice(3).join(" – ").trim(),
 };
}

function sectionNumber(line) {
 const match = line.match(/^([1-7])\.\s*/);
 return match ? Number(match[1]) : null;
}

function parseOverview(paragraphs, startIndex, lessonKey) {
 const categories = new Map();
 let index = startIndex + 1;

 while (index < paragraphs.length && !isEntryHeader(paragraphs[index])) {
  const maybeCategory = paragraphs[index];
  const maybeWords = paragraphs[index + 1] || "";

  if (
   maybeCategory &&
   maybeWords.includes(",") &&
   !["Nhóm", "Từ vựng"].includes(maybeCategory)
  ) {
   for (const word of maybeWords.split(",").map((item) => item.trim()).filter(Boolean)) {
    categories.set(`${lessonKey}:${word}`, maybeCategory);
   }
   index += 2;
   continue;
  }

  index += 1;
 }

 return categories;
}

function splitSections(lines) {
 const sections = new Map();
 let current = 0;
 const preface = [];

 for (const line of lines) {
  const number = sectionNumber(line);
  if (number) {
   current = number;
   sections.set(current, []);
   continue;
  }

  if (!current) {
   preface.push(line);
  } else {
   sections.get(current)?.push(line);
  }
 }

 return { preface, sections };
}

function parseExample(line) {
 const match = line.match(/^(.+?)\(([^()]*)\)\s*(.*?)(?:\s*→\s*(.+))?$/);
 if (!match) {
  return { zh: line, pinyin: "", vi: "" };
 }

 return {
  zh: match[1].trim(),
  pinyin: match[2].trim(),
  vi: match[3].trim(),
  note: match[4]?.trim() || undefined,
 };
}

function parseDefinition(lines, fallbackMeaning) {
 const hanVietLine = lines.find((line) => line.startsWith("Âm Hán Việt:"));
 const meaningLine = lines.find((line) => line.startsWith("Nghĩa:"));

 return {
  hanViet: hanVietLine?.replace(/^Âm Hán Việt:\s*/i, "").trim(),
  meaning:
   meaningLine?.replace(/^Nghĩa:\s*/i, "").trim() || fallbackMeaning || "",
 };
}

function cleanSectionLines(lines) {
 return lines.map((line) => line.trim()).filter(Boolean);
}

function parseEntries(paragraphs) {
 const lessons = [];
 const items = [];
 const categoryMap = new Map();
 let currentLesson = {
  lesson_key: "L00",
  lesson_number: null,
  lesson_title: "Không rõ bài",
  count: 0,
 };

 for (let index = 0; index < paragraphs.length; index += 1) {
  const line = paragraphs[index];

  if (line.includes("Tổng quan") && /Bài\s+\d+/i.test(line)) {
   currentLesson = {
    lesson_key: lessonKeyFromTitle(line),
    lesson_number: parseLessonNumber(line),
    lesson_title: line.replace(/^📊\s*/, ""),
    count: 0,
   };
   lessons.push(currentLesson);
   for (const [key, value] of parseOverview(paragraphs, index, currentLesson.lesson_key)) {
    categoryMap.set(key, value);
   }
   continue;
  }

  if (!isEntryHeader(line)) continue;

  const header = parseEntryHeader(line);
  const body = [];
  let cursor = index + 1;
  while (
   cursor < paragraphs.length &&
   !isEntryHeader(paragraphs[cursor]) &&
   !(paragraphs[cursor].includes("Tổng quan") && /Bài\s+\d+/i.test(paragraphs[cursor]))
  ) {
   body.push(paragraphs[cursor]);
   cursor += 1;
  }

  const { preface, sections } = splitSections(body);
  const pos = preface[0] || "";
  const definition = parseDefinition(cleanSectionLines(sections.get(1) || []), header.meaning_summary);
  const decomposition = cleanSectionLines(sections.get(2) || []).join("\n");
  const comparisons = cleanSectionLines(sections.get(3) || []);
  const collocations = cleanSectionLines(sections.get(4) || []);
  const examples = cleanSectionLines(sections.get(5) || []).map(parseExample);
  const culturalNote = cleanSectionLines(sections.get(6) || []).join("\n");
  const usageNote = cleanSectionLines(sections.get(7) || []).join("\n");
  const category =
   categoryMap.get(`${currentLesson.lesson_key}:${header.hanzi}`) ||
   categoryMap.get(`${currentLesson.lesson_key}:${header.hanzi.replace(/[()（）]/g, "")}`) ||
   "";

  currentLesson.count += 1;
  items.push({
   hanzi: header.hanzi,
   pinyin: header.pinyin,
   sino_vietnamese: header.sino_vietnamese || definition.hanViet || "",
   meaning_summary: header.meaning_summary,
   meaning_detail: definition.meaning,
   han_viet_note: definition.hanViet
    ? `Âm Hán Việt: ${definition.hanViet}`
    : "",
   source_metadata: {
    course_key: courseKey,
    lesson_key: currentLesson.lesson_key,
    lesson_number: currentLesson.lesson_number,
    lesson_title: currentLesson.lesson_title,
    row_number: currentLesson.count,
    category,
    source_file: sourceFileName,
   },
   definitions: [
    {
     pos,
     meaning: definition.meaning,
     examples: [],
    },
   ],
   word_type: pos,
   decomposition,
   comparisons,
   collocations,
   examples,
   cultural_note: culturalNote,
   usage_note: usageNote,
   notes: `Source: ${currentLesson.lesson_key} #${currentLesson.count}${category ? `, ${category}` : ""}`,
   source: {
    course_key: courseKey,
    sheet: currentLesson.lesson_key,
    lesson_number: currentLesson.lesson_number,
    lesson_title: currentLesson.lesson_title,
    row_number: currentLesson.count,
    category,
   },
  });

  index = cursor - 1;
 }

 return { lessons, items };
}

const paragraphs = extractParagraphs(inputDocx);
const parsed = parseEntries(paragraphs);

fs.mkdirSync(outputDir, { recursive: true });
const stagingPath = path.join(outputDir, "hanyu-docx-vocab-staging.json");
const payloadPath = path.join(outputDir, "hanyu-docx-vocab-import-payload.json");

fs.writeFileSync(
 stagingPath,
 JSON.stringify(
  {
   source_file: inputDocx,
   generated_at: new Date().toISOString(),
   lessons: parsed.lessons,
   items: parsed.items,
  },
  null,
  2,
 ),
);

fs.writeFileSync(
 payloadPath,
 JSON.stringify(
  {
   items: parsed.items.map(({ source, ...item }) => item),
  },
  null,
  2,
 ),
);

console.log(
 JSON.stringify(
  {
   paragraphs: paragraphs.length,
   lessons: parsed.lessons.length,
   items: parsed.items.length,
   stagingPath,
   payloadPath,
  },
  null,
  2,
 ),
);
