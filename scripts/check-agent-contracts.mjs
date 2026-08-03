import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOTS = [".agents/skills", ".codex/skills"];
const MAX_SKILL_LINES = 500;
const LOCAL_SKILL_REFERENCE = "docs/agent/skill-authoring.md";

function normalizeRelativePath(file) {
 return file.split(path.sep).join("/");
}

function readText(root, file) {
 return fs.readFileSync(path.join(root, file), "utf8");
}

function discoverSkillFiles(root) {
 return SKILL_ROOTS.flatMap((skillRoot) => {
  const directory = path.join(root, skillRoot);
  if (!fs.existsSync(directory)) return [];

  return fs
   .readdirSync(directory, { withFileTypes: true })
   .filter((entry) => entry.isDirectory())
   .map((entry) => normalizeRelativePath(path.join(skillRoot, entry.name, "SKILL.md")))
   .filter((file) => fs.existsSync(path.join(root, file)));
 });
}

function extractMarkdownReferences(source) {
 const references = [];
 const pattern = /\[[^\]]+\]\(([^)]+)\)/g;

 for (const match of source.matchAll(pattern)) {
  const target = match[1].trim();
  if (!target || target.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
  references.push(target);
 }

 return references;
}

function resolveReference(root, sourceFile, target) {
 if (target.startsWith("/")) return target;
 if (target.startsWith("docs/") || target.startsWith("src/")) {
  return path.join(root, target);
 }
 return path.resolve(path.dirname(path.join(root, sourceFile)), target);
}

function hasFile(root, file, virtualFiles) {
 if (virtualFiles) return virtualFiles.has(normalizeRelativePath(path.relative(root, file)));
 return fs.existsSync(file);
}

export function inspectAgentContracts({
 root = process.cwd(),
 skillFiles = discoverSkillFiles(root),
 packageJson = JSON.parse(readText(root, "package.json")),
 virtualFiles,
 readFile = (file) => readText(root, normalizeRelativePath(path.relative(root, file))),
}) {
 const failures = [];
 const rootAgents = readFile(path.join(root, "AGENTS.md"));
 const skillAuthoring = path.join(root, LOCAL_SKILL_REFERENCE);

 if (!rootAgents.includes("Authority order is:")) {
  failures.push("AGENTS.md is missing the repository authority order");
 }
 if (!rootAgents.includes("Workflow tiers")) {
  failures.push("AGENTS.md is missing fast/subsystem/full workflow tiers");
 }
 if (!hasFile(root, skillAuthoring, virtualFiles)) {
  failures.push(`missing canonical skill reference: ${LOCAL_SKILL_REFERENCE}`);
 }

 for (const skillFile of skillFiles) {
  const source = readFile(path.join(root, skillFile));
  const directoryName = path.basename(path.dirname(skillFile));
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  const name = frontmatter?.[1].match(/^name:\s*([^\n]+)$/m)?.[1].trim();
  const description = frontmatter?.[1].match(/^description:\s*(.+)$/m)?.[1].trim();

  if (!frontmatter || !name || !description) {
   failures.push(`${skillFile} is missing valid name/description frontmatter`);
  } else if (name !== directoryName) {
   failures.push(`${skillFile} name does not match directory ${directoryName}`);
  }

  if (source.split("\n").length > MAX_SKILL_LINES) {
   failures.push(`${skillFile} exceeds ${MAX_SKILL_LINES} lines; move details to references`);
  }
  if (!source.includes(LOCAL_SKILL_REFERENCE)) {
   failures.push(`${skillFile} does not link ${LOCAL_SKILL_REFERENCE}`);
  }

  for (const reference of extractMarkdownReferences(source)) {
   const resolved = resolveReference(root, skillFile, reference);
   if (!hasFile(root, resolved, virtualFiles)) {
    failures.push(`${skillFile} links a missing local reference: ${reference}`);
   }
  }
 }

 const packageScripts = Object.values(packageJson.scripts ?? {});
 const scriptReferences = new Set();
 for (const command of packageScripts) {
  for (const match of command.matchAll(
   /(?:^|[\s"'=])((?:scripts|supabase)\/[^\s"';&|]+\.[cm]?[jt]sx?)/g,
  )) {
   scriptReferences.add(match[1]);
  }
 }
 for (const scriptFile of scriptReferences) {
  if (!hasFile(root, path.join(root, scriptFile), virtualFiles)) {
   failures.push(`package script references missing file: ${scriptFile}`);
  }
 }

 if (!String(packageJson.scripts?.check ?? "").includes("npm run agent:check")) {
  failures.push("package check gate does not run npm run agent:check");
 }

 return failures;
}

export function runAgentContractCheck() {
 const failures = inspectAgentContracts({ root: process.cwd() });
 if (failures.length > 0) {
  console.error("Agent contract drift detected:");
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
 } else {
  console.info("Agent skill, instruction, and package-contract checks passed.");
 }
}

const isMainModule =
 process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) runAgentContractCheck();
