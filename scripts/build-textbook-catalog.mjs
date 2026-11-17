// Builds the lesson list of the bundled textbooks (static-json/textbook-catalog.json).
// The client bundles only this catalog; lesson content stays on the server.
// Run: npm run content:textbook-catalog   (--check fails when the catalog is stale)
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve("src/features/hanzihome/static-json");
const read = (file) => JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));

const books = [
 ...read("business-chinese.json").books,
 read("nhip-cau.json"),
 read("doc-hieu.json"),
 read("khau-ngu.json"),
];
const catalog = books.map((book) => ({
 id: book.id,
 key: book.key,
 label: book.label,
 lessons: book.lessons.map((lesson) => ({
  id: lesson.id,
  bookKey: lesson.bookKey,
  number: lesson.number,
  title: lesson.title,
  vocabCount: lesson.vocab.length,
 })),
}));

const output = path.join(DIR, "textbook-catalog.json");
if (process.argv.includes("--check")) {
 const current = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf8")) : null;
 if (JSON.stringify(current) !== JSON.stringify(catalog)) {
  console.error('Stale textbook catalog: run "npm run content:textbook-catalog".');
  process.exit(1);
 }
} else {
 fs.writeFileSync(output, `${JSON.stringify(catalog)}\n`);
 console.log(`textbook catalog: ${catalog.length} books`);
}
