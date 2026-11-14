import { characterWritingEditAdapter } from "../../adapters/characterWritingEditAdapter";
import { createNodeForm } from "./createNodeForm";

export const CharacterWritingForm = createNodeForm(characterWritingEditAdapter);
