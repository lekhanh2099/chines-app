import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set(["node_modules", ".next", "coverage"]);
const UI_BOUNDARY = `${path.sep}src${path.sep}components${path.sep}ui${path.sep}`;
const UI_INTRINSIC_CONTROL_TAGS = new Set(["button", "input", "textarea", "select"]);
const APPLICATION_TYPOGRAPHY_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p"]);
const INLINE_TEXT_TAGS = new Set(["span", "strong", "em", "label", "code"]);
const TYPOGRAPHY_COMPONENTS = new Set([
 "Typography",
 "StudyInstructionText",
 "AdaptiveStudyText",
 "HanziText",
 "HanziFontPreview",
 "ReaderHanziText",
 "PinyinText",
 "TranslationText",
 "LearnerHanziText",
 "Label",
]);
const VISUAL_PRIMITIVE_COMPONENTS = new Set([
 "Button",
 "Input",
 "Textarea",
 "Checkbox",
 "Switch",
 "OptionSelect",
 "RadioGroup",
]);
const DIRECT_PRIMITIVE_IMPORT_PATTERN = /^(?:@base-ui\/react(?:\/.*)?|radix-ui|@radix-ui\/.*)$/;
const LEGACY_SELECT_IMPORT = "@/components/ui/select/index";
const TYPOGRAPHY_CLASS_PATTERN =
 /(?:^|\s)(?:text-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\]|text-|accent|primary|success|warning|danger|destructive|info|purple|burnt)|font-(?:normal|medium|semibold|bold|black|mono|hanzi|pinyin)|leading-|tracking-|uppercase|italic|capitalize|line-clamp-|truncate|whitespace-pre-|break-(?:words|all))/;
const PRIMITIVE_VISUAL_CLASS_PATTERN =
 /\b(?:text-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\]|text-|accent|primary|success|warning|danger|destructive|info|purple|burnt)|font-(?:normal|medium|semibold|bold|black|mono|hanzi|pinyin)|leading-|tracking-|uppercase|italic|capitalize|rounded(?:-|")|border(?:-|")|bg-|shadow(?:-|")|ring-|outline-|accent-|p[trblxy]?-\S+)/;
const ARBITRARY_Z_INDEX_PATTERN = /\bz-\[[^\]]+\]/;
const FEATURE_VISUAL_ESCAPE_HATCH_PATTERN =
 /\b(?:bg|text|border|ring|outline|fill|stroke)-\[(?:#|rgb\(|hsl\(|oklch\(|color-mix\()|\b(?:bg|from|via|to)-\[[^\]]*(?:linear-gradient|radial-gradient|conic-gradient)\(/;

function listSourceFiles(directory) {
 if (!fs.existsSync(directory)) return [];

 return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (IGNORED_DIRECTORIES.has(entry.name)) return [];
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listSourceFiles(entryPath);
  return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
 });
}

function relative(file) {
 return path.relative(ROOT, file).split(path.sep).join("/");
}

function location(sourceFile, node) {
 const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
 return `${relative(sourceFile.fileName)}:${line + 1}:${character + 1}`;
}

function classNameAttribute(node) {
 return node.attributes.properties.find(
  (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === "className",
 );
}

export function inspectUiSource({ file, source, isUiOwner = file.includes(UI_BOUNDARY) }) {
 const failures = [];
 const sourceFile = ts.createSourceFile(
  file,
  source,
  ts.ScriptTarget.Latest,
  true,
  file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
 );

 const visit = (node) => {
  if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
   const moduleName = node.moduleSpecifier.text;
   if (!isUiOwner && DIRECT_PRIMITIVE_IMPORT_PATTERN.test(moduleName)) {
    failures.push(`directPrimitiveImport: ${location(sourceFile, node)} imports ${moduleName}`);
   }
   if (moduleName === LEGACY_SELECT_IMPORT) {
    failures.push(`legacySelectImport: ${location(sourceFile, node)}`);
   }
  }

  if (
   !isUiOwner &&
   ts.isPropertyAssignment(node) &&
   ((ts.isIdentifier(node.name) && node.name.text === "zIndex") ||
    (ts.isStringLiteral(node.name) && node.name.text === "zIndex"))
  ) {
   failures.push(`featureOwnedZIndex: ${location(sourceFile, node)}`);
  }

  if (
   !isUiOwner &&
   (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
   ts.isIdentifier(node.tagName)
  ) {
   const tagName = node.tagName.text;
   if (UI_INTRINSIC_CONTROL_TAGS.has(tagName)) {
    failures.push(`rawInteractiveControl: ${location(sourceFile, node)} uses <${tagName}>`);
   }
   if (APPLICATION_TYPOGRAPHY_TAGS.has(tagName)) {
    failures.push(`rawApplicationTypography: ${location(sourceFile, node)} uses <${tagName}>`);
   }

   const className = classNameAttribute(node);
   if (className) {
    const classNameSource = className.getText(sourceFile);
    if (ARBITRARY_Z_INDEX_PATTERN.test(classNameSource)) {
     failures.push(`featureOwnedZIndex: ${location(sourceFile, className)}`);
    }
    if (FEATURE_VISUAL_ESCAPE_HATCH_PATTERN.test(classNameSource)) {
     failures.push(`featureVisualEscapeHatch: ${location(sourceFile, className)}`);
    }
    if (INLINE_TEXT_TAGS.has(tagName) && TYPOGRAPHY_CLASS_PATTERN.test(classNameSource)) {
     failures.push(`styledIntrinsicText: ${location(sourceFile, className)} uses <${tagName}>`);
    }
    if (TYPOGRAPHY_COMPONENTS.has(tagName) && TYPOGRAPHY_CLASS_PATTERN.test(classNameSource)) {
     failures.push(
      `typographyClassName: ${location(sourceFile, className)} uses typed style tokens`,
     );
    }
    if (
     VISUAL_PRIMITIVE_COMPONENTS.has(tagName) &&
     PRIMITIVE_VISUAL_CLASS_PATTERN.test(classNameSource)
    ) {
     failures.push(
      `primitiveClassName: ${location(sourceFile, className)} uses owned visual tokens`,
     );
    }
   }
  }

  ts.forEachChild(node, visit);
 };

 visit(sourceFile);
 return failures;
}

export function runUiCheck() {
 const failures = [];

 for (const file of listSourceFiles(SRC)) {
  const source = fs.readFileSync(file, "utf8");
  failures.push(...inspectUiSource({ file, source }));
 }

 if (failures.length > 0) {
  console.error("UI-system violations detected:");
  console.error(failures.map((entry) => `- ${entry}`).join("\n"));
  process.exitCode = 1;
 } else {
  console.info("UI-system check passed with no baseline.");
 }
}

const isMainModule =
 process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
 runUiCheck();
}
