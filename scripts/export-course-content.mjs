// Read-only export of the database-backed course content to JSON files, one file
// per table. It is the source for converting the course to bundled textbook
// content and the backup taken before the vocabulary child tables are dropped.
//
// Run: npm run content:export-course -- <output-directory>
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const TABLES = [
 ["hanzihome_courses", "id"],
 ["hanzihome_course_books", "id"],
 ["hanzihome_lessons", "id"],
 ["hanzihome_lesson_texts", "id"],
 ["hanzihome_lesson_sections", "id"],
 ["hanzihome_vocab_items", "id"],
 ["hanzihome_vocab_examples", "id"],
 ["hanzihome_vocab_detail_sections", "id"],
 ["hanzihome_grammar_points", "id"],
 ["hanzihome_grammar_examples", "id"],
 ["hanzihome_grammar_detail_sections", "id"],
 ["hanzihome_listening_items", "id"],
 ["hanzihome_listening_audio", "id"],
];
const PAGE_SIZE = 1000;

const [outputDirectory] = process.argv.slice(2);
if (!outputDirectory) {
 throw new Error("Usage: npm run content:export-course -- <output-directory>");
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !secret) {
 throw new Error(
  "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY",
 );
}

const client = createClient(supabaseUrl, secret, {
 auth: { autoRefreshToken: false, persistSession: false },
});
fs.mkdirSync(outputDirectory, { recursive: true });

const summary = {};
for (const [table, orderColumn] of TABLES) {
 const rows = [];
 for (let from = 0; ; from += PAGE_SIZE) {
  const { data, error } = await client
   .from(table)
   .select("*")
   .order(orderColumn)
   .range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`${table}: ${error.message}`);
  rows.push(...data);
  if (data.length < PAGE_SIZE) break;
 }
 const file = path.join(outputDirectory, `${table}.json`);
 fs.writeFileSync(file, `${JSON.stringify(rows)}\n`);
 summary[table] = { rows: rows.length, bytes: fs.statSync(file).size };
 console.log(`${table}: ${rows.length} rows`);
}
fs.writeFileSync(
 path.join(outputDirectory, "export-summary.json"),
 `${JSON.stringify({ exportedAt: new Date().toISOString(), project: new URL(supabaseUrl).host, tables: summary }, null, 1)}\n`,
);
console.log(`Exported to ${path.resolve(outputDirectory)}`);
