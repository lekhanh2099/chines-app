import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

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
  throw new Error(`${relativePath}: missing remediation marker: ${label}`);
 }
 write(relativePath, source.replace(search, replacement));
}

function listTsxFiles(directory) {
 if (!fs.existsSync(directory)) return [];
 return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listTsxFiles(entryPath);
  if (!entry.name.endsWith(".tsx") || /\.(?:test|spec)\.tsx$/u.test(entry.name)) return [];
  return [entryPath];
 });
}

function replaceJsxMainWithDiv(relativePath) {
 const source = read(relativePath);
 if (!source.includes("main")) return;
 const sourceFile = ts.createSourceFile(
  relativePath,
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
 );
 const replacements = [];
 const visit = (node) => {
  if (
   (ts.isJsxOpeningElement(node) ||
    ts.isJsxClosingElement(node) ||
    ts.isJsxSelfClosingElement(node)) &&
   node.tagName.getText(sourceFile) === "main"
  ) {
   replacements.push({
    start: node.tagName.getStart(sourceFile),
    end: node.tagName.getEnd(),
   });
  }
  ts.forEachChild(node, visit);
 };
 visit(sourceFile);
 if (replacements.length === 0) return;
 let next = source;
 for (const replacement of replacements.toSorted((left, right) => right.start - left.start)) {
  next = `${next.slice(0, replacement.start)}div${next.slice(replacement.end)}`;
 }
 write(relativePath, next);
}

function remediateNestedMainLandmarks() {
 const roots = [
  "src/app/(app)",
  "src/features/hanzihome",
  "src/features/notebook",
 ];
 for (const root of roots) {
  for (const file of listTsxFiles(absolute(root))) {
   replaceJsxMainWithDiv(path.relative(ROOT, file));
  }
 }
}

function remediateDictationSourceChoices() {
 const file = "src/features/hanzihome/practice/StudioDictationWorkspace.tsx";
 replaceRequired(
  file,
  '       aria-label="Nguồn nghe chép"\n',
  '       density="touch"\n       layout="wrap"\n       aria-label="Nguồn nghe chép"\n',
  "wrapped finite source choices",
 );
}

function remediateTtsSegmentTargets() {
 const file = "src/features/hanzihome/tts/TtsStudioWorkspace.tsx";
 const source = read(file);
 const sectionStart = source.indexOf('aria-label="Chọn câu nghe thử"');
 if (sectionStart < 0) throw new Error(`${file}: missing segment selector section`);
 const buttonStart = source.indexOf("<Button", sectionStart);
 const sizeStart = source.indexOf('size="sm"', buttonStart);
 if (buttonStart < 0 || sizeStart < 0) throw new Error(`${file}: missing segment selector button`);
 const next = `${source.slice(0, sizeStart)}size="icon"\n            aria-label={\`Chọn mục nghe thử \${index + 1}\`}${source.slice(sizeStart + 'size="sm"'.length)}`;
 write(file, next);
}

function remediateHtmlArtifactTabs() {
 const file = "src/features/hanzihome/html-artifacts/HanziHomeHtmlArtifactsPage.tsx";
 let source = read(file);

 const buttonImport = 'import { Button } from "@/components/ui/button";\n';
 if (!source.includes('from "@/components/ui/segmented-control"')) {
  source = source.replace(
   buttonImport,
   `${buttonImport}import {\n SegmentedControl,\n type SegmentedControlItem,\n} from "@/components/ui/segmented-control";\n`,
  );
 }

 const mobileStart = source.indexOf("function MobilePaneTabs({");
 const mobileEnd = source.indexOf("function RightInspectorPane({", mobileStart);
 if (mobileStart < 0 || mobileEnd < 0) throw new Error(`${file}: missing MobilePaneTabs block`);
 const mobileReplacement = `function MobilePaneTabs({\n activePane,\n onChange,\n}: {\n activePane: MobilePane;\n onChange: (pane: MobilePane) => void;\n}) {\n const panes: SegmentedControlItem<MobilePane>[] = [\n  { key: "files", label: "Tệp", icon: Folder },\n  { key: "preview", label: "Xem trước", icon: Code2 },\n  { key: "edit", label: "Sửa", icon: FileCode2 },\n ];\n return (\n  <div className="shrink-0 border-b border-border-default bg-bg-card p-2">\n   <SegmentedControl\n    value={activePane}\n    items={panes}\n    onChange={onChange}\n    density="touch"\n    layout="wrap"\n    aria-label="Chọn vùng tệp HTML"\n   />\n  </div>\n );\n}\n\n`;
 source = `${source.slice(0, mobileStart)}${mobileReplacement}${source.slice(mobileEnd)}`;

 const inspectorStartMarker = `    <div\n     role="tablist"\n     aria-label="HTML inspector"\n     className="grid w-full grid-cols-2 gap-1 rounded-xl bg-bg-subtle p-1"\n    >`;
 const inspectorStart = source.indexOf(inspectorStartMarker);
 const inspectorEndMarker = `    </div>\n   </div>\n   <div className="min-h-0 flex-1 overflow-hidden bg-bg-subtle">`;
 const inspectorEnd = source.indexOf(inspectorEndMarker, inspectorStart);
 if (inspectorStart < 0 || inspectorEnd < 0) throw new Error(`${file}: missing inspector command header`);
 const inspectorReplacement = `    <div className="grid w-full grid-cols-2 gap-1">\n     <Button\n      type="button"\n      variant={activeTab === "files" ? "active" : "ghost"}\n      size="toolbar"\n      className="min-w-0"\n      aria-pressed={activeTab === "files"}\n      onClick={() => onTabChange("files")}\n     >\n      <Folder data-icon="inline-start" />\n      <StudyInstructionText as="span" clamp="one">\n       Tệp\n      </StudyInstructionText>\n      <StudyInstructionText tone="muted" variant="caption" scale="relativeSmall">\n       {filteredArtifacts.length}\n      </StudyInstructionText>\n     </Button>\n     <Button\n      type="button"\n      variant="ghost"\n      size="toolbar"\n      className="min-w-0"\n      onClick={onOpenPublishDialog}\n     >\n      <PlugZap data-icon="inline-start" />\n      <StudyInstructionText as="span" clamp="one">\n       Kết nối\n      </StudyInstructionText>\n     </Button>\n`;
 source = `${source.slice(0, inspectorStart)}${inspectorReplacement}${source.slice(inspectorEnd)}`;

 const helperStart = source.indexOf("function InspectorTabButton({");
 const helperEnd = source.indexOf("function useHtmlArtifactsDesktopShell()", helperStart);
 if (helperStart >= 0 && helperEnd >= 0) {
  source = `${source.slice(0, helperStart)}${source.slice(helperEnd)}`;
 }

 source = source.replaceAll("border-l-2", "border-l");
 write(file, source);
}

function hardenUiGuard() {
 const file = "scripts/check-ui-standards.mjs";
 let source = read(file);
 source = source.replace(
  'const THICK_BORDER_CLASS_PATTERN = /\\bborder-[2-9]\\b/;',
  'const THICK_BORDER_CLASS_PATTERN = /\\bborder(?:-[trblxy])?-[2-9]\\b/;',
 );
 const migratedConstant = `const MIGRATED_WORKSPACE_DIRECTORIES = [\n "src/features/hanzihome/reader/",\n "src/features/hanzihome/practice/",\n "src/features/hanzihome/tts/",\n "src/features/hanzihome/humanities/",\n];\n`;
 source = source.replace(migratedConstant, "");
 const canonicalFunctionStart = source.indexOf("function requiresCanonicalTabs(file) {");
 const canonicalFunctionEnd = source.indexOf("\n}\n\nfunction jsxTagNameText", canonicalFunctionStart);
 if (canonicalFunctionStart < 0 || canonicalFunctionEnd < 0) {
  throw new Error(`${file}: missing requiresCanonicalTabs`);
 }
 source = `${source.slice(0, canonicalFunctionStart)}function requiresCanonicalTabs(file) {\n return !isTestFile(file);${source.slice(canonicalFunctionEnd)}`;

 const tagMarker = `   const tagName = jsxTagNameText(node.tagName);\n   const className = classNameAttribute(node);`;
 const tagReplacement = `   const tagName = jsxTagNameText(node.tagName);\n   const relativePath = relative(file);\n   const isNestedAppMain =\n    tagName === "main" &&\n    (relativePath.startsWith("src/app/(app)/") ||\n     relativePath.startsWith("src/features/hanzihome/") ||\n     relativePath.startsWith("src/features/notebook/"));\n   if (isNestedAppMain) {\n    failures.push(\n     \`nestedAppMain: \${location(sourceFile, node)} must defer the primary landmark to AppScrollViewport\`,\n    );\n   }\n   const className = classNameAttribute(node);`;
 if (!source.includes(tagMarker)) throw new Error(`${file}: missing JSX tag inspection marker`);
 source = source.replace(tagMarker, tagReplacement);
 write(file, source);
}

function hardenUiGuardTests() {
 const file = "scripts/check-ui-standards.test.mjs";
 let source = read(file);
 source = source.replace('className="border-2"', 'className="border-l-2"');
 const insertionMarker = ` it("allows parent-owned layout classes on canonical primitives", () => {`;
 if (!source.includes('rejects manual tab semantics outside migrated workspace folders')) {
  const tests = ` it("rejects manual tab semantics outside migrated workspace folders", () => {\n  expect(\n   inspectUiSource({\n    file: "src/features/hanzihome/html-artifacts/Example.tsx",\n    source: 'export function Example() { return <div role="tablist"><Button role="tab">File</Button></div>; }',\n   }),\n  ).toEqual([\n   expect.stringContaining("manualTabSemantics"),\n   expect.stringContaining("manualTabSemantics"),\n  ]);\n });\n\n it("rejects nested app main landmarks beneath AppScrollViewport", () => {\n  expect(\n   inspectUiSource({\n    file: "src/app/(app)/reader/page.tsx",\n    source: "export function Page() { return <main />; }",\n   }),\n  ).toEqual([expect.stringContaining("nestedAppMain")]);\n });\n\n`;
  if (!source.includes(insertionMarker)) throw new Error(`${file}: missing test insertion marker`);
  source = source.replace(insertionMarker, `${tests}${insertionMarker}`);
 }
 write(file, source);
}

remediateNestedMainLandmarks();
remediateDictationSourceChoices();
remediateTtsSegmentTargets();
remediateHtmlArtifactTabs();
hardenUiGuard();
hardenUiGuardTests();

console.log(`UI remediation changed ${changed.size} files:`);
for (const file of [...changed].toSorted()) console.log(`- ${file}`);
