import { z } from "zod";
import { JsonObjectSchema } from "@/types/json";
import { readerDocumentRowSchema } from "./reading-resource.schemas";

export const readerAssetRowSchema = z.strictObject({
 id: z.string().min(1),
 document_id: z.string().min(1).nullable(),
 source: readerDocumentRowSchema.shape.source,
 asset_type: z.enum(["pdf", "audio", "image", "other"]),
 source_path: z.string().min(1),
 sha256: z.string().regex(/^[0-9a-f]{64}$/u),
 storage_bucket: z.string().min(1).nullable(),
 storage_path: z.string().min(1).nullable(),
 external_url: z
  .string()
  .regex(/^(?:https?:\/\/|\/)/u)
  .nullable(),
 mime_type: z.string().min(1).nullable(),
 rights_status: z.enum(["public-domain", "original", "licensed", "unknown", "blocked"]),
 redistribution_allowed: z.boolean(),
 metadata: JsonObjectSchema,
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export type ReaderAssetRow = z.output<typeof readerAssetRowSchema>;

export type ReaderPdfAsset = {
 id: string;
 title: string;
 resourceFile: string;
 pdfPage: number;
 printedPage: number;
 imageSrc: string;
};
