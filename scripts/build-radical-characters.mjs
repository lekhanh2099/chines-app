// Builds the static "explained characters" package from the reviewed notes in
// docs/radicals/0*.md. The markdown is the editable source; the JSON outputs are
// generated and must not be edited by hand. Run: npm run content:radical-characters
import fs from "node:fs";
import path from "node:path";

const SOURCE_DIR = path.resolve("docs/radicals");
const OUTPUT_DIR = path.resolve("src/features/hanzihome/static-json");
const HAN = /[㐀-鿿\u{20000}-\u{2ffff}]/u;

const cleanInline = (value) =>
 value
  .replace(/`([^`]*)`/gu, "$1")
  .replace(/\*\*([^*]+)\*\*/gu, "$1")
  .replace(/(^|[^\p{L}\p{N}])_([^_]+)_(?=$|[^\p{L}\p{N}])/gu, "$1$2")
  .replace(/\s+/gu, " ")
  .trim();

// README section 4 is the single reviewed mapping from each note to its hanzihome_radicals row.
const radicalIdByOrder = new Map();
for (const line of fs.readFileSync(path.join(SOURCE_DIR, "README.md"), "utf8").split("\n")) {
 const row = /^\|\s*(\d{2})\s*\|\s*[ABC]\s*\|/u.exec(line);
 if (row) radicalIdByOrder.set(Number(row[1]), /`(radical-\d{3})`/u.exec(line)?.[1] ?? "");
}
if (radicalIdByOrder.size !== 69) {
 throw new Error(`README mapping table has ${radicalIdByOrder.size} rows, expected 69`);
}

const radicals = [];
for (const file of fs
 .readdirSync(SOURCE_DIR)
 .filter((name) => /^0\d-.*\.md$/u.test(name))
 .sort()) {
 let radical = null;
 let group = null;
 let inCharacterSection = false;
 for (const line of fs.readFileSync(path.join(SOURCE_DIR, file), "utf8").split("\n")) {
  const radicalHeading = /^## Bộ (\d+): (\S+) \((.+)\)\s*$/u.exec(line);
  if (radicalHeading) {
   radical = {
    order: Number(radicalHeading[1]),
    radical: radicalHeading[2],
    hanViet: radicalHeading[3],
    radicalId: radicalIdByOrder.get(Number(radicalHeading[1])) ?? "",
    groups: [],
   };
   radicals.push(radical);
   group = null;
   inCharacterSection = false;
   continue;
  }
  if (!radical) continue;
  if (/^### \d+\. /u.test(line)) {
   inCharacterSection = line.startsWith("### 2.");
   group = null;
   continue;
  }
  if (!inCharacterSection) continue;
  const groupHeading = /^#{3,4} (Nhóm \S+?): (.+)$/u.exec(line);
  if (groupHeading) {
   group = { name: cleanInline(groupHeading[2]), characters: [] };
   radical.groups.push(group);
   continue;
  }
  if (!line.startsWith("|") || /^\|\s*:?-/u.test(line) || line.includes("Pinyin")) continue;
  const cells = line
   .trim()
   .replace(/^\||\|$/gu, "")
   .split("|")
   .map((cell) => cell.trim());
  if (cells.length !== 5 || !HAN.test(cells[0])) {
   throw new Error(`${file}: unexpected character row: ${line.slice(0, 80)}`);
  }
  if (!group)
   throw new Error(`${file}: character row before a group heading in ${radical.radical}`);
  const [hanzi, ...otherForms] = cells[0].split(/[/・]/u).map((form) => form.trim());
  group.characters.push({
   hanzi,
   otherForms,
   pinyin: cleanInline(cells[1]),
   hanViet: cleanInline(cells[2]),
   components: cleanInline(cells[3]),
   explanation: cleanInline(cells[4]),
  });
 }
}

const characterCount = radicals
 .flatMap((radical) => radical.groups)
 .reduce((sum, group) => sum + group.characters.length, 0);
for (const radical of radicals) {
 if (radical.groups.length === 0 || radical.groups.some((group) => group.characters.length === 0)) {
  throw new Error(`Radical ${radical.order} ${radical.radical} has an empty character group`);
 }
}
const forms = [
 ...new Set(
  radicals
   .flatMap((radical) => radical.groups)
   .flatMap((group) => group.characters)
   .flatMap((character) => [character.hanzi, ...character.otherForms]),
 ),
];

const outputs = [
 ["radical-characters.json", { radicals }, 1],
 // Membership list shipped with every vocabulary surface; details load on demand.
 ["radical-character-forms.json", { forms: forms.join("") }, 0],
];

// `--check` fails when the notes were edited without regenerating the JSON.
if (process.argv.includes("--check")) {
 const stale = outputs
  .filter(([file, content]) => {
   const current = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), "utf8"));
   return JSON.stringify(current) !== JSON.stringify(content);
  })
  .map(([file]) => file);
 if (stale.length > 0) {
  console.error(
   `Stale radical data (${stale.join(", ")}): run "npm run content:radical-characters".`,
  );
  process.exit(1);
 }
} else {
 for (const [file, content, indent] of outputs) {
  fs.writeFileSync(
   path.join(OUTPUT_DIR, file),
   `${JSON.stringify(content, null, indent || undefined)}\n`,
  );
 }
}
console.log(
 `radical characters: ${radicals.length} radicals, ${characterCount} rows, ${forms.length} forms`,
);
