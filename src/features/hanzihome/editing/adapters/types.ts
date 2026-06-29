export type EditFieldKind = "text" | "textarea" | "string-list" | "number" | "boolean" | "json";

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
 toValues: (value: unknown) => Record<string, string>;
 toNode: (original: unknown, values: Record<string, string>) => unknown;
};
