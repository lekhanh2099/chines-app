import { readingQuestionEditAdapter } from "../../adapters/readingQuestionEditAdapter";
import { createNodeForm } from "./createNodeForm";

export const ReadingQuestionForm = createNodeForm(readingQuestionEditAdapter);
