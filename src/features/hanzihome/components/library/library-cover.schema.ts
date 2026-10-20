import { z } from "zod";

export const libraryCollectionIdSchema = z
 .string()
 .regex(
  /^(?:group:(?:hanyu|boya|boyaSecondEdition|listening|other)|static:(?:business-chinese-tm2|business-chinese-tm3|nhip-cau|doc-hieu|khau-ngu))$/,
 );
const coverUrlSchema = z
 .string()
 .max(2048)
 .regex(/^https?:\/\/[^\s/?#]+[^\s]*$/i);

export const libraryCoverSchema = z.object({
 collectionId: libraryCollectionIdSchema,
 coverUrl: coverUrlSchema,
 createdAt: z.iso.datetime({ offset: true }),
 updatedAt: z.iso.datetime({ offset: true }),
});
export const libraryCoversResponseSchema = z.object({ items: z.array(libraryCoverSchema) });
export const libraryCoverResponseSchema = z.object({ item: libraryCoverSchema });
export const resetLibraryCoverResponseSchema = z.object({
 collectionId: libraryCollectionIdSchema,
 reset: z.literal(true),
});
export const saveLibraryCoverPayloadSchema = z.strictObject({
 coverUrl: z
  .string()
  .trim()
  .pipe(coverUrlSchema)
  .pipe(z.url({ protocol: /^https?$/ })),
 expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
 reason: z.string().trim().min(1).default("Update HanziHome library cover"),
});
export const resetLibraryCoverPayloadSchema = z.strictObject({
 expectedUpdatedAt: z.iso.datetime({ offset: true }),
 reason: z.string().trim().min(1).default("Reset HanziHome library cover"),
});

export type LibraryCover = z.infer<typeof libraryCoverSchema>;
export type SaveLibraryCoverPayload = z.input<typeof saveLibraryCoverPayloadSchema>;
export type ResetLibraryCoverPayload = z.input<typeof resetLibraryCoverPayloadSchema>;
