import { z } from "zod";

export const ErrorLikeSchema = z.object({
 code: z.string().optional().default(""),
 message: z.string().optional().default(""),
 name: z.string().optional().default(""),
});

export type ErrorInput = Parameters<typeof ErrorLikeSchema.safeParse>[0];

export class DictionarySrsQueuedError extends Error {
 constructor() {
  super("DICTIONARY_SRS_QUEUED");
 }
}

export function parseErrorLike(error: ErrorInput) {
 const parsed = ErrorLikeSchema.safeParse(error);
 return parsed.success ? parsed.data : { code: "", message: "", name: "" };
}
