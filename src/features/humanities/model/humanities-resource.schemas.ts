import { z } from "zod";

import { readerDocumentResponseSchema } from "@/features/reading/model/reading-document.schemas";
import { parsedHumanitiesExerciseItemRowSchema } from "./humanities-exercise.schemas";

export const humanitiesDocumentResponseSchema = readerDocumentResponseSchema.extend({
 exerciseItems: z.array(parsedHumanitiesExerciseItemRowSchema),
});

export type HumanitiesDocumentResource = z.output<typeof humanitiesDocumentResponseSchema>;
