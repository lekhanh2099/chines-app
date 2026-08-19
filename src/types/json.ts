import { z } from "zod";

import { jsonValueSchema } from "@/lib/json-schema";
import type { Json } from "@/types/supabase.generated";

export const JsonValueSchema = jsonValueSchema;
export const JsonObjectSchema: z.ZodType<JsonObject> = z.record(z.string(), JsonValueSchema);

export type JsonValue = Json;
export type JsonObject = Exclude<Extract<Json, object>, Json[]>;
export type JsonFieldValue = JsonObject[string];
