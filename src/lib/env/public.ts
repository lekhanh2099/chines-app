import { z } from "zod";

const publicSupabaseEnvSchema = z.object({
 NEXT_PUBLIC_SUPABASE_URL: z.url(),
 key: z.string().min(1),
});

const publicSupabaseProcessEnvSchema = z
 .object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
 })
 .refine(
  (value) => value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || value.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
   message: "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
   path: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  },
 )
 .transform((value) => ({
  NEXT_PUBLIC_SUPABASE_URL: value.NEXT_PUBLIC_SUPABASE_URL,
  key: value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? value.NEXT_PUBLIC_SUPABASE_ANON_KEY,
 }))
 .pipe(publicSupabaseEnvSchema);

const parsedPublicSupabaseEnv = publicSupabaseProcessEnvSchema.parse({
 NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const publicSupabaseEnv = {
 url: parsedPublicSupabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
 key: parsedPublicSupabaseEnv.key,
};
