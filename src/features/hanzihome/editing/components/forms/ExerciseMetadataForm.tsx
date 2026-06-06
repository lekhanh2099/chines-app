import { exerciseMetadataEditAdapter } from "../../adapters/exerciseMetadataEditAdapter";
import { createNodeForm } from "./createNodeForm";

export const ExerciseMetadataForm = createNodeForm(exerciseMetadataEditAdapter);
