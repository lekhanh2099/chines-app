// Builds the static "explained characters" package from the reviewed notes in
// docs/radicals/01-*.md through 15-*.md. The markdown is the editable source;
// the JSON outputs are generated and must not be edited by hand.
// Run: npm run content:radical-characters
import fs from "node:fs";
import path from "node:path";

const SOURCE_DIR = path.resolve("docs/radicals");
const OUTPUT_DIR = path.resolve("src/features/hanzihome/static-json");
const EXPECTED_RADICAL_COUNT = 228;
const EXPECTED_NOTE_FILE_COUNT = 15;
const RADICAL_NOTE_FILE_PATTERN = /^(?:0[1-9]|1[0-5])-.*\.md$/u;
const HAN = /[㐀-鿿\u{20000}-\u{2ffff}]/u;

const cleanInline = (value) =>
 value
  .replace(/`([^`]*)`/gu, "$1")
  .replace(/\*\*([^*]+)\*\*/gu, "$1")
  .replace(/(^|[^\p{L}\p{N}])_([^_]+)_(?=$|[^\p{L}\p{N}])/gu, "$1$2")
  .replace(/\s+/gu, " ")
  .trim();

const parseTableCells = (line) =>
 line
  .trim()
  .replace(/^\||\|$/gu, "")
  .split("|")
  .map((cell) => cell.trim());

// README section 4 is the single reviewed mapping from each note to its hanzihome_radicals row.
function loadRadicalIdByOrder() {
 const radicalIdByOrder = new Map();
 let inMappingSection = false;

 for (const line of fs.readFileSync(path.join(SOURCE_DIR, "README.md"), "utf8").split("\n")) {
  if (/^## 4\./u.test(line)) {
   inMappingSection = true;
   continue;
  }
  if (inMappingSection && /^## \d+\./u.test(line)) break;
  if (!inMappingSection) continue;

  const row = /^\|\s*(\d{2,3})\s*\|\s*[A-E]\s*\|/u.exec(line);
  if (!row) continue;

  const order = Number(row[1]);
  if (radicalIdByOrder.has(order)) {
   throw new Error(`README mapping table has duplicate radical order ${order}`);
  }
  const cells = parseTableCells(line);
  const radicalId = /`(radical-\d{3})`/u.exec(cells[5] ?? "")?.[1] ?? "";
  radicalIdByOrder.set(order, radicalId);
 }

 if (radicalIdByOrder.size !== EXPECTED_RADICAL_COUNT) {
  throw new Error(
   `README mapping table has ${radicalIdByOrder.size} rows, expected ${EXPECTED_RADICAL_COUNT}`,
  );
 }

 for (const [index, order] of [...radicalIdByOrder.keys()].entries()) {
  if (order !== index + 1) {
   throw new Error(
    `README mapping table order mismatch at row ${index + 1}: got ${order}, expected ${index + 1}`,
   );
  }
 }

 return radicalIdByOrder;
}

function parseRadicalFile(file, radicalIdByOrder) {
 const fileRadicals = [];
 let radical = null;
 let group = null;
 let inCharacterSection = false;

 for (const line of fs.readFileSync(path.join(SOURCE_DIR, file), "utf8").split("\n")) {
  const radicalHeading = /^## Bộ (\d+): (\S+) \((.+)\)\s*$/u.exec(line);
  if (radicalHeading) {
   const order = Number(radicalHeading[1]);
   if (!radicalIdByOrder.has(order)) {
    throw new Error(`${file}: radical order ${order} is missing from README mapping`);
   }
   radical = {
    order,
    radical: radicalHeading[2],
    hanViet: radicalHeading[3],
    radicalId: radicalIdByOrder.get(order) ?? "",
    groups: [],
   };
   fileRadicals.push(radical);
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
  const cells = parseTableCells(line);
  if (cells.length !== 5 || !HAN.test(cells[0])) {
   throw new Error(`${file}: unexpected character row: ${line.slice(0, 80)}`);
  }
  if (!group) {
   throw new Error(`${file}: character row before a group heading in ${radical.radical}`);
  }
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

 return fileRadicals;
}

const radicalIdByOrder = loadRadicalIdByOrder();
const noteFiles = fs
 .readdirSync(SOURCE_DIR)
 .filter((name) => RADICAL_NOTE_FILE_PATTERN.test(name))
 .sort();
if (noteFiles.length !== EXPECTED_NOTE_FILE_COUNT) {
 throw new Error(
  `Found ${noteFiles.length} radical note files, expected ${EXPECTED_NOTE_FILE_COUNT}`,
 );
}

const radicals = noteFiles.flatMap((file) => parseRadicalFile(file, radicalIdByOrder));
if (radicals.length !== EXPECTED_RADICAL_COUNT) {
 throw new Error(`Parsed ${radicals.length} radicals, expected ${EXPECTED_RADICAL_COUNT}`);
}

for (const [index, radical] of radicals.entries()) {
 if (radical.order !== index + 1) {
  throw new Error(
   `Radical sequence mismatch at index ${index + 1}: got ${radical.order} (${radical.radical})`,
  );
 }
 if (radical.groups.length === 0 || radical.groups.some((group) => group.characters.length === 0)) {
  throw new Error(`Radical ${radical.order} ${radical.radical} has an empty character group`);
 }
 const seenHanzi = new Set();
 for (const group of radical.groups) {
  for (const character of group.characters) {
   if (seenHanzi.has(character.hanzi)) {
    throw new Error(`Radical ${radical.order} ${radical.radical} has duplicate ${character.hanzi}`);
   }
   seenHanzi.add(character.hanzi);
  }
 }
}

const characterCount = radicals
 .flatMap((radical) => radical.groups)
 .reduce((sum, group) => sum + group.characters.length, 0);
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
