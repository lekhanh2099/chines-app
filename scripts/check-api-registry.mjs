import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { aiRuntimeDailyReadingInventoryFile } from "./api-inventory/ai-runtime-daily-reading.mjs";
import { dailyReadingInventoryFile } from "./api-inventory/daily-reading.mjs";
import { dictionaryInventoryFile } from "./api-inventory/dictionary.mjs";

const API_ROOT = "src/app/api";
const PUBLIC_REGISTRY_FILE = "src/features/developer-api/api-registry.ts";
const INVENTORY_FILES = [
 PUBLIC_REGISTRY_FILE,
 dailyReadingInventoryFile,
 dictionaryInventoryFile,
 aiRuntimeDailyReadingInventoryFile,
];
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const REQUIRED_DIRECT_FLOWS = new Set([
 "direct:notes-library",
 "direct:note-short-id",
 "direct:lesson-text-annotations",
 "direct:vocabulary-srs-progress",
 "direct:dictionary-srs-list",
 "direct:hanzihome-content-role",
]);

function listRouteFiles(directory) {
 if (!fs.existsSync(directory)) return [];

 return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listRouteFiles(entryPath);
  return entry.name === "route.ts" ? [entryPath] : [];
 });
}

function routePathFromFile(file) {
 return `/${path
  .relative("src/app", file)
  .slice(0, -"/route.ts".length)
  .split(path.sep)
  .join("/")}`;
}

function exportedMethods(file) {
 const source = fs.readFileSync(file, "utf8");
 const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
 const methods = new Set();

 for (const statement of sourceFile.statements) {
  if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
   continue;
  }

  if (
   ts.isFunctionDeclaration(statement) &&
   statement.name &&
   HTTP_METHODS.has(statement.name.text)
  ) {
   methods.add(statement.name.text);
  }

  if (ts.isVariableStatement(statement)) {
   for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && HTTP_METHODS.has(declaration.name.text)) {
     methods.add(declaration.name.text);
    }
   }
  }
 }

 return [...methods].sort();
}

function property(object, name) {
 return object.properties.find(
  (entry) =>
   ts.isPropertyAssignment(entry) && ts.isIdentifier(entry.name) && entry.name.text === name,
 );
}

function isTextLiteral(initializer) {
 return ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer);
}

function stringValue(object, name, failures) {
 const entry = property(object, name);
 if (!entry || !isTextLiteral(entry.initializer)) {
  failures.push(`Registry entry is missing a string ${name} property`);
  return null;
 }
 return entry.initializer.text;
}

function nullableStringValue(object, name, failures) {
 const entry = property(object, name);
 if (!entry) {
  failures.push(`Registry entry is missing a ${name} property`);
  return null;
 }
 if (isTextLiteral(entry.initializer)) return entry.initializer.text;
 if (entry.initializer.kind === ts.SyntaxKind.NullKeyword) return null;

 failures.push(`Registry entry ${name} must be a string literal or null`);
 return null;
}

function numberValue(object, name, failures) {
 const entry = property(object, name);
 if (!entry || !ts.isNumericLiteral(entry.initializer)) {
  failures.push(`Registry entry is missing a numeric ${name} property`);
  return null;
 }
 return Number(entry.initializer.text);
}

function jsonExampleValue(object, name, failures) {
 const value = nullableStringValue(object, name, failures);
 if (value === null) return null;

 try {
  JSON.parse(value);
 } catch {
  failures.push(`Registry entry ${name} must contain valid JSON`);
 }
 return value;
}

function methodValues(object, failures) {
 const entry = property(object, "methods");
 if (!entry || !ts.isArrayLiteralExpression(entry.initializer)) {
  failures.push("Registry entry is missing an array methods property");
  return [];
 }

 const methods = [];
 for (const element of entry.initializer.elements) {
  if (!ts.isStringLiteral(element) || !HTTP_METHODS.has(element.text)) {
   failures.push("Registry methods must be HTTP method string literals");
   continue;
  }
  methods.push(element.text);
 }
 return methods.sort();
}

function operationValues(object, failures) {
 const entry = property(object, "operations");
 if (!entry || !ts.isArrayLiteralExpression(entry.initializer)) {
  failures.push("Public API endpoint is missing an array operations property");
  return [];
 }

 const operations = [];
 for (const element of entry.initializer.elements) {
  if (!ts.isObjectLiteralExpression(element)) {
   failures.push("Public API operations must be object literals");
   continue;
  }

  const method = stringValue(element, "method", failures);
  nullableStringValue(element, "query", failures);
  jsonExampleValue(element, "requestBody", failures);
  numberValue(element, "responseStatus", failures);
  stringValue(element, "responseContentType", failures);
  jsonExampleValue(element, "responseBody", failures);

  if (!method || !HTTP_METHODS.has(method)) {
   failures.push("Public API operation method must be an HTTP method string literal");
   continue;
  }
  operations.push(method);
 }

 return operations.sort();
}

function collectInventoryEntries() {
 const failures = [];
 const entries = [];

 for (const registryFile of INVENTORY_FILES) {
  const source = fs.readFileSync(registryFile, "utf8");
  const sourceFile = ts.createSourceFile(registryFile, source, ts.ScriptTarget.Latest, true);

  function visit(node) {
   if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "inventoryEntry" &&
    node.arguments.length === 1 &&
    ts.isObjectLiteralExpression(node.arguments[0])
   ) {
    const currentPath = stringValue(node.arguments[0], "currentPath", failures);
    const sourceKind = stringValue(node.arguments[0], "source", failures);
    const exposure = stringValue(node.arguments[0], "exposure", failures);
    const v1Path = nullableStringValue(node.arguments[0], "v1Path", failures);
    const internalReason = nullableStringValue(node.arguments[0], "internalReason", failures);
    const methods = methodValues(node.arguments[0], failures);
    if (currentPath && sourceKind && exposure) {
     entries.push({ currentPath, sourceKind, exposure, v1Path, internalReason, methods });
    }
   }
   ts.forEachChild(node, visit);
  }

  visit(sourceFile);
 }
 return { entries, failures };
}

function collectPublicEndpoints() {
 const source = fs.readFileSync(PUBLIC_REGISTRY_FILE, "utf8");
 const sourceFile = ts.createSourceFile(PUBLIC_REGISTRY_FILE, source, ts.ScriptTarget.Latest, true);
 const failures = [];
 const entries = [];

 function visit(node) {
  if (
   ts.isCallExpression(node) &&
   ts.isIdentifier(node.expression) &&
   node.expression.text === "endpoint" &&
   node.arguments.length === 1 &&
   ts.isObjectLiteralExpression(node.arguments[0])
  ) {
   const path = stringValue(node.arguments[0], "path", failures);
   const methods = methodValues(node.arguments[0], failures);
   const operations = operationValues(node.arguments[0], failures);
   if (path) entries.push({ path, methods, operations });
  }
  ts.forEachChild(node, visit);
 }

 visit(sourceFile);
 return { entries, failures };
}

export function runApiRegistryCheck() {
 const failures = [];
 const { entries, failures: registryFailures } = collectInventoryEntries();
 const { entries: publicEndpoints, failures: endpointFailures } = collectPublicEndpoints();
 failures.push(...registryFailures);
 failures.push(...endpointFailures);

 const registryRoutes = new Map();
 const directFlows = new Set();
 const publicInventoryPaths = new Set();
 const publicEndpointPaths = new Set(publicEndpoints.map((entry) => entry.path));
 for (const entry of entries) {
  if (entry.sourceKind === "route") {
   if (registryRoutes.has(entry.currentPath)) {
    failures.push(`Duplicate route inventory entry: ${entry.currentPath}`);
   }
   registryRoutes.set(entry.currentPath, entry.methods);
  }
  if (entry.sourceKind === "client-flow") directFlows.add(entry.currentPath);

  if (entry.exposure === "public-v1") {
   if (!entry.v1Path) {
    failures.push(`Public API inventory entry requires a v1Path: ${entry.currentPath}`);
   } else {
    publicInventoryPaths.add(entry.v1Path);
    if (!publicEndpointPaths.has(entry.v1Path)) {
     failures.push(`Public API inventory maps to an undocumented v1 endpoint: ${entry.v1Path}`);
    }
   }
  } else if (entry.v1Path || !entry.internalReason) {
   failures.push(
    `Internal-only API inventory requires a reason and no v1Path: ${entry.currentPath}`,
   );
  }
 }

 for (const endpoint of publicEndpoints) {
  if (!publicInventoryPaths.has(endpoint.path)) {
   failures.push(`Public v1 endpoint has no current API inventory mapping: ${endpoint.path}`);
  }

  if (endpoint.methods.join(",") !== endpoint.operations.join(",")) {
   failures.push(
    `Public API methods differ from documented operations for ${endpoint.path}: expected ${endpoint.methods.join(",")}, found ${endpoint.operations.join(",") || "none"}`,
   );
  }

  if (new Set(endpoint.operations).size !== endpoint.operations.length) {
   failures.push(`Public API endpoint has duplicate operation examples: ${endpoint.path}`);
  }
 }

 for (const file of listRouteFiles(API_ROOT).sort()) {
  const currentPath = routePathFromFile(file);
  const actualMethods = exportedMethods(file);
  const registeredMethods = registryRoutes.get(currentPath);

  if (!registeredMethods) {
   failures.push(`Missing API inventory entry: ${currentPath}`);
   continue;
  }

  if (actualMethods.join(",") !== registeredMethods.join(",")) {
   failures.push(
    `API inventory methods differ for ${currentPath}: expected ${actualMethods.join(",") || "none"}, found ${registeredMethods.join(",") || "none"}`,
   );
  }
 }

 const actualRoutePaths = new Set(listRouteFiles(API_ROOT).map(routePathFromFile));
 for (const currentPath of registryRoutes.keys()) {
  if (!actualRoutePaths.has(currentPath)) {
   failures.push(`Stale API inventory entry: ${currentPath}`);
  }
 }

 for (const flow of REQUIRED_DIRECT_FLOWS) {
  if (!directFlows.has(flow)) failures.push(`Missing direct data-flow inventory entry: ${flow}`);
 }

 if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
  return failures;
 }

 console.info("API registry covers every route handler and required direct data flow.");
 return failures;
}

const isMainModule =
 process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) runApiRegistryCheck();
