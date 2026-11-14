import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

export const EditFieldKindSchema = z.enum([
 "text",
 "textarea",
 "string-list",
 "number",
 "boolean",
 "json",
]);
export type EditFieldKind = z.infer<typeof EditFieldKindSchema>;

export type EditFieldDefinition = {
 key: string;
 label: string;
 group?: string;
 kind?: EditFieldKind;
 description?: string;
 required?: boolean;
 defaultVisible?: boolean;
};

export type EditAdapter = {
 fields: EditFieldDefinition[];
 toValues: (value: JsonFieldValue) => Record<string, string>;
 toNode: (original: JsonFieldValue, values: Record<string, string>) => JsonFieldValue;
};
