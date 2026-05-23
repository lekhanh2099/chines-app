import type {
 GrammarViewModel,
 StaticGrammarData,
 VocabExample,
} from "@/features/hanzihome/types";

function cleanTitle(title: string) {
 return title.replace(/\\\./g, ".").replace(/^(\d+\.)\s*/, "").trim();
}

function splitLines(content: string) {
 return content
  .split("\n")
  .map((line) => line.replace(/^\*\s*/, "").trim())
  .filter(Boolean);
}

function parseGrammarExamples(lines: string[]): VocabExample[] {
 return lines
  .filter((line) => /[\u3400-\u9fff]/.test(line))
  .map((line) => {
   const match = line.match(/^(.+?)[（(](.+?)[）)]$/);
   return {
    zh: match?.[1]?.trim() || line,
    vi: match?.[2]?.trim() || "",
   };
  });
}

export function buildGrammarViewModel(point: StaticGrammarData): GrammarViewModel {
 const lines = splitLines(point.contentMd || "");
 const core = lines.find((line) => /^Công dụng:/i.test(line)) || lines[0] || "";
 const structuresView = point.structures?.length
  ? point.structures.map((item) => item.replace(/\\\+/g, "+"))
  : lines
     .filter((line) => /^Cấu trúc:/i.test(line))
     .map((line) => line.replace(/^Cấu trúc:\s*/i, ""));

 return {
  ...point,
  cleanTitle: cleanTitle(point.title),
  core: core.replace(/^Công dụng:\s*/i, ""),
  structuresView,
  examplesParsed: parseGrammarExamples(point.examplesRaw || lines),
  notes: lines.filter((line) => /lưu ý|chú ý|không|sai|bẫy/i.test(line)),
 };
}
