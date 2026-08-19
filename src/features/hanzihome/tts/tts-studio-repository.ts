import "server-only";

import { createClient } from "@/lib/supabase/server";

import { ttsClipRowSchema, ttsFolderRowSchema } from "./tts-studio.schemas";

async function authenticatedClient() {
 const client = await createClient();
 const {
  data: { user },
 } = await client.auth.getUser();
 if (!user) throw new Error("Authentication required");
 return { client, user };
}

export async function listTtsLibrary() {
 const { client, user } = await authenticatedClient();
 const [foldersResult, clipsResult] = await Promise.all([
  client.from("hanzihome_tts_folders").select("*").eq("user_id", user.id).order("name"),
  client
   .from("hanzihome_tts_clips")
   .select("*")
   .eq("user_id", user.id)
   .order("created_at", { ascending: false }),
 ]);
 if (foldersResult.error) throw new Error(foldersResult.error.message);
 if (clipsResult.error) throw new Error(clipsResult.error.message);
 return {
  folders: ttsFolderRowSchema.array().parse(foldersResult.data),
  clips: ttsClipRowSchema.array().parse(clipsResult.data),
 };
}

export async function createTtsFolder(name: string) {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_tts_folders")
  .insert({ user_id: user.id, name })
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return ttsFolderRowSchema.parse(data);
}

export async function saveTtsClip(input: {
 folderId: string | null;
 title: string;
 text: string;
 voice: string;
 rate: number;
 cacheKey: string;
}) {
 const { client, user } = await authenticatedClient();
 const { data, error } = await client
  .from("hanzihome_tts_clips")
  .upsert(
   {
    user_id: user.id,
    folder_id: input.folderId,
    title: input.title,
    text: input.text,
    voice: input.voice,
    rate: input.rate,
    cache_key: input.cacheKey,
   },
   { onConflict: "user_id,cache_key" },
  )
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return ttsClipRowSchema.parse(data);
}
