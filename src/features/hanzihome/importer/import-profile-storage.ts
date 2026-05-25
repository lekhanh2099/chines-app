import {
 parseProfileSchema,
 type ParseProfile,
} from "@/features/hanzihome/importer/importer.types";
import { defaultImportProfiles } from "@/features/hanzihome/importer/parse-profiles/default-profiles";

export const importProfileStorageKey = "hanzihome:import-profiles:v1";

export type ImportProfileStorageResult = {
 profiles: ParseProfile[];
 warnings: string[];
};

function canUseLocalStorage() {
 return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadCustomImportProfiles(): ImportProfileStorageResult {
 if (!canUseLocalStorage()) {
  return { profiles: [], warnings: [] };
 }

 const raw = window.localStorage.getItem(importProfileStorageKey);
 if (!raw) return { profiles: [], warnings: [] };

 try {
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
   return {
    profiles: [],
    warnings: ["Custom import profile storage is not an array."],
   };
  }

  const profiles: ParseProfile[] = [];
  const warnings: string[] = [];

  parsed.forEach((item, index) => {
   const result = parseProfileSchema.safeParse(item);

   if (result.success) {
    profiles.push(result.data);
   } else {
    warnings.push(`Custom import profile ${index + 1} is invalid.`);
   }
  });

  return { profiles, warnings };
 } catch {
  return {
   profiles: [],
   warnings: ["Custom import profile storage could not be parsed."],
  };
 }
}

export function saveCustomImportProfiles(profiles: ParseProfile[]) {
 const parsedProfiles = profiles.map((profile) =>
  parseProfileSchema.parse(profile),
 );

 if (!canUseLocalStorage()) return;

 window.localStorage.setItem(
  importProfileStorageKey,
  JSON.stringify(parsedProfiles),
 );
}

export function getAvailableImportProfiles(): ImportProfileStorageResult {
 const custom = loadCustomImportProfiles();

 return {
  profiles: [...defaultImportProfiles, ...custom.profiles],
  warnings: custom.warnings,
 };
}
