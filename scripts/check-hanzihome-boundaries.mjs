import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

const targets = [
  "src/features/hanzihome",
  "src/app/api/hanzihome",
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist", "build"].includes(entry.name)) continue;
      walk(fullPath, files);
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function rel(file) {
  return path.relative(root, file);
}

const files = targets.flatMap((target) => walk(path.join(root, target)));

const checks = [
  {
    name: "Workspace không được gọi catalog includeLessons=true",
    test(file, content) {
      if (!rel(file).includes("HanziHomeWorkspace.tsx")) return [];
      return content.includes("includeLessons: true")
        ? ["HanziHomeWorkspace vẫn gọi includeLessons: true"]
        : [];
    },
  },
  {
    name: "Workspace không được phụ thuộc catalog?includeLessons=1",
    test(file, content) {
      const filePath = rel(file);

      if (!filePath.includes("HanziHomeWorkspace.tsx")) {
        return [];
      }

      return content.includes("includeLessons: true") ||
        content.includes("includeLessons=1")
        ? [`${filePath} còn phụ thuộc full lesson catalog`]
        : [];
    },
  },
  {
    name: "Không access .radicals từ API catalog response",
    test(file, content) {
      const filePath = rel(file);
      if (!filePath.includes("useHanziHomeCatalogData.ts")) return [];

      const suspicious = [
        "parsed.radicals",
        "json.radicals",
        "data.radicals",
      ].filter((pattern) => content.includes(pattern));

      return suspicious.map(
        (pattern) =>
          `${filePath} access ${pattern}; catalog API không trả radicals, phải lấy từ static fallback.`,
      );
    },
  },
  {
    name: "Course lessons hook tồn tại",
    test(file, content) {
      return [];
    },
  },
];

let failed = false;

console.log("🔎 Checking HanziHome boundaries...\n");

for (const check of checks) {
  const errors = [];

  for (const file of files) {
    errors.push(...check.test(file, read(file)));
  }

  if (errors.length > 0) {
    failed = true;
    console.log(`❌ ${check.name}`);
    for (const error of errors) console.log(`   - ${error}`);
    console.log("");
  } else {
    console.log(`✅ ${check.name}`);
  }
}

const requiredFiles = [
  "src/features/hanzihome/hooks/useHanziHomeCourseLessons.ts",
  "src/app/api/hanzihome/course-lessons/route.ts",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    failed = true;
    console.log(`❌ Missing required file: ${file}`);
  } else {
    console.log(`✅ Found ${file}`);
  }
}

console.log("\n🔎 Running TypeScript check filtered for radicals/catalog issues...\n");

try {
  execSync("npm run typecheck", {
    stdio: "inherit",
    cwd: root,
  });
} catch {
  failed = true;
  console.log("\n❌ Typecheck failed. Search likely problem lines:");
  try {
    const output = execSync(
      "grep -R \"\\.radicals\\|includeLessons: true\\|includeLessons=1\\|getHanziHomeCatalogSummary(true)\" src/features/hanzihome src/app/api/hanzihome -n",
      { cwd: root, encoding: "utf8" },
    );
    console.log(output);
  } catch {
    console.log("No grep hits.");
  }
}

if (failed) {
  console.log("\n❌ HanziHome boundary check failed.");
  process.exit(1);
}

console.log("\n✅ HanziHome boundary check passed.");
