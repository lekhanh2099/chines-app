import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const targets = [
  "src/features/hanzihome",
  "src/app/api/hanzihome",
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }

  return files;
}

function rel(file) {
  return path.relative(root, file);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

const files = targets.flatMap((target) => walk(path.join(root, target)));
let failed = false;

function fail(message) {
  failed = true;
  console.log(`❌ ${message}`);
}

function pass(message) {
  console.log(`✅ ${message}`);
}

console.log("🔎 Checking HanziHome performance boundaries...\n");

for (const file of files) {
  const filePath = rel(file);
  const content = read(file);

  if (
    filePath.endsWith("HanziHomeWorkspace.tsx") &&
    content.includes("includeLessons: true")
  ) {
    fail(`${filePath} must not call catalog includeLessons=true`);
  }

  if (
    filePath.includes("lesson-drafts/route.ts") &&
    content.includes("content, created_at") &&
    content.includes("export async function GET")
  ) {
    fail(`${filePath} GET list still appears to return/read full draft content`);
  }

  if (
    filePath.endsWith("HanziHomeLibraryHome.tsx") &&
    content.includes("mapLessonDraftToHanziHomeLesson")
  ) {
    fail(`${filePath} still maps draft list into full lesson view models`);
  }

  if (
    filePath.endsWith("HanziHomeLibraryHome.tsx") &&
    content.includes("function CourseCard") &&
    content.includes("useLearningState()")
  ) {
    fail(`${filePath} CourseCard should not call useLearningState per card`);
  }

  if (
    filePath.endsWith("useHanziHomeCatalogData.ts") &&
    content.includes("staleTime: 0")
  ) {
    fail(`${filePath} catalog query staleTime is 0`);
  }

  if (
    filePath.endsWith("use-lesson-drafts.ts") &&
    !content.includes("staleTime")
  ) {
    fail(`${filePath} lesson draft list has no staleTime`);
  }

  if (content.includes("/api/hanzihome/data")) {
    fail(`${filePath} still references legacy /api/hanzihome/data`);
  }
}

if (!failed) {
  pass("No obvious HanziHome performance boundary violations.");
}

if (failed) {
  console.log("\n❌ Performance boundary check failed.");
  process.exit(1);
}

console.log("\n✅ Performance boundary check passed.");
