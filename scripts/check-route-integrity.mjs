import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const APP_ROOT = path.resolve("src/app");
const SOURCE_ROOT = path.resolve("src");
const PUBLIC_ROOT = path.resolve("public");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const ROUTE_ENTRY_PATTERN = /^(?:page|route)\.[cm]?[jt]sx?$/u;
const IGNORED_DIRECTORIES = new Set(["node_modules", ".next", "coverage"]);

function normalizePath(file) {
 return path.relative(process.cwd(), file).split(path.sep).join("/");
}

function listFiles(directory, predicate) {
 if (!fs.existsSync(directory)) return [];
 return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (IGNORED_DIRECTORIES.has(entry.name)) return [];
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listFiles(entryPath, predicate);
  return predicate(entryPath) ? [entryPath] : [];
 });
}

function stripRouteGroup(segment) {
 if (/^\([^.)][^)]*\)$/u.test(segment)) return "";
 if (/^@/u.test(segment)) return "";
 const intercepted = /^(?:\(\.\)|\(\.\.\)|\(\.\.\.\)|(?:\(\.\.\)){2})(.+)$/u.exec(segment);
 return intercepted?.[1] ?? segment;
}

export function routeFromAppEntrypoint(file) {
 const relative = path.relative(APP_ROOT, file).split(path.sep).join("/");
 const segments = relative.split("/").slice(0, -1).map(stripRouteGroup).filter(Boolean);
 return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function escapeRegex(value) {
 return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function routePatternToRegex(route) {
 if (route === "/") return /^\/?$/u;
 const segments = route.split("/").filter(Boolean);
 let pattern = "^";
 for (const segment of segments) {
  if (/^\[\[\.\.\..+\]\]$/u.test(segment)) {
   pattern += "(?:/.*)?";
  } else if (/^\[\.\.\..+\]$/u.test(segment)) {
   pattern += "/.+";
  } else if (/^\[[^/]+\]$/u.test(segment)) {
   pattern += "/[^/]+";
  } else {
   pattern += `/${escapeRegex(segment)}`;
  }
 }
 return new RegExp(`${pattern}/?$`, "u");
}

function parseNavigationValue(node) {
 if (ts.isStringLiteralLike(node)) return node.text;
 if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
 if (ts.isTemplateExpression(node)) {
  let value = node.head.text;
  for (const span of node.templateSpans) value += `__dynamic__${span.literal.text}`;
  return value;
 }
 if (ts.isObjectLiteralExpression(node)) {
  for (const property of node.properties) {
   if (!ts.isPropertyAssignment(property)) continue;
   const name = property.name;
   const key = ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : "";
   if (key === "pathname") return parseNavigationValue(property.initializer);
  }
 }
 return null;
}

function normalizeNavigationTarget(value) {
 if (!value.startsWith("/") || value.startsWith("//")) return null;
 const [withoutHash] = value.split("#", 1);
 const [pathname] = withoutHash.split("?", 1);
 if (pathname.length === 0) return "/";
 return pathname.replace(/\/{2,}/gu, "/");
}

function locationOf(sourceFile, node) {
 const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
 return `${normalizePath(sourceFile.fileName)}:${line + 1}:${character + 1}`;
}

function collectNavigationTargets(file) {
 const source = fs.readFileSync(file, "utf8");
 const sourceFile = ts.createSourceFile(
  file,
  source,
  ts.ScriptTarget.Latest,
  true,
  file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
 );
 const targets = [];
 const addTarget = (node, rawValue) => {
  if (rawValue === null) return;
  const target = normalizeNavigationTarget(rawValue);
  if (target === null) return;
  targets.push({ target, location: locationOf(sourceFile, node) });
 };

 const visit = (node) => {
  if (ts.isJsxAttribute(node) && node.name.text === "href" && node.initializer) {
   if (ts.isStringLiteral(node.initializer)) {
    addTarget(node, node.initializer.text);
   } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
    addTarget(node, parseNavigationValue(node.initializer.expression));
   }
  }

  if (ts.isPropertyAssignment(node)) {
   const name = node.name;
   const key = ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : "";
   if (key === "href") addTarget(node, parseNavigationValue(node.initializer));
  }

  if (ts.isCallExpression(node) && node.arguments.length > 0) {
   const expression = node.expression;
   const directName = ts.isIdentifier(expression) ? expression.text : "";
   const methodName = ts.isPropertyAccessExpression(expression) ? expression.name.text : "";
   const isNavigationCall =
    directName === "redirect" ||
    directName === "permanentRedirect" ||
    methodName === "push" ||
    methodName === "replace" ||
    methodName === "prefetch";
   if (isNavigationCall) addTarget(node, parseNavigationValue(node.arguments[0]));
  }

  ts.forEachChild(node, visit);
 };

 visit(sourceFile);
 return targets;
}

function publicAssetExists(target) {
 if (!fs.existsSync(PUBLIC_ROOT)) return false;
 const relative = target.replace(/^\//u, "");
 if (relative.length === 0) return false;
 const candidate = path.resolve(PUBLIC_ROOT, relative);
 return candidate.startsWith(`${PUBLIC_ROOT}${path.sep}`) && fs.existsSync(candidate);
}

export function findBrokenNavigationTargets({ routes, targets }) {
 const routeMatchers = routes.map((route) => ({ route, regex: routePatternToRegex(route) }));
 return targets.filter(({ target }) => {
  if (target.startsWith("/_next/")) return false;
  if (publicAssetExists(target)) return false;
  return !routeMatchers.some(({ regex }) => regex.test(target));
 });
}

export function runRouteIntegrityCheck() {
 const routeEntrypoints = listFiles(APP_ROOT, (file) =>
  ROUTE_ENTRY_PATTERN.test(path.basename(file)),
 );
 const routes = Array.from(new Set(routeEntrypoints.map(routeFromAppEntrypoint))).sort();
 const sourceFiles = listFiles(SOURCE_ROOT, (file) => SOURCE_EXTENSIONS.has(path.extname(file)));
 const targets = sourceFiles.flatMap(collectNavigationTargets);
 const uniqueTargets = Array.from(
  new Map(targets.map((entry) => [`${entry.location}::${entry.target}`, entry])).values(),
 );
 const broken = findBrokenNavigationTargets({ routes, targets: uniqueTargets });

 if (broken.length > 0) {
  console.error("Internal route integrity check failed:");
  for (const entry of broken) console.error(`- ${entry.location} -> ${entry.target}`);
  console.error(
   `\nKnown App Router endpoints: ${routes.length}; checked targets: ${uniqueTargets.length}.`,
  );
  process.exitCode = 1;
  return;
 }

 console.log(
  `Internal route integrity check passed: ${routes.length} App Router endpoints, ${uniqueTargets.length} static navigation targets.`,
 );
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) runRouteIntegrityCheck();
