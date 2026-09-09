import type { z } from "zod";
import type {
 readerSourceKindSchema,
 readerSegmentKindSchema,
 readerCapabilitySchema,
 readerSourceSchema,
 readerSpeakerSchema,
 readerSegmentSchema,
 readerSectionSchema,
 readerMetadataSchema,
 readerDocumentSchema,
} from "./reader.schemas";

export type ReaderSourceKind = z.output<typeof readerSourceKindSchema>;
export type ReaderSegmentKind = z.output<typeof readerSegmentKindSchema>;
export type ReaderContentCapability = z.output<typeof readerCapabilitySchema>;
export type ReaderDocumentSource = z.output<typeof readerSourceSchema>;
export type ReaderSpeaker = z.output<typeof readerSpeakerSchema>;
export type ReaderSegment = z.output<typeof readerSegmentSchema>;
export type ReaderSection = z.output<typeof readerSectionSchema>;
export type ReaderMetadataItem = z.output<typeof readerMetadataSchema>;
export type ReaderDocumentModel = z.output<typeof readerDocumentSchema>;
