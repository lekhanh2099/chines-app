import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const changed = new Set();

function absolute(relativePath) {
 return path.join(ROOT, relativePath);
}

function read(relativePath) {
 return fs.readFileSync(absolute(relativePath), "utf8");
}

function write(relativePath, source) {
 const current = read(relativePath);
 if (current === source) return;
 fs.writeFileSync(absolute(relativePath), source);
 changed.add(relativePath);
}

function replaceRequired(relativePath, search, replacement, label) {
 const source = read(relativePath);
 if (!source.includes(search)) {
  throw new Error(`${relativePath}: missing follow-up marker: ${label}`);
 }
 write(relativePath, source.replace(search, replacement));
}

function fixDirectionalThickBorders() {
 replaceRequired(
  "src/features/dictionary/components/DictionaryWordSections.tsx",
  "border-l-2 border-accent/20",
  "border-l border-accent/20",
  "dictionary example border",
 );
 replaceRequired(
  "src/features/hanzihome/reader/ReaderDocumentStudy.tsx",
  "border-l-2 border-border-strong",
  "border-l border-border-strong",
  "reader pinyin border",
 );
}

function fixPreviewModeSemantics() {
 const file = "src/features/hanzihome/html-artifacts/HanziHomeHtmlArtifactsPage.tsx";
 let source = read(file);
 const startMarker = `     <div\n      role="tablist"\n      aria-label="Chọn chế độ xem HTML"\n      className="flex rounded-xl bg-bg-subtle p-1"\n     >`;
 const endMarker = `     </div>\n     <Button type="button" variant="outline" size="toolbar" onClick={onToggleFocus}>`;
 const start = source.indexOf(startMarker);
 const end = source.indexOf(endMarker, start);
 if (start < 0 || end < 0) throw new Error(`${file}: missing preview mode tablist`);
 const replacement = `     <SegmentedControl\n      value={mode}\n      items={[\n       { key: "iframe", label: "iframe", icon: Code2 },\n       { key: "editor", label: "Chỉnh HTML", icon: FileCode2 },\n      ]}\n      onChange={onModeChange}\n      aria-label="Chọn chế độ xem HTML"\n     />\n`;
 source = `${source.slice(0, start)}${replacement}${source.slice(end + "     </div>\n".length)}`;

 const helperStart = source.indexOf("function PreviewModeButton({");
 const helperEnd = source.indexOf("function getHtmlArtifactFrameKey", helperStart);
 if (helperStart < 0 || helperEnd < 0) throw new Error(`${file}: missing PreviewModeButton helper`);
 source = `${source.slice(0, helperStart)}${source.slice(helperEnd)}`;
 write(file, source);
}

fixDirectionalThickBorders();
fixPreviewModeSemantics();

console.log(`Follow-up UI remediation changed ${changed.size} files:`);
for (const file of [...changed].toSorted()) console.log(`- ${file}`);
