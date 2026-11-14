import { z } from "zod";

import {
 readerExerciseGroupRowSchema,
 parsedReaderExerciseItemRowSchema,
} from "./reading-exercise.schemas";
import { readerAssetRowSchema } from "@/features/reading/model/reading-assets.schemas";
import {
 readerDocumentRowSchema,
 readerParagraphRowSchema,
 readerVocabularyRowSchema,
 readerVocabularyLinkRowSchema,
} from "@/features/reading/model/reading-resource.schemas";

export const readerDocumentResponseSchema = z.strictObject({
 document: readerDocumentRowSchema,
 paragraphs: z.array(readerParagraphRowSchema),
 vocabularyLinks: z.array(readerVocabularyLinkRowSchema),
 vocabulary: z.array(readerVocabularyRowSchema),
 exerciseGroups: z.array(readerExerciseGroupRowSchema),
 exerciseItems: z.array(parsedReaderExerciseItemRowSchema),
 assets: z.array(readerAssetRowSchema),
});

export type ReaderDocumentResource = z.output<typeof readerDocumentResponseSchema>;
