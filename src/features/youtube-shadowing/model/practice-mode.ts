import { z } from "zod";

export const practiceModeSchema = z.enum(["shadowing", "dictation"]);
export type PracticeMode = z.infer<typeof practiceModeSchema>;

export function parsePracticeMode(raw: string): PracticeMode {
 const parsed = practiceModeSchema.safeParse(raw);
 return parsed.success ? parsed.data : practiceModeSchema.enum.shadowing;
}
