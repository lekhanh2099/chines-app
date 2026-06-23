import { z } from "zod";

import type { EditAdapter, EditFieldDefinition, EditFieldKind } from "./types";

type NestedPath = Array<string | number>;

type NestedField = EditFieldDefinition & {
 path: NestedPath;
 sourceValue: unknown;
};

type NestedEditAdapterOptions<T> = {
 schema: z.ZodType<T>;
 labelForPath: (path: NestedPath) => string;
 groupForPath: (path: NestedPath) => string | undefined;
 kindForPath?: (path: NestedPath, value: unknown, inferredKind: EditFieldKind) => EditFieldKind;
 requiredForPath?: (path: NestedPath, value: unknown) => boolean;
 skipKeys?: ReadonlySet<string>;
};

const defaultSkippedKeys = new Set([
 "id",
 "type",
 "order",
 "runtimeId",
 "lessonId",
 "updatedAt",
 "editMeta",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
 return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fieldKind(value: unknown): EditFieldKind | null {
 if (typeof value === "boolean") return "boolean";
 if (typeof value === "number") return "number";
 if (typeof value === "string" || value === null || value === undefined) return "text";
 if (Array.isArray(value) && value.every((item) => typeof item !== "object" || item === null)) {
  return "string-list";
 }
 return null;
}

function collectFields(
 value: unknown,
 path: NestedPath,
 options: Pick<
  NestedEditAdapterOptions<unknown>,
  "groupForPath" | "kindForPath" | "labelForPath" | "requiredForPath"
 >,
 skipKeys: ReadonlySet<string>,
 output: NestedField[],
) {
 const kind = fieldKind(value);
 if (kind) {
  const resolvedKind = options.kindForPath?.(path, value, kind) ?? kind;
  output.push({
   key: `field_${output.length}`,
   label: options.labelForPath(path),
   group: options.groupForPath(path),
   kind: resolvedKind,
   required: options.requiredForPath?.(path, value),
   path,
   sourceValue: value,
  });
  return;
 }

 if (Array.isArray(value)) {
  value.forEach((item, index) => collectFields(item, [...path, index], options, skipKeys, output));
  return;
 }

 if (!isRecord(value)) return;

 Object.entries(value).forEach(([key, child]) => {
  if (skipKeys.has(key)) return;
  collectFields(child, [...path, key], options, skipKeys, output);
 });
}

function valueAtPath(value: unknown, path: NestedPath): unknown {
 return path.reduce<unknown>((current, segment) => {
  if (typeof segment === "number") {
   return Array.isArray(current) ? current[segment] : undefined;
  }
  return isRecord(current) ? current[segment] : undefined;
 }, value);
}

function setValueAtPath(target: unknown, path: NestedPath, nextValue: unknown) {
 let current = target;

 for (let index = 0; index < path.length - 1; index += 1) {
  const segment = path[index];
  current =
   typeof segment === "number"
    ? Array.isArray(current)
      ? current[segment]
      : undefined
    : isRecord(current)
      ? current[segment]
      : undefined;
  if (current === undefined) return;
 }

 const last = path.at(-1);
 if (typeof last === "number" && Array.isArray(current)) {
  current[last] = nextValue;
 } else if (typeof last === "string" && isRecord(current)) {
  current[last] = nextValue;
 }
}

function valueToString(value: unknown, kind: EditFieldKind) {
 if (kind === "string-list") {
  return Array.isArray(value) ? value.map(String).join("\n") : "";
 }
 if (kind === "boolean") return value === true ? "true" : "false";
 return value === null || value === undefined ? "" : String(value);
}

function stringToValue(value: string, kind: EditFieldKind, sourceValue: unknown) {
 if (kind === "boolean") return value === "true";
 if (kind === "number") {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : sourceValue;
 }
 if (kind === "string-list") {
  const lines = value
   .split("\n")
   .map((item) => item.trim())
   .filter(Boolean);
  const firstSourceItem = Array.isArray(sourceValue) ? sourceValue[0] : undefined;
  if (typeof firstSourceItem === "number") {
   return lines.map(Number).filter(Number.isFinite);
  }
  if (typeof firstSourceItem === "boolean") {
   return lines.map((item) => item === "true");
  }
  return lines;
 }
 return value;
}

export function createNestedEditAdapter<T>({
 schema,
 labelForPath,
 groupForPath,
 kindForPath,
 requiredForPath,
 skipKeys = defaultSkippedKeys,
}: NestedEditAdapterOptions<T>): EditAdapter {
 let fields: NestedField[] = [];

 return {
  get fields() {
   return fields;
  },
  toValues(value) {
   schema.parse(value);
   fields = [];
   collectFields(
    value,
    [],
    { labelForPath, groupForPath, kindForPath, requiredForPath },
    skipKeys,
    fields,
   );
   return Object.fromEntries(
    fields.map((field) => [
     field.key,
     valueToString(valueAtPath(value, field.path), field.kind ?? "text"),
    ]),
   );
  },
  toNode(original, values) {
   schema.parse(original);
   const output = structuredClone(original);

   fields.forEach((field) => {
    const kind = field.kind ?? "text";
    setValueAtPath(
     output,
     field.path,
     stringToValue(values[field.key] ?? "", kind, field.sourceValue),
    );
   });

   schema.parse(output);
   return output;
  },
 };
}
