import { z } from "zod";

export const readerSpeechProgressSchema = z.strictObject({
 progress: z.number().min(0).max(1),
 charIndex: z.number().int().nonnegative().optional(),
});

export const readerSpeechInputSchema = z.strictObject({
 segmentId: z.string().min(1),
 text: z.string().min(1),
 startOffset: z.number().int().nonnegative(),
 rate: z.number().positive(),
 onProgress: z
  .function({
   input: z.tuple([readerSpeechProgressSchema]),
   output: z.void(),
  })
  .optional(),
});

export const readerSpeechResultSchema = z
 .strictObject({
  completed: z.boolean(),
  cancelled: z.boolean(),
 })
 .refine((result) => result.completed !== result.cancelled, {
  message: "Speech must finish as completed or cancelled",
 });

// Resolve when playback completes or is cancelled; failures reject.
// Validate service functions once rather than recreating them on progress ticks.
export const readerSpeechServiceSchema = z.strictObject({
 speak: z.function({
  input: z.tuple([readerSpeechInputSchema]),
  output: z.promise(readerSpeechResultSchema),
 }),
 stop: z.function({ input: z.tuple([]), output: z.void() }),
 pause: z.function({ input: z.tuple([]), output: z.void() }).optional(),
 resume: z.function({ input: z.tuple([]), output: z.void() }).optional(),
 setRate: z.function({ input: z.tuple([z.number().positive()]), output: z.void() }).optional(),
});

export type ReaderSpeechService = z.output<typeof readerSpeechServiceSchema>;
