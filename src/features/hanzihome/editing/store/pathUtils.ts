import type { DraftPatchPath } from "./types";

type ObjectValue = { [key: string]: unknown };

function isObjectValue(value: unknown): value is ObjectValue {
 return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getValueAtPath(root: unknown, path: DraftPatchPath): unknown {
 let current = root;

 for (const segment of path) {
  if (typeof segment === "number") {
   if (!Array.isArray(current) || segment < 0 || segment >= current.length) {
    return undefined;
   }
   current = current[segment];
   continue;
  }

  if (!isObjectValue(current) || !(segment in current)) return undefined;
  current = current[segment];
 }

 return current;
}

export function setValueAtPath(root: unknown, path: DraftPatchPath, value: unknown): boolean {
 if (path.length === 0) return false;

 const parent = getValueAtPath(root, path.slice(0, -1));
 const key = path.at(-1);

 if (typeof key === "number") {
  if (!Array.isArray(parent) || key < 0 || key >= parent.length) return false;
  parent[key] = value;
  return true;
 }

 if (typeof key === "string" && isObjectValue(parent) && key in parent) {
  parent[key] = value;
  return true;
 }

 return false;
}

export function createValueAtPath(root: unknown, path: DraftPatchPath, value: unknown): boolean {
 const target = getValueAtPath(root, path);
 if (!Array.isArray(target)) return false;
 target.push(value);
 return true;
}

export function deleteValueAtPath(root: unknown, path: DraftPatchPath): boolean {
 if (path.length === 0) return false;
 const parent = getValueAtPath(root, path.slice(0, -1));
 const key = path.at(-1);

 if (typeof key === "number" && Array.isArray(parent)) {
  if (key < 0 || key >= parent.length) return false;
  parent.splice(key, 1);
  return true;
 }

 if (typeof key === "string" && isObjectValue(parent) && key in parent) {
  delete parent[key];
  return true;
 }

 return false;
}

export function reorderValueAtPath(root: unknown, path: DraftPatchPath, order: unknown): boolean {
 const target = getValueAtPath(root, path);
 if (!Array.isArray(target) || !Array.isArray(order)) return false;
 target.splice(0, target.length, ...order);
 return true;
}
