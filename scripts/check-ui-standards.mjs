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
 "ActionCard",
 "Button",
 "Input",
 "Textarea",
 "Checkbox",
 "Switch",
 "OptionSelect",
 "RadioGroup",
 "Card",
 "Badge",
 "Chip",
 "SelectTrigger",
 "PageHeader",
 "SegmentedControl",
 "IconTile",
 "DialogContent",
 "DropdownMenuContent",
 "DropdownMenuSubContent",
 "BasePopoverPopup",
 "Popover.Popup",
 "Popover.Trigger",
]);
const DIRECT_PRIMITIVE_IMPORT_PATTERN = /^(?:@base-ui\/react(?:\/.*)?|radix-ui|@radix-ui\/.*)$/;
const LEGACY_SELECT_IMPORT = "@/components/ui/select/index";
const TYPOGRAPHY_CLASS_PATTERN =
 /(?:^|\s)(?:text-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\]|text-|accent|primary|success|warning|danger|destructive|info|purple|burnt)|font-(?:normal|medium|semibold|bold|black|mono|hanzi|pinyin)|leading-|tracking-|uppercase|italic|capitalize|line-clamp-|truncate|whitespace-pre-|break-(?:words|all))/;
const PRIMITIVE_VISUAL_CLASS_PATTERN =
 /\b(?:text-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\]|text-|accent|primary|success|warning|danger|destructive|info|purple|burnt)|font-(?:normal|medium|semibold|bold|black|mono|hanzi|pinyin)|leading-|tracking-|uppercase|italic|capitalize|rounded(?:-|\b)|border(?:-|\b)|bg-|shadow(?:-|\b)|ring-|outline-|accent-|p[trblxy]?-\S+)/;
const COMPONENT_ANATOMY_OVERRIDE_PATTERN = /\[(?:&|data-|aria-)[^\]]*\][^\s]*:/;
const ARBITRARY_Z_INDEX_PATTERN = /\bz-\[[^\]]+\]/;
const FEATURE_VISUAL_ESCAPE_HATCH_PATTERN =
 /\b(?:bg|text|border|ring|outline|fill|stroke)-\[(?:#|rgb\(|hsl\(|oklch\(|color-mix\()|\b(?:bg|from|via|to)-\[[^\]]*(?:linear-gradient|radial-gradient|conic-gradient)\(/;
const FEATURE_SURFACE_ESCAPE_HATCH_PATTERN =
 /\b(?:app-glass-surface|app-gradient-hero|backdrop-blur(?:-[\w-]+)?|shadow-theme-lg)\b/;
const SOURCE_INTRINSIC_FIT_PATTERN = /\b(?:w-fit|h-fit|min-w-fit|max-w-fit|min-h-fit|max-h-fit)\b/;
const SOURCE_PIXEL_FONT_PATTERN = /\btext-\[[0-9.]+px\]/;
const SOURCE_RAW_PALETTE_PATTERN =
 /\b(?:bg|text|border|ring|outline|fill|stroke)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|fuchsia|pink|rose)(?:-|\b)/;
const SOURCE_DECORATIVE_GRADIENT_PATTERN = /\b(?:bg-gradient|bg-linear|bg-radial|bg-conic)(?:-|\b)/;
const FIXED_MARGIN_CLASS_PATTERN =
 /(?:^|[\s"'`])(?:[a-z0-9-]+:)*-?m(?:[trblxy])?-(?!auto(?:[\s"'`}]|$)|0(?:[\s"'`}]|$))[^\s"'`}]*/i;
const INLINE_HORIZONTAL_MARGIN_PATTERN = /(?:^|\s)(?:[a-z0-9-]+:)*mx-[^\s"'`}]*/i;
const INLINE_LAYOUT_PATTERN = /\binline(?:-flex|-block)?\b/;
const SPACE_BETWEEN_CLASS_PATTERN = /\b(?:[a-z0-9-]+:)*space-[xy]-(?!0(?:[\s"'`}]|$))[^\s"'`}]*/i;
const ARBITRARY_RADIUS_PATTERN = /\brounded-\[[^\]]+\]/;
const FEATURE_LARGE_RADIUS_PATTERN = /\brounded-(?:2xl|3xl)\b/;
const FEATURE_RING_CLASS_PATTERN = /\b(?:[a-z0-9-]+:)*(?:ring|ring-offset)-[^\s"'`}]*/i;
const THICK_BORDER_CLASS_PATTERN = /\bborder-[2-9]\b/;
const PAGE_ROOT_MAX_WIDTH_PATTERN = /\bmax-w-(?:\[[^\]]+\]|[^\s"'`}]*)/;
const MIGRATED_WORKSPACE_DIRECTORIES = [
 "src/features/hanzihome/reader/",
 "src/features/hanzihome/practice/",
 "src/features/hanzihome/tts/",
 "src/features/hanzihome/humanities/",
];

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

function isTestFile(file) {
 return /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(file);
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

function stringAttributeValue(node, name) {
 const attribute = node.attributes.properties.find(
  (candidate) =>
   ts.isJsxAttribute(candidate) &&
   candidate.name.text === name &&
   candidate.initializer !== undefined &&
   ts.isStringLiteral(candidate.initializer),
 );
 return attribute?.initializer.text;
}

function requiresCanonicalTabs(file) {
 const relativePath = relative(file);
 return MIGRATED_WORKSPACE_DIRECTORIES.some((directory) => relativePath.startsWith(directory));
}

function jsxTagNameText(tagName) {
 if (ts.isIdentifier(tagName)) return tagName.text;
 if (ts.isPropertyAccessExpression(tagName)) {
  const owner = jsxTagNameText(tagName.expression);
  return owner ? `${owner}.${tagName.name.text}` : tagName.name.text;
 }
 return "";
}

function isDirectPageContainerChild(node) {
 const renderedNode = ts.isJsxOpeningElement(node) ? node.parent : node;
 const parent = renderedNode.parent;
 return (
  ts.isJsxElement(parent) && jsxTagNameText(parent.openingElement.tagName) === "PageContainer"
 );
}

export function inspectUiSource({ file, source, isUiOwner = file.includes(UI_BOUNDARY) }) {
 if (isTestFile(file)) return [];

 const failures = [];
 const sourceFile = ts.createSourceFile(
  file,
  source,
  ts.ScriptTarget.Latest,
  true,
  file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
 );

 const inspectSpacing = (className) => {
  const classNameSource = className.getText(sourceFile);
  const fixedMarginMatch = classNameSource.match(FIXED_MARGIN_CLASS_PATTERN)?.[0] ?? "";
  const inlineHorizontalSpacing =
   INLINE_LAYOUT_PATTERN.test(classNameSource) &&
   INLINE_HORIZONTAL_MARGIN_PATTERN.test(fixedMarginMatch.trimStart());

  if (fixedMarginMatch && !inlineHorizontalSpacing) {
   failures.push(
    `fixedMarginSpacing: ${location(sourceFile, className)} uses child margin; compose spacing with parent gap/padding`,
   );
  }
  if (SPACE_BETWEEN_CLASS_PATTERN.test(classNameSource)) {
   failures.push(
    `spaceBetweenSpacing: ${location(sourceFile, className)} uses space-x/space-y; compose spacing with parent gap`,
   );
  }
 };

 const inspectClassName = (className, tagName) => {
  const classNameSource = className.getText(sourceFile);
  if (ARBITRARY_Z_INDEX_PATTERN.test(classNameSource)) {
   failures.push(`featureOwnedZIndex: ${location(sourceFile, className)}`);
  }
  if (FEATURE_VISUAL_ESCAPE_HATCH_PATTERN.test(classNameSource)) {
   failures.push(`featureVisualEscapeHatch: ${location(sourceFile, className)}`);
  }
  if (FEATURE_SURFACE_ESCAPE_HATCH_PATTERN.test(classNameSource)) {
   failures.push(`featureSurfaceEscapeHatch: ${location(sourceFile, className)}`);
  }
  if (SOURCE_INTRINSIC_FIT_PATTERN.test(classNameSource)) {
   failures.push(`sourceFitLayoutPatch: ${location(sourceFile, className)}`);
  }
  if (SOURCE_PIXEL_FONT_PATTERN.test(classNameSource)) {
   failures.push(`sourcePixelFontSize: ${location(sourceFile, className)}`);
  }
  if (SOURCE_RAW_PALETTE_PATTERN.test(classNameSource)) {
   failures.push(`sourceRawPaletteUtility: ${location(sourceFile, className)}`);
  }
  if (SOURCE_DECORATIVE_GRADIENT_PATTERN.test(classNameSource)) {
   failures.push(`sourceDecorativeGradient: ${location(sourceFile, className)}`);
  }
  if (ARBITRARY_RADIUS_PATTERN.test(classNameSource)) {
   failures.push(`featureArbitraryRadius: ${location(sourceFile, className)}`);
  }
  if (FEATURE_LARGE_RADIUS_PATTERN.test(classNameSource)) {
   failures.push(
    `featureLargeRadius: ${location(sourceFile, className)} uses 2xl/3xl radius outside a visual owner`,
   );
  }
  if (FEATURE_RING_CLASS_PATTERN.test(classNameSource)) {
   failures.push(`featureOwnedRing: ${location(sourceFile, className)}`);
  }
  if (THICK_BORDER_CLASS_PATTERN.test(classNameSource)) {
   failures.push(`featureThickBorder: ${location(sourceFile, className)}`);
  }
  if (TYPOGRAPHY_COMPONENTS.has(tagName) && TYPOGRAPHY_CLASS_PATTERN.test(classNameSource)) {
   failures.push(`typographyClassName: ${location(sourceFile, className)} uses typed style tokens`);
  }
  if (
   VISUAL_PRIMITIVE_COMPONENTS.has(tagName) &&
   PRIMITIVE_VISUAL_CLASS_PATTERN.test(classNameSource)
  ) {
   failures.push(`primitiveClassName: ${location(sourceFile, className)} uses owned visual tokens`);
  }
  if (
   VISUAL_PRIMITIVE_COMPONENTS.has(tagName) &&
   COMPONENT_ANATOMY_OVERRIDE_PATTERN.test(classNameSource)
  ) {
   failures.push(`componentAnatomyOverride: ${location(sourceFile, className)}`);
  }
 };

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

  if (!isUiOwner && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
   const owner = node.expression.expression;
   const method = node.expression.name.text;
   if (method === "scrollIntoView") {
    failures.push(
     `nativeRouteScroll: ${location(sourceFile, node)} uses scrollIntoView; use shared app-scroll helpers`,
    );
   }
   if (ts.isIdentifier(owner) && owner.text === "window" && method === "scrollTo") {
    failures.push(
     `windowRouteScroll: ${location(sourceFile, node)} uses window.scrollTo; use AppScrollViewport helpers`,
    );
   }
   if (
    ts.isPropertyAccessExpression(owner) &&
    ts.isIdentifier(owner.expression) &&
    owner.expression.text === "document" &&
    owner.name.text === "documentElement" &&
    method.startsWith("scroll")
   ) {
    failures.push(
     `documentRouteScroll: ${location(sourceFile, node)} scrolls documentElement; use AppScrollViewport helpers`,
    );
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

  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
   const tagName = jsxTagNameText(node.tagName);
   const className = classNameAttribute(node);
   if (className) {
    inspectSpacing(className);
    if (
     isDirectPageContainerChild(node) &&
     PAGE_ROOT_MAX_WIDTH_PATTERN.test(className.getText(sourceFile))
    ) {
     failures.push(
      `pageRootMaxWidth: ${location(sourceFile, className)} constrains the fluid PageContainer root; constrain an inner content measure instead`,
     );
    }
   }

   if (!isUiOwner) {
    const role = stringAttributeValue(node, "role");
    if (requiresCanonicalTabs(file) && (role === "tab" || role === "tablist")) {
     failures.push(`manualTabSemantics: ${location(sourceFile, node)} must use Tabs`);
    }
    if (UI_INTRINSIC_CONTROL_TAGS.has(tagName)) {
     failures.push(`rawInteractiveControl: ${location(sourceFile, node)} uses <${tagName}>`);
    }
    if (APPLICATION_TYPOGRAPHY_TAGS.has(tagName)) {
     failures.push(`rawApplicationTypography: ${location(sourceFile, node)} uses <${tagName}>`);
    }
    if (className) inspectClassName(className, tagName);
   }
  }

  ts.forEachChild(node, visit);
 };

 visit(sourceFile);
 return failures;
}

export function runUiCheck() {
 const failures = [];

 const themeCssFiles = [
  "src/app/globals.css",
  "src/app/theme-palettes.css",
  "src/app/surface-system.css",
 ];
 const themePercentageColorPattern = /(?:color-mix\([^\n]*%|hsla?\([^\n]*%)/;
 const pixelFontDeclarationPattern = /font-size:\s*[0-9.]+px/;
 const decorativeCssGradientPattern = /(?:linear-gradient|radial-gradient|conic-gradient)\(/;
 for (const relativePath of themeCssFiles) {
  const absolutePath = path.join(ROOT, relativePath);
  const lines = fs.readFileSync(absolutePath, "utf8").split("\n");
  lines.forEach((line, index) => {
   if (themePercentageColorPattern.test(line)) {
    failures.push(`themePercentageColor: ${relativePath}:${index + 1}`);
   }
   if (pixelFontDeclarationPattern.test(line)) {
    failures.push(`sourcePixelFontDeclaration: ${relativePath}:${index + 1}`);
   }
   if (decorativeCssGradientPattern.test(line)) {
    failures.push(`sourceDecorativeCssGradient: ${relativePath}:${index + 1}`);
   }
  });
 }

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

if (isMainModule) runUiCheck();
