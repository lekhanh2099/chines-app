const fs = require("node:fs");
const path = require("node:path");

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const datasets = args.has("--dataset")
  ? [process.argv[process.argv.indexOf("--dataset") + 1]]
  : ["q2", "q3"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function replaceGrammarRefsDeep(value, idMap) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] === "string" && idMap.has(value[i])) {
        value[i] = idMap.get(value[i]);
      } else {
        replaceGrammarRefsDeep(value[i], idMap);
      }
    }
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    if (key === "grammar_refs" && Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        if (typeof child[i] === "string" && idMap.has(child[i])) {
          child[i] = idMap.get(child[i]);
        }
      }
      continue;
    }

    replaceGrammarRefsDeep(child, idMap);
  }
}

function walkJsonFiles(dir) {
  const out = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(full);
    }
  }

  return out;
}

let changedGrammarPoints = 0;
let changedRefs = 0;

for (const dataset of datasets) {
  if (!["q2", "q3"].includes(dataset)) {
    throw new Error(`Invalid dataset: ${dataset}`);
  }

  const lessonsRoot = path.join("data/hanzihome-db", dataset, "lessons");
  const lessonDirs = fs.readdirSync(lessonsRoot).filter((name) => /^lesson_\d+$/.test(name)).sort();

  for (const lessonDir of lessonDirs) {
    const lessonNumber = Number(lessonDir.replace("lesson_", ""));
    const grammarFile = path.join(lessonsRoot, lessonDir, "sections/05-grammar.json");

    if (!fs.existsSync(grammarFile)) continue;

    const grammar = readJson(grammarFile);
    const idMap = new Map();

    for (const [index, item] of (grammar.items ?? []).entries()) {
      const oldId = item.id;
      const newId = `grammar_${dataset}_l${pad(lessonNumber)}_${pad(index + 1)}`;

      if (oldId !== newId) {
        idMap.set(oldId, newId);
        item.id = newId;
        changedGrammarPoints++;

        if (!Array.isArray(item.legacy_ids)) item.legacy_ids = [];
        if (typeof oldId === "string" && oldId && !item.legacy_ids.includes(oldId)) {
          item.legacy_ids.push(oldId);
        }

        console.log(`${apply ? "UPDATE" : "DRY"} ${grammarFile}: ${oldId} -> ${newId}`);
      }
    }

    if (idMap.size === 0) continue;

    replaceGrammarRefsDeep(grammar, idMap);

    const lessonRoot = path.join(lessonsRoot, lessonDir);
    for (const file of walkJsonFiles(lessonRoot)) {
      if (file === grammarFile) continue;

      const before = fs.readFileSync(file, "utf8");
      const json = JSON.parse(before);
      replaceGrammarRefsDeep(json, idMap);
      const after = JSON.stringify(json, null, 2) + "\n";

      if (after !== before) {
        changedRefs++;
        console.log(`${apply ? "UPDATE" : "DRY"} refs ${file}`);
        if (apply) fs.writeFileSync(file, after);
      }
    }

    if (apply) writeJson(grammarFile, grammar);
  }
}

console.log("");
console.log(`changedGrammarPoints=${changedGrammarPoints}`);
console.log(`changedRefFiles=${changedRefs}`);
console.log(`mode=${apply ? "apply" : "dry-run"}`);
