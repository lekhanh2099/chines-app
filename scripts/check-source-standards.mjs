import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src", "scripts"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set(["node_modules", ".next", "coverage"]);

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

function listSourceFiles(directory) {
 if (!fs.existsSync(directory)) return [];

 return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (IGNORED_DIRECTORIES.has(entry.name)) return [];
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listSourceFiles(entryPath);
  return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
 });
}

const failures = [];

for (const file of ROOTS.flatMap(listSourceFiles)) {
 const source = fs.readFileSync(file, "utf8");
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

if (failures.length > 0) {
 console.error(failures.join("\n"));
 process.exitCode = 1;
} else {
 console.info("Source architecture and deprecated-API checks passed.");
}
