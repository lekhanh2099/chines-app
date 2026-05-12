import fs from "node:fs";
import path from "node:path";

const extractedDir = process.argv[2] || "/private/tmp/hanyu-xlsx";
const outputDir = process.argv[3] || path.join(process.cwd(), "data/import");

function decodeXml(value) {
 return value
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'");
}

function attr(tag, name) {
 const match = tag.match(new RegExp(`${name}="([^"]*)"`));
 return match?.[1] || "";
}

function columnName(cellRef) {
 return cellRef.replace(/[0-9]/g, "");
}

function parseSharedStrings(xml) {
 const strings = [];
 const siRegex = /<si\b[\s\S]*?<\/si>/g;
 for (const si of xml.match(siRegex) || []) {
  const text = [...si.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
   .map((match) => decodeXml(match[1]))
   .join("");
  strings.push(text);
 }
 return strings;
}

function parseWorkbookSheets(workbookXml, relsXml) {
 const rels = new Map();
 for (const match of relsXml.matchAll(/<Relationship\b[^>]*\/>/g)) {
  rels.set(attr(match[0], "Id"), attr(match[0], "Target"));
 }

 const sheets = [];
 for (const match of workbookXml.matchAll(/<sheet\b[^>]*\/>/g)) {
  const tag = match[0];
  const name = attr(tag, "name");
  const relId = attr(tag, "r:id");
  const target = rels.get(relId);
  if (name && target) {
   sheets.push({ name, file: path.join(extractedDir, "xl", target) });
  }
 }
 return sheets;
}

function parseCellValue(cellTag, sharedStrings) {
 const type = attr(cellTag, "t");
 const valueMatch = cellTag.match(/<v>([\s\S]*?)<\/v>/);
 if (valueMatch) {
  const raw = decodeXml(valueMatch[1]);
  if (type === "s") return sharedStrings[Number(raw)] || "";
  return raw.replace(/\.0$/, "");
 }

 const inlineMatch = cellTag.match(/<is\b[\s\S]*?<t\b[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/);
 return inlineMatch ? decodeXml(inlineMatch[1]) : "";
}

function parseWorksheet(xml, sharedStrings) {
 const rows = [];
 for (const rowMatch of xml.matchAll(/<row\b[^>]*>[\s\S]*?<\/row>/g)) {
  const row = {};
  for (const cellMatch of rowMatch[0].matchAll(
   /<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g,
  )) {
   const cellTag = cellMatch[0];
   const ref = attr(cellTag, "r");
   if (!ref) continue;
   row[columnName(ref)] = parseCellValue(cellTag, sharedStrings).trim();
  }
  rows.push(row);
 }
 return rows;
}

function lessonNumberFromSheetName(sheetName) {
 const match = sheetName.match(/^L(\d+)$/);
 return match ? Number(match[1]) : null;
}

function normalizeOrdinal(value) {
 const normalized = String(value || "").trim().replace(/\.0$/, "");
 return /^\d+$/.test(normalized) ? normalized : "";
}

const sharedStringsXml = fs.readFileSync(
 path.join(extractedDir, "xl/sharedStrings.xml"),
 "utf8",
);
const workbookXml = fs.readFileSync(path.join(extractedDir, "xl/workbook.xml"), "utf8");
const relsXml = fs.readFileSync(
 path.join(extractedDir, "xl/_rels/workbook.xml.rels"),
 "utf8",
);

const sharedStrings = parseSharedStrings(sharedStringsXml);
const sheets = parseWorkbookSheets(workbookXml, relsXml).filter((sheet) =>
 /^L\d+$/.test(sheet.name),
);

const items = [];
const lessons = [];

for (const sheet of sheets) {
 const lessonNumber = lessonNumberFromSheetName(sheet.name);
 const rows = parseWorksheet(fs.readFileSync(sheet.file, "utf8"), sharedStrings);
 const title = rows[0]?.A || rows[0]?.B || sheet.name;
 let currentCategory = "";
 let count = 0;

 for (const row of rows) {
  if (!row.A && row.B?.startsWith("—")) {
   currentCategory = row.B.replace(/^—\s*/, "").replace(/\s*—$/, "");
   continue;
  }

  const rowNumber = normalizeOrdinal(row.A);
  if (!rowNumber || !row.B || !row.F) continue;

  count += 1;
  items.push({
   hanzi: row.B,
   pinyin: row.C || "",
   sino_vietnamese: row.E || "",
   meaning_summary: row.F || "",
   definitions: [
    {
     pos: row.D || undefined,
     meaning: row.F || "",
    },
   ],
   notes: row.H || undefined,
   examples: row.G
    ? [
       {
        zh: row.G,
        pinyin: "",
        vi: "",
       },
      ]
    : undefined,
   source: {
    sheet: sheet.name,
    lesson_number: lessonNumber,
    lesson_title: title,
    row_number: Number(rowNumber),
    category: currentCategory || undefined,
   },
  });
 }

 lessons.push({
  sheet: sheet.name,
  lesson_number: lessonNumber,
  lesson_title: title,
  item_count: count,
 });
}

const uniqueByHanzi = new Map();
for (const item of items) {
 if (!uniqueByHanzi.has(item.hanzi)) uniqueByHanzi.set(item.hanzi, item);
}

const staging = {
 source_file: "Hanyu_2-1_vocab_format_theo_mau_12_bai_v2.xlsx",
 generated_at: new Date().toISOString(),
 lessons,
 total_items: items.length,
 unique_items: uniqueByHanzi.size,
 items,
};

const importPayload = {
 items: [...uniqueByHanzi.values()].map((item) => ({
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  sino_vietnamese: item.sino_vietnamese,
  meaning_summary: item.meaning_summary,
  definitions: item.definitions,
  notes: [
   item.notes,
   `Source: ${item.source.sheet} #${item.source.row_number}${
    item.source.category ? `, ${item.source.category}` : ""
   }`,
  ]
   .filter(Boolean)
   .join("\n"),
 })),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
 path.join(outputDir, "hanyu-2-1-vocab-staging.json"),
 `${JSON.stringify(staging, null, 2)}\n`,
);
fs.writeFileSync(
 path.join(outputDir, "hanyu-2-1-vocab-import-payload.json"),
 `${JSON.stringify(importPayload, null, 2)}\n`,
);

const chunkDir = path.join(outputDir, "hanyu-2-1-vocab-import-chunks");
fs.mkdirSync(chunkDir, { recursive: true });
const chunks = [];
for (let index = 0; index < importPayload.items.length; index += 100) {
 const chunkNumber = chunks.length + 1;
 const chunkPath = path.join(
  chunkDir,
  `chunk-${String(chunkNumber).padStart(2, "0")}.json`,
 );
 const chunkPayload = { items: importPayload.items.slice(index, index + 100) };
 fs.writeFileSync(chunkPath, `${JSON.stringify(chunkPayload, null, 2)}\n`);
 chunks.push({
  chunk: chunkNumber,
  path: chunkPath,
  item_count: chunkPayload.items.length,
 });
}

console.log(
 JSON.stringify(
  {
   lessons,
   total_items: items.length,
   unique_items: uniqueByHanzi.size,
   staging_path: path.join(outputDir, "hanyu-2-1-vocab-staging.json"),
   import_payload_path: path.join(
    outputDir,
    "hanyu-2-1-vocab-import-payload.json",
   ),
   chunks,
  },
  null,
  2,
 ),
);
