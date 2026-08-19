import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOTS = ["src", "scripts"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set(["node_modules", ".next", "coverage"]);
const NEXT_APP_ENTRYPOINT_NAMES = new Set([
 "apple-icon",
 "default",
 "error",
 "global-error",
 "icon",
 "layout",
 "loading",
 "manifest",
 "not-found",
 "opengraph-image",
 "page",
 "robots",
 "route",
 "sitemap",
 "template",
 "twitter-image",
]);
const NEXT_ROOT_ENTRYPOINT_NAMES = new Set([
 "instrumentation",
 "instrumentation-client",
 "middleware",
 "proxy",
]);
const FRAMEWORK_CONVENTION_ENTRYPOINTS = new Set(["src/i18n/request.ts"]);

const DEPRECATED_ZOD_PATTERNS = [
 { pattern: /z\.string\([^)]*\)[^;\n]*(?<!z)\.email\s*\(/, replacement: "z.email()" },
 { pattern: /z\.string\([^)]*\)[^;\n]*(?<!z)\.url\s*\(/, replacement: "z.url()" },
 { pattern: /z\.string\([^)]*\)[^;\n]*(?<!z)\.uuid\s*\(/, replacement: "z.uuid()" },
 {
  pattern: /z\.string\([^)]*\)[^;\n]*(?<!z)\.datetime\s*\(/,
  replacement: "z.iso.datetime()",
 },
 { pattern: /z\.string\([^)]*\)[^;\n]*(?<!z)\.date\s*\(/, replacement: "z.iso.date()" },
 { pattern: /z\.string\([^)]*\)[^;\n]*(?<!z)\.time\s*\(/, replacement: "z.iso.time()" },
 {
  pattern: /z\.string\([^)]*\)[^;\n]*(?<!z)\.duration\s*\(/,
  replacement: "z.iso.duration()",
 },
 { pattern: /z\.object\([^;\n]*\.passthrough\s*\(/, replacement: "z.looseObject() or .loose()" },
 { pattern: /\bz\.nativeEnum\s*\(/, replacement: "z.enum()" },
];

const CLIENT_SERVER_IMPORT_PATTERN =
 /(?:from\s+|import\s*\()["'](?:@\/lib\/supabase\/server|@\/[^"']*\/server(?:[./"'])|server-only)/;
const GENERATED_TYPE_FILES = new Set(["src/types/supabase.generated.ts"]);
const TYPE_ASSERTION_EXCEPTION_BUDGET = new Map();

function listSourceFiles(directory) {
 if (!fs.existsSync(directory)) return [];

 return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (IGNORED_DIRECTORIES.has(entry.name)) return [];
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listSourceFiles(entryPath);
  return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
 });
}

function normalizePath(file) {
 return path.relative(process.cwd(), path.resolve(file)).split(path.sep).join("/");
}

function normalizeNodeText(node, sourceFile) {
 return node.getText(sourceFile).replace(/\s+/g, " ");
}

function typeAssertionKey(file, node, sourceFile) {
 const kind = ts.isAsExpression(node) ? "as" : "angle";
 return `${file}::${kind}::${normalizeNodeText(node.expression, sourceFile)}::${normalizeNodeText(node.type, sourceFile)}`;
}

export function inspectUnsafeTypeConstructs({
 sources,
 assertionExceptionBudget = TYPE_ASSERTION_EXCEPTION_BUDGET,
 generatedTypeFiles = GENERATED_TYPE_FILES,
}) {
 const failures = [];
 const remainingAssertionBudget = new Map(
  [...assertionExceptionBudget].map(([key, exception]) => [key, { ...exception }]),
 );

 for (const { file, source } of sources) {
  if (generatedTypeFiles.has(file)) continue;

  const sourceFile = ts.createSourceFile(
   file,
   source,
   ts.ScriptTarget.Latest,
   true,
   file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const inspectTypeNode = (node) => {
   if (node.kind === ts.SyntaxKind.AnyKeyword) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    failures.push(`${file}:${line + 1}:${character + 1} uses an unsafe explicit any type`);
   }

   if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
    const key = typeAssertionKey(file, node, sourceFile);
    const exception = remainingAssertionBudget.get(key);
    if (exception?.count > 0 && exception.reason.trim().length > 0) {
     exception.count -= 1;
    } else {
     const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
     );
     failures.push(
      `${file}:${line + 1}:${character + 1} uses an unaudited type assertion: ${normalizeNodeText(node, sourceFile)}`,
     );
    }
   }

   if (ts.isNonNullExpression(node)) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    failures.push(`${file}:${line + 1}:${character + 1} uses a forbidden non-null assertion`);
   }

   ts.forEachChild(node, inspectTypeNode);
  };

  inspectTypeNode(sourceFile);

  source.split("\n").forEach((line, index) => {
   if (/\bz\.(?:any|unknown)\s*\(/.test(line)) {
    failures.push(
     `${file}:${index + 1} uses an unconstrained Zod schema; define the runtime contract`,
    );
   }
   if (/@ts-(?:ignore|expect-error)\b/.test(line)) {
    failures.push(`${file}:${index + 1} uses a forbidden TypeScript suppression`);
   }
   if (/eslint-(?:disable|disable-next-line|disable-line)[^\n]*@typescript-eslint/.test(line)) {
    failures.push(`${file}:${index + 1} uses a forbidden TypeScript ESLint suppression`);
   }
  });
 }

 for (const [key, exception] of remainingAssertionBudget) {
  if (exception.count > 0) {
   failures.push(
    `stale type-assertion exception (${exception.count} unused): ${key}; ${exception.reason}`,
   );
  }
 }

 return failures;
}

export function inspectArchitectureBoundaries({ sources }) {
 const failures = [];

 for (const { file, source } of sources) {
  if (file.startsWith("src/components/") && /from\s+["']@\/features\//.test(source)) {
   failures.push(`${file} imports feature implementation code from the shared component layer`);
  }

  if (
   file.startsWith("src/features/hanzihome/") &&
   file !== "src/features/hanzihome/query-keys.ts" &&
   /queryKey:\s*\[\s*["']hanzihome["']/.test(source)
  ) {
   failures.push(`${file} declares a HanziHome query key outside query-keys.ts`);
  }

  if (
   file === "src/features/hanzihome/context/hanzihomeFeatureStore.ts" &&
   source.includes("lessonTextDisplayMode")
  ) {
   failures.push(`${file} mirrors the learning-state lesson display preference`);
  }

  if (
   file === "src/features/hanzihome/reader/reader-state.schemas.ts" &&
   /\b(?:showPinyin|showMeaning|summaryText)\s*:/.test(source)
  ) {
   failures.push(`${file} persists display preferences in Reader progress`);
  }
 }

 return failures;
}

function isTestFile(file) {
 return /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(file);
}

function isDeclarationFile(file) {
 return file.endsWith(".d.ts");
}

function isNextEntrypoint(file) {
 const extension = path.extname(file);
 const baseName = path.basename(file, extension);

 if (file.startsWith("src/app/") && NEXT_APP_ENTRYPOINT_NAMES.has(baseName)) {
  return true;
 }

 return (
  path.dirname(file) === "src" &&
  NEXT_ROOT_ENTRYPOINT_NAMES.has(baseName) &&
  SOURCE_EXTENSIONS.has(extension)
 );
}

function isUiLibraryEntrypoint(file) {
 return file.startsWith("src/components/ui/") || file.startsWith("src/components/patterns/");
}

function isFrameworkConventionEntrypoint(file) {
 return FRAMEWORK_CONVENTION_ENTRYPOINTS.has(file);
}

function getPackageScriptEntrypoints(sourceFileSet) {
 const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
 const entrypoints = new Set();
 const scriptFilePattern = /(?:^|[\s"'=])(scripts\/[^\s"';&|]+?\.[cm]?[jt]sx?)/g;

 for (const command of Object.values(packageJson.scripts ?? {})) {
  for (const match of command.matchAll(scriptFilePattern)) {
   const file = normalizePath(match[1]);
   if (sourceFileSet.has(file)) entrypoints.add(file);
  }
 }

 return entrypoints;
}

function loadCompilerOptions() {
 const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
 if (configFile.error) {
  throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
 }

 const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd());
 if (parsed.errors.length > 0) {
  throw new Error(
   parsed.errors
    .map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"))
    .join("\n"),
  );
 }

 return parsed.options;
}

function collectModuleSpecifiers(sourceFile) {
 const specifiers = new Set();

 const visit = (node) => {
  if (
   (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
   node.moduleSpecifier &&
   ts.isStringLiteral(node.moduleSpecifier)
  ) {
   specifiers.add(node.moduleSpecifier.text);
  } else if (
   ts.isImportEqualsDeclaration(node) &&
   ts.isExternalModuleReference(node.moduleReference) &&
   node.moduleReference.expression &&
   ts.isStringLiteral(node.moduleReference.expression)
  ) {
   specifiers.add(node.moduleReference.expression.text);
  } else if (
   ts.isCallExpression(node) &&
   (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
    (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
   node.arguments.length === 1 &&
   ts.isStringLiteral(node.arguments[0])
  ) {
   specifiers.add(node.arguments[0].text);
  } else if (
   ts.isImportTypeNode(node) &&
   ts.isLiteralTypeNode(node.argument) &&
   ts.isStringLiteral(node.argument.literal)
  ) {
   specifiers.add(node.argument.literal.text);
  }

  ts.forEachChild(node, visit);
 };

 visit(sourceFile);
 return specifiers;
}

function findUnreachableSourceFiles(files) {
 const sourceFileSet = new Set(files.map(normalizePath));
 const compilerOptions = loadCompilerOptions();
 const moduleResolutionCache = ts.createModuleResolutionCache(
  process.cwd(),
  (file) => file,
  compilerOptions,
 );
 const dependencies = new Map();

 for (const file of sourceFileSet) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
   file,
   source,
   ts.ScriptTarget.Latest,
   true,
   file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const resolvedDependencies = new Set();

  for (const specifier of collectModuleSpecifiers(sourceFile)) {
   const resolution = ts.resolveModuleName(
    specifier,
    path.resolve(file),
    compilerOptions,
    ts.sys,
    moduleResolutionCache,
   ).resolvedModule;

   if (!resolution) continue;

   const resolvedFile = normalizePath(resolution.resolvedFileName);
   if (sourceFileSet.has(resolvedFile)) resolvedDependencies.add(resolvedFile);
  }

  dependencies.set(file, resolvedDependencies);
 }

 const entrypoints = new Set(
  [...sourceFileSet].filter(
   (file) =>
    isNextEntrypoint(file) ||
    isFrameworkConventionEntrypoint(file) ||
    isUiLibraryEntrypoint(file) ||
    isTestFile(file) ||
    isDeclarationFile(file),
  ),
 );
 for (const file of getPackageScriptEntrypoints(sourceFileSet)) entrypoints.add(file);

 const reachable = new Set();
 const pending = [...entrypoints];

 while (pending.length > 0) {
  const file = pending.pop();
  if (reachable.has(file)) continue;
  reachable.add(file);

  for (const dependency of dependencies.get(file) ?? []) {
   if (!reachable.has(dependency)) pending.push(dependency);
  }
 }

 return [...sourceFileSet].filter((file) => !reachable.has(file)).sort();
}

export function runSourceCheck() {
 const failures = [];
 const sourceFiles = ROOTS.flatMap(listSourceFiles);
 const sources = sourceFiles.map((file) => ({ file, source: fs.readFileSync(file, "utf8") }));

 for (const { file, source } of sources) {
  const lines = source.split("\n");

  for (const { pattern, replacement } of DEPRECATED_ZOD_PATTERNS) {
   lines.forEach((line, index) => {
    if (pattern.test(line)) {
     failures.push(`${file}:${index + 1} uses a deprecated Zod API; prefer ${replacement}`);
    }
   });
  }

  const isClientModule = /^\s*["']use client["'];/m.test(source);
  if (isClientModule && CLIENT_SERVER_IMPORT_PATTERN.test(source)) {
   failures.push(`${file} is a Client Component importing a server-only module`);
  }
 }

 failures.push(...inspectUnsafeTypeConstructs({ sources }));
 failures.push(...inspectArchitectureBoundaries({ sources }));

 for (const file of findUnreachableSourceFiles(sourceFiles)) {
  failures.push(
   `${file} is not reachable from a framework, UI-library, test, declaration, or package-script entrypoint`,
  );
 }

 if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
 } else {
  console.info("Source architecture, type-safety, and module-reachability checks passed.");
 }
}

const isMainModule =
 process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) runSourceCheck();
