import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dataDir = path.join(root, "data", "hanzihome");
const writeManifest = process.argv.includes("--write-manifest");

const files = {
  bundle: "hanzihome_bundle_clean.json",
  lessons: "hanzihome_lessons_index_clean.json",
  vocab: "hanzihome_vocab_clean.json",
  grammar: "hanzihome_grammar_clean.json",
  radicals: "hanzihome_radicals_clean.json",
  flashcards: "hanzihome_flashcards_clean.json",
};

function readJson(fileName) {
  const filePath = path.join(dataDir, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hashFile(fileName) {
  const filePath = path.join(dataDir, fileName);
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function uniqueIds(items, label) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (!item?.id) duplicates.add("(missing id)");
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  assert(!duplicates.size, `${label} has duplicate ids: ${[...duplicates].join(", ")}`);
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

const bundle = readJson(files.bundle);
const splitLessons = readJson(files.lessons);
const splitVocab = readJson(files.vocab);
const splitGrammar = readJson(files.grammar);
const splitRadicals = readJson(files.radicals);
const splitFlashcards = readJson(files.flashcards);

const lessons = bundle.lessons || [];
const vocab = bundle.vocab || [];
const grammarPoints = bundle.grammarPoints || [];
const radicals = bundle.radicals || [];
const flashcards = bundle.flashcards || [];

assert(Array.isArray(lessons), "bundle.lessons must be an array");
assert(Array.isArray(vocab), "bundle.vocab must be an array");
assert(Array.isArray(grammarPoints), "bundle.grammarPoints must be an array");
assert(Array.isArray(radicals), "bundle.radicals must be an array");
assert(Array.isArray(flashcards), "bundle.flashcards must be an array");

assert(lessons.length === splitLessons.lessons.length, "lesson split count does not match bundle");
assert(vocab.length === splitVocab.vocab.length, "vocab split count does not match bundle");
assert(grammarPoints.length === splitGrammar.grammarPoints.length, "grammar split count does not match bundle");
assert(radicals.length === splitRadicals.radicals.length, "radical split count does not match bundle");
assert(flashcards.length === splitFlashcards.flashcards.length, "flashcard split count does not match bundle");

uniqueIds(lessons, "lessons");
uniqueIds(vocab, "vocab");
uniqueIds(grammarPoints, "grammarPoints");
uniqueIds(radicals, "radicals");
uniqueIds(flashcards, "flashcards");

const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const vocabIds = new Set(vocab.map((entry) => entry.id));
const grammarIds = new Set(grammarPoints.map((point) => point.id));
const radicalIds = new Set(radicals.map((radical) => radical.id));
const vocabLessonWordKeys = new Set(vocab.map((entry) => `${entry.lessonId}::${entry.word}`));
const radicalKeys = new Set(radicals.map((radical) => radical.radical));

for (const lesson of lessons) {
  for (const vocabId of lesson.vocabIds || []) {
    assert(vocabIds.has(vocabId), `lesson ${lesson.id} references missing vocab ${vocabId}`);
  }
  for (const grammarId of lesson.grammarPointIds || []) {
    assert(grammarIds.has(grammarId), `lesson ${lesson.id} references missing grammar point ${grammarId}`);
  }
}

for (const entry of vocab) {
  assert(lessonIds.has(entry.lessonId), `vocab ${entry.id} references missing lesson ${entry.lessonId}`);
}

for (const point of grammarPoints) {
  assert(lessonIds.has(point.lessonId), `grammar point ${point.id} references missing lesson ${point.lessonId}`);
}

for (const card of flashcards) {
  if (card.type === "vocab") {
    assert(
      lessonIds.has(card.lessonId),
      `vocab flashcard ${card.id} references missing lesson ${card.lessonId}`,
    );
    assert(
      vocabLessonWordKeys.has(`${card.lessonId}::${card.front}`),
      `vocab flashcard ${card.id} has no matching vocab word ${card.front} in ${card.lessonId}`,
    );
  }
  if (card.type === "radical") {
    assert(
      radicalKeys.has(card.front) || radicalIds.has(card.id),
      `radical flashcard ${card.id} has no matching radical ${card.front}`,
    );
  }
}

const lessonNumbers = lessons.map((lesson) => lesson.lessonNumber).filter((value) => typeof value === "number");
const manifest = {
  app: bundle.meta?.app || "HanziHome",
  dataset: bundle.meta?.dataset || "unknown",
  version: bundle.meta?.version || "unknown",
  generatedAt: bundle.meta?.generatedAt || null,
  packagedAt: new Date().toISOString(),
  sourceFiles: bundle.meta?.sourceFiles || [],
  counts: {
    lessons: lessons.length,
    vocab: vocab.length,
    grammarPoints: grammarPoints.length,
    radicals: radicals.length,
    flashcards: flashcards.length,
  },
  lessonRange: {
    from: Math.min(...lessonNumbers),
    to: Math.max(...lessonNumbers),
  },
  vocabByLesson: countBy(vocab, "lessonNumber"),
  grammarByLesson: countBy(grammarPoints, "lessonNumber"),
  flashcardsByType: countBy(flashcards, "type"),
  files: Object.fromEntries(
    Object.entries(files).map(([key, fileName]) => [
      key,
      {
        fileName,
        sha256: hashFile(fileName),
      },
    ]),
  ),
};

if (writeManifest) {
  fs.writeFileSync(
    path.join(dataDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

console.log(JSON.stringify({ ok: true, manifest }, null, 2));
