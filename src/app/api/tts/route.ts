import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily – Chinese-capable
const MAX_TEXT_LENGTH = 500;

const ttsSchema = z.object({
 text: z
  .string()
  .trim()
  .min(1, "Text không được để trống")
  .max(MAX_TEXT_LENGTH, `Tối đa ${MAX_TEXT_LENGTH} ký tự`),
 voice: z.string().trim().max(100).optional(),
});

export async function POST(request: NextRequest) {
 const supabase = await createClient();

 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const apiKey = process.env.ELEVENLABS_API_KEY;
 if (!apiKey) {
  return NextResponse.json(
   { error: "TTS service not configured" },
   { status: 503 },
  );
 }

 const payload: unknown = await request.json();
 const parsed = ttsSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json(
   { error: "Payload không hợp lệ", issues: parsed.error.flatten() },
   { status: 400 },
  );
 }

 const { text, voice } = parsed.data;

 try {
  const client = new ElevenLabsClient({ apiKey });

  const audioStream = await client.textToSpeech.convert(
   voice || DEFAULT_VOICE_ID,
   {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
    voiceSettings: {
     stability: 0.5,
     similarityBoost: 0.75,
     style: 0.4,
    },
   },
  );

  // Collect ReadableStream into buffer
  const reader = audioStream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
   const { done, value } = await reader.read();
   if (done) break;
   if (value) chunks.push(value);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
   status: 200,
   headers: {
    "Content-Type": "audio/mpeg",
    "Content-Length": String(buffer.length),
    "Cache-Control": "public, max-age=86400, immutable",
   },
  });
 } catch (error) {
  const message =
   error instanceof Error ? error.message : "TTS generation failed";

  console.error("[TTS] ElevenLabs error:", message);

  return NextResponse.json({ error: message }, { status: 502 });
 }
}
