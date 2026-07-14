import "server-only";

import { z } from "zod";

const serverSecretsSchema = z.object({
 SUPABASE_SECRET_KEY: z.string().min(1).optional(),
 SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export function getSupabaseServerSecret(): string {
 const parsed = serverSecretsSchema
  .refine((value) => value.SUPABASE_SECRET_KEY || value.SUPABASE_SERVICE_ROLE_KEY, {
   message: "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
   path: ["SUPABASE_SECRET_KEY"],
  })
  .parse({
   SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
   SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

 return parsed.SUPABASE_SECRET_KEY ?? parsed.SUPABASE_SERVICE_ROLE_KEY!;
}
