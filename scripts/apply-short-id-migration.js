/**
 * Apply the short_id migration to your hosted Supabase instance.
 *
 * Usage:
 *   node scripts/apply-short-id-migration.js
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (not the anon key).
 * The anon key won't have permission to ALTER TABLE.
 *
 * Alternatively, copy the SQL from:
 *   supabase/migrations/20260310000013_notes_short_id.sql
 * and run it in the Supabase Dashboard → SQL Editor.
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
   "The anon key cannot run DDL statements.\n\n" +
   "Option 1: Add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run.\n" +
   "Option 2: Copy the SQL from supabase/migrations/20260310000013_notes_short_id.sql\n" +
   "           and paste it into the Supabase Dashboard → SQL Editor → Run.",
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
  "20260310000013_notes_short_id.sql",
 );
 const sql = fs.readFileSync(sqlPath, "utf-8");

 console.log("Applying short_id migration...");
 const { error } = await supabase.rpc("exec_sql", { query: sql });

 if (error) {
  console.error("Migration failed via RPC. Error:", error.message);
  console.log(
   "\nPlease run the SQL manually in the Supabase Dashboard → SQL Editor.",
  );
  console.log("File:", sqlPath);
  process.exit(1);
 }

 console.log("✅ Migration applied successfully!");

 // Verify
 const { data, error: verifyError } = await supabase
  .from("notes")
  .select("id, short_id")
  .not("short_id", "is", null)
  .limit(3);

 if (verifyError) {
  console.log("Could not verify, but migration may still be applied.");
 } else {
  console.log(`Verified: ${data.length} notes have short_id values.`);
  data.forEach((n) => console.log(`  ${n.id} → ${n.short_id}`));
 }
}

run();
