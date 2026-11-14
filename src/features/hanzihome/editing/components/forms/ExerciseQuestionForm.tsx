import { exerciseQuestionEditAdapter } from "../../adapters/exerciseQuestionEditAdapter";
import { createNodeForm } from "./createNodeForm";

export const ExerciseQuestionForm = createNodeForm(exerciseQuestionEditAdapter);
