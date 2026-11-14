import { z } from "zod";

export function decodeJson<Schema extends z.ZodType>(
 raw: string,
 schema: Schema,
): z.output<Schema> | null {
 try {
  const parsed = schema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}

export function encodeJson<Schema extends z.ZodType>(
 value: z.input<Schema>,
 schema: Schema,
): string | null {
 const parsed = schema.safeParse(value);
 if (!parsed.success) return null;

 try {
  return JSON.stringify(parsed.data);
 } catch {
  return null;
 }
}
