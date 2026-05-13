/**
 * Apply the vocabulary learning schema migration to the hosted Supabase project.
 *
 * Usage:
 *   node scripts/apply-vocab-learning-migration.js
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. If the project does not
 * expose an exec_sql RPC, paste the migration SQL into Supabase Dashboard.
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
 console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
 process.exit(1);
}

if (!serviceKey) {
 console.error(
  "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
   "The anon key cannot create tables.\n\n" +
   "Option 1: Add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run.\n" +
   "Option 2: Copy the SQL from supabase/migrations/20260312000015_vocab_learning_entries.sql\n" +
   "           and paste it into Supabase Dashboard -> SQL Editor -> Run.",
 );
 process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
 const sqlPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260312000015_vocab_learning_entries.sql",
 );
 const sql = fs.readFileSync(sqlPath, "utf-8");

 console.log("Applying vocabulary learning migration...");
 const { error } = await supabase.rpc("exec_sql", { query: sql });

 if (error) {
  console.error("Migration failed via RPC. Error:", error.message);
  console.log("\nPlease run the SQL manually in Supabase Dashboard -> SQL Editor.");
  console.log("File:", sqlPath);
  process.exit(1);
 }

 const { error: verifyError } = await supabase.from("vocab_courses").select("id").limit(1);
 if (verifyError) {
  console.log("Migration applied, but verification failed:", verifyError.message);
  return;
 }

 console.log("Vocabulary learning migration applied successfully.");
}

run();
