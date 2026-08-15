import { z } from "zod";

import {
 readerAssetRowSchema,
 readerDocumentRowSchema,
 readerExerciseGroupRowSchema,
 parsedReaderExerciseItemRowSchema,
 readerParagraphRowSchema,
 readerVocabularyRowSchema,
 readerVocabularyLinkRowSchema,
} from "./reader.schemas";

const readerDocumentResponseSchema = z.strictObject({
 document: readerDocumentRowSchema,
 paragraphs: z.array(readerParagraphRowSchema),
 vocabularyLinks: z.array(readerVocabularyLinkRowSchema),
 vocabulary: z.array(readerVocabularyRowSchema),
 exerciseGroups: z.array(readerExerciseGroupRowSchema),
 exerciseItems: z.array(parsedReaderExerciseItemRowSchema),
 assets: z.array(readerAssetRowSchema),
});

export type ReaderDocumentResource = z.output<typeof readerDocumentResponseSchema>;
