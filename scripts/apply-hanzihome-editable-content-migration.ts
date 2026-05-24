import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const migrationFileName = "20260524000100_create_hanzihome_editable_content.sql";

type MigrationDatabase = {
  public: {
    Tables: {
      hanzihome_courses: {
        Row: { id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      hanzihome_course_books: {
        Row: { id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      hanzihome_lessons: {
        Row: { id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      hanzihome_vocab_items: {
        Row: { id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      hanzihome_grammar_points: {
        Row: { id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      exec_sql: {
        Args: { query: string };
        Returns: unknown;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

type MigrationSupabaseClient = SupabaseClient<MigrationDatabase>;

async function readMigrationSql() {
  const scriptPath = fileURLToPath(import.meta.url);
  const migrationPath = path.join(
    path.dirname(scriptPath),
    "..",
    "supabase",
    "migrations",
    migrationFileName,
  );

  return readFile(migrationPath, "utf8");
}

async function verifyTable(
  supabase: MigrationSupabaseClient,
  table:
    | "hanzihome_courses"
    | "hanzihome_course_books"
    | "hanzihome_lessons"
    | "hanzihome_vocab_items"
    | "hanzihome_grammar_points",
) {
  const { error } = await supabase.from(table).select("id").limit(1);

  if (error) {
    throw new Error(`Verification failed for ${table}: ${error.message}`);
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Add it locally before applying the HanziHome content migration.",
    );
  }

  const supabase = createClient<MigrationDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
  const sql = await readMigrationSql();

  const { error } = await supabase.rpc("exec_sql", { query: sql });

  if (error) {
    throw new Error(
      `Could not apply migration through exec_sql: ${error.message}. If this project does not expose exec_sql, run ${migrationFileName} manually in Supabase Dashboard SQL Editor.`,
    );
  }

  await Promise.all([
    verifyTable(supabase, "hanzihome_courses"),
    verifyTable(supabase, "hanzihome_course_books"),
    verifyTable(supabase, "hanzihome_lessons"),
    verifyTable(supabase, "hanzihome_vocab_items"),
    verifyTable(supabase, "hanzihome_grammar_points"),
  ]);

  console.log(`Applied and verified ${migrationFileName}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
