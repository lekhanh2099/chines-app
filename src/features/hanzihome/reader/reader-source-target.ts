import { z } from "zod";

export const readerSourceSurfaceSchema = z.enum([
 "reader-selection",
 "reader-highlight",
 "shadowing",
]);

export const readerSourceTargetSchema = z
 .strictObject({
  source: readerSourceSurfaceSchema,
  documentId: z.string().min(1),
  paragraphId: z.string().min(1).optional(),
  startOffset: z.number().int().nonnegative().optional(),
  endOffset: z.number().int().positive().optional(),
 })
 .refine(
  (value) =>
   (value.startOffset === undefined && value.endOffset === undefined) ||
   (value.startOffset !== undefined &&
    value.endOffset !== undefined &&
    value.endOffset > value.startOffset),
  { message: "Reader source range must contain both ordered offsets" },
 );

export type ReaderSourceTarget = z.output<typeof readerSourceTargetSchema>;

export function buildReaderSourceHref(input: ReaderSourceTarget, baseHref = "/reader") {
 const target = readerSourceTargetSchema.parse(input);
 const [pathname, search] = baseHref.split("?");
 const params = new URLSearchParams(search);
 params.set("document", target.documentId);
 params.set("source", target.source);
 if (target.paragraphId) params.set("paragraph", target.paragraphId);
 if (target.startOffset !== undefined) params.set("start", String(target.startOffset));
 if (target.endOffset !== undefined) params.set("end", String(target.endOffset));
 return `${pathname}?${params.toString()}`;
}

function parseOptionalOffset(value: string | null) {
 if (value === null || value.trim() === "") return undefined;
 const parsed = Number(value);
 return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export function parseReaderSourceTarget(searchParams: URLSearchParams): ReaderSourceTarget | null {
 const source = searchParams.get("source");
 if (!source) return null;
 const parsed = readerSourceTargetSchema.safeParse({
  source,
  documentId: searchParams.get("document"),
  paragraphId: searchParams.get("paragraph") || undefined,
  startOffset: parseOptionalOffset(searchParams.get("start")),
  endOffset: parseOptionalOffset(searchParams.get("end")),
 });
 return parsed.success ? parsed.data : null;
}
