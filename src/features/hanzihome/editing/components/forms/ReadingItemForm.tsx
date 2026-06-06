import { readingEditAdapter } from "../../adapters/readingEditAdapter";
import { createNodeForm } from "./createNodeForm";

export const ReadingItemForm = createNodeForm(readingEditAdapter);
