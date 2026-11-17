import type { JsonFieldValue } from "@/types/json";
import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { radicalRowSchema } from "./supabase-content-row.schemas";
import { radicalRowToViewModel } from "./supabase-hanzihome-content-utils";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type SupabaseOperationError = z.infer<z.ZodObject<{ message: z.ZodString }>>;

export async function requireRows<T>(
 operation: string,
 promise: PromiseLike<{
  data: JsonFieldValue;
  error: Nullable<SupabaseOperationError>;
 }>,
 schema: z.ZodType<T>,
) {
 const result = await promise;
 if (result.error) {
  throw new Error(`HanziHome Supabase ${operation} failed: ${result.error.message}`);
 }
 return schema.parse(result.data);
}

export async function getRadicalsFromDatabase(): Promise<StaticRadicalData[]> {
 const client = await createClient();
 const result = await client
  .from("hanzihome_radicals")
  .select(
   "id,radical_index,radical,name_vi,strokes,core_meaning,variants,related_components,recognition,distinguish,groups,updated_at",
  )
  .eq("source", "seed")
  .is("deleted_at", null)
  .order("radical_index");

 if (result.error) {
  throw new Error(`HanziHome Supabase radicals failed: ${result.error.message}`);
 }

 const rows = z.array(radicalRowSchema).parse(result.data);
 if (rows.length === 0) {
  throw new Error("HanziHome Supabase radicals returned no seed rows.");
 }

 return rows.map(radicalRowToViewModel);
}
