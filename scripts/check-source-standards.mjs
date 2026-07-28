import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

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
const GENERATED_TYPE_FILES = new Set(["src/types/supabase.generated.ts"]);
const LIBRARY_UNION_EXCEPTION_BUDGET = new Map([
 ["src/components/editor/nodes/InlineNoteNode.tsx::DOMConversionOutput | null", 1],
 ["src/components/editor/nodes/InlineNoteNode.tsx::DOMConversionMap | null", 1],
 ["src/components/editor/nodes/InlineNoteNode.tsx::LexicalNode | null | undefined", 1],
 ["src/components/editor/nodes/InternalLinkNode.ts::DOMConversionMap | null", 1],
 ["src/components/editor/nodes/InternalLinkNode.ts::null | TextNode", 1],
 ["src/components/editor/nodes/InternalLinkNode.ts::DOMConversionOutput | null", 1],
 ["src/components/editor/nodes/InternalLinkNode.ts::LexicalNode | null | undefined", 1],
 ["src/components/editor/nodes/PinyinNode.tsx::DOMConversionOutput | null", 1],
 ["src/components/editor/nodes/PinyinNode.tsx::DOMConversionMap | null", 1],
 ["src/components/editor/nodes/PinyinNode.tsx::LexicalNode | null | undefined", 1],
]);

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

 if (!GENERATED_TYPE_FILES.has(file)) {
  const sourceFile = ts.createSourceFile(
   file,
   source,
   ts.ScriptTarget.Latest,
   true,
   file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const inspectTypeNode = (node) => {
   if (node.kind === ts.SyntaxKind.AnyKeyword || node.kind === ts.SyntaxKind.UnknownKeyword) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    failures.push(
     `${file}:${line + 1}:${character + 1} uses an unsafe explicit ${node.getText(sourceFile)} type`,
    );
   }
   if (ts.isUnionTypeNode(node)) {
    const unionText = node.getText(sourceFile).replace(/\s+/g, " ");
    const exceptionKey = `${file}::${unionText}`;
    const remainingBudget = LIBRARY_UNION_EXCEPTION_BUDGET.get(exceptionKey) ?? 0;

    if (remainingBudget > 0) {
     LIBRARY_UNION_EXCEPTION_BUDGET.set(exceptionKey, remainingBudget - 1);
    } else {
     const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
     );
     failures.push(
      `${file}:${line + 1}:${character + 1} uses an unaudited handwritten union: ${unionText}`,
     );
    }
   }
   ts.forEachChild(node, inspectTypeNode);
  };

  inspectTypeNode(sourceFile);

  lines.forEach((line, index) => {
   if (/\bz\.(?:any|unknown)\s*\(/.test(line)) {
    failures.push(
     `${file}:${index + 1} uses an unconstrained Zod schema; define the runtime contract`,
    );
   }
  });
 }
}

if (failures.length > 0) {
 console.error(failures.join("\n"));
 process.exitCode = 1;
} else {
 console.info("Source architecture and deprecated-API checks passed.");
}
