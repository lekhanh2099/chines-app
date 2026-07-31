import type { JsonFieldValue } from "@/types/json";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Communicate, listVoices } from "edge-tts-ts";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 10_000;
const supportedRates = [0.75, 0.9, 1, 1.1, 1.25];
const ttsSchema = z.object({
 text: z
  .string()
  .trim()
  .min(1, "Text không được để trống")
  .max(MAX_TEXT_LENGTH, `Tối đa ${MAX_TEXT_LENGTH} ký tự`),
 voice: z.string().trim().min(1).max(100),
 rate: z.number().refine((rate) => supportedRates.includes(rate), "Tốc độ đọc không hợp lệ"),
});

async function getAuthenticatedUser() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 return user;
}

async function getMandarinVoices() {
 const voices = await listVoices();
 return voices.filter((voice) => voice.Locale.toLowerCase() === "zh-cn");
}

function formatRate(rate: number) {
 const percentage = Math.round((rate - 1) * 100);
 return `${percentage >= 0 ? "+" : ""}${percentage}%`;
}

export async function GET() {
 const user = await getAuthenticatedUser();
 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
  const voices = await getMandarinVoices();
  return NextResponse.json(
   voices.map((voice) => ({
    name: voice.FriendlyName,
    shortName: voice.ShortName,
    gender: voice.Gender,
    locale: voice.Locale,
   })),
   { headers: { "Cache-Control": "private, no-store" } },
  );
 } catch (error) {
  const message = error instanceof Error ? error.message : "Không tải được danh sách giọng đọc";
  logger.error("[TTS] Edge voice list error:", message);
  return NextResponse.json({ error: "Không tải được danh sách giọng đọc" }, { status: 502 });
 }
}

export async function POST(request: NextRequest) {
 const user = await getAuthenticatedUser();
 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 const payload: JsonFieldValue = await request.json();
 const parsed = ttsSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json(
   { error: "Payload không hợp lệ", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 const { text, voice, rate } = parsed.data;

 try {
  const voices = await getMandarinVoices();
  if (!voices.some((candidate) => candidate.ShortName === voice)) {
   return NextResponse.json({ error: "Giọng Mandarin không hợp lệ" }, { status: 400 });
  }

  const communication = new Communicate(text, {
   voice,
   rate: formatRate(rate),
  });
  const chunks: Uint8Array[] = [];
  for await (const chunk of communication.stream()) {
   if (chunk.type === "audio") chunks.push(chunk.data);
  }
  if (chunks.length === 0) throw new Error("Edge TTS returned no audio");
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
   status: 200,
   headers: {
    "Content-Type": "audio/mpeg",
    "Content-Length": String(buffer.length),
    "Cache-Control": "private, no-store",
   },
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "TTS generation failed";
  logger.error("[TTS] Edge synthesis error:", message);
  return NextResponse.json({ error: "Không thể tạo audio" }, { status: 502 });
 }
}
