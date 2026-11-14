import { BookOpen, CircleHelp, Languages, LibraryBig, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import type { Badge } from "@/components/ui/display/badge";
import type { AiTaskId } from "@/lib/ai/ai-task-contract";
import type {
 DailyReading,
 DailyReadingEnrichmentModule,
} from "@/features/daily-reading/model/daily-reading.schemas";

export type EnrichmentState = DailyReading["enrichment"][DailyReadingEnrichmentModule];
type EnrichmentStatusKey =
 | "enrichment.status.idle"
 | "enrichment.status.running"
 | "enrichment.status.ready"
 | "enrichment.status.failed"
 | "enrichment.status.missingKey"
 | "enrichment.status.invalidKey"
 | "enrichment.status.quota"
 | "enrichment.status.taskDisabled"
 | "enrichment.status.providerUnavailable";

export type ModuleConfig = {
 module: DailyReadingEnrichmentModule;
 icon: LucideIcon;
 titleKey:
  | "enrichment.modules.translation.title"
  | "enrichment.modules.vocabulary.title"
  | "enrichment.modules.grammar.title"
  | "enrichment.modules.questions.title";
};

export const moduleConfigs: readonly ModuleConfig[] = [
 { module: "translation", icon: Languages, titleKey: "enrichment.modules.translation.title" },
 { module: "vocabulary", icon: LibraryBig, titleKey: "enrichment.modules.vocabulary.title" },
 { module: "grammar", icon: BookOpen, titleKey: "enrichment.modules.grammar.title" },
 { module: "questions", icon: CircleHelp, titleKey: "enrichment.modules.questions.title" },
];

export function configForModule(module: DailyReadingEnrichmentModule) {
 return moduleConfigs.find((config) => config.module === module);
}

export function taskIdForModule(module: DailyReadingEnrichmentModule): AiTaskId {
 if (module === "translation") return "daily-reading.translation";
 if (module === "vocabulary") return "daily-reading.vocabulary";
 if (module === "grammar") return "daily-reading.grammar";
 return "daily-reading.questions";
}

export function statusBadgeVariant(
 state: EnrichmentState,
): ComponentProps<typeof Badge>["variant"] {
 switch (state.status) {
  case "ready":
   return "success";
  case "running":
   return "info";
  case "blocked":
   return "warning";
  case "failed":
   return "danger";
  case "idle":
   return "default";
 }
}

export function statusKey(state: EnrichmentState): EnrichmentStatusKey {
 switch (state.status) {
  case "idle":
   return "enrichment.status.idle";
  case "running":
   return "enrichment.status.running";
  case "ready":
   return "enrichment.status.ready";
  case "failed":
   return "enrichment.status.failed";
  case "blocked":
   switch (state.reason) {
    case "missing-ai-key":
     return "enrichment.status.missingKey";
    case "invalid-ai-key":
     return "enrichment.status.invalidKey";
    case "quota-exhausted":
     return "enrichment.status.quota";
    case "provider-unavailable":
     return "enrichment.status.providerUnavailable";
    case "task-disabled":
     return "enrichment.status.taskDisabled";
   }
 }
}

export function needsKeyManagement(state: EnrichmentState) {
 return (
  state.status === "blocked" &&
  (state.reason === "invalid-ai-key" || state.reason === "quota-exhausted")
 );
}
