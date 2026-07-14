import { z } from "zod";

const publicSupabaseEnvSchema = z
 .object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
 })
 .refine(
  (value) => value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || value.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
   message: "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
   path: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  },
 );

const parsedPublicSupabaseEnv = publicSupabaseEnvSchema.parse({
 NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const publicSupabaseEnv = {
 url: parsedPublicSupabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
 key:
  parsedPublicSupabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  parsedPublicSupabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};
