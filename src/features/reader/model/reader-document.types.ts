import type { z } from "zod";
import type {
 readerCapabilitySchema,
 readerSegmentSchema,
 readerSectionSchema,
 readerMetadataSchema,
 readerDocumentSchema,
} from "./reader.schemas";
export type ReaderContentCapability = z.output<typeof readerCapabilitySchema>;
export type ReaderSegment = z.output<typeof readerSegmentSchema>;
export type ReaderSection = z.output<typeof readerSectionSchema>;
export type ReaderMetadataItem = z.output<typeof readerMetadataSchema>;
export type ReaderDocumentModel = z.output<typeof readerDocumentSchema>;
