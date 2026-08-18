"use client";

import { Bot, ChevronDown, RefreshCcw, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuShortcut,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Typography } from "@/components/ui/typography";
import type { ApiKeysResponse } from "@/features/settings/api-key-manager.schema";
import { Link } from "@/i18n/navigation";

import type { AiConversationRuntimeHealth } from "./ai-conversation.schemas";

export const AUTO_RUNTIME_KEY_ID = "auto";

type ManagedApiKey = ApiKeysResponse["keys"][number];

type AiConversationRuntimeMenuProps = {
 runtimeKeys: ManagedApiKey[];
 runtimeKeyId: string;
 runtimeHealth: AiConversationRuntimeHealth | null;
 isRuntimeLoading: boolean;
 isHealthChecking: boolean;
 runtimeLoadError: boolean;
 onSelectRuntime: (value: string) => void;
 onRecheck: () => void;
};

export function AiConversationRuntimeMenu({
 runtimeKeys,
 runtimeKeyId,
 runtimeHealth,
 isRuntimeLoading,
 isHealthChecking,
 runtimeLoadError,
 onSelectRuntime,
 onRecheck,
}: AiConversationRuntimeMenuProps) {
 const t = useTranslations("AiConversation");
 const healthMessage = isRuntimeLoading
  ? t("runtime.loading")
  : isHealthChecking
    ? t("runtime.healthChecking")
    : runtimeHealth?.ready && runtimeHealth.provider && runtimeHealth.model
      ? t("runtime.healthReady", {
         provider: runtimeHealth.provider,
         model: runtimeHealth.model,
        })
      : runtimeHealth?.code === "missing-system-key"
        ? t("runtime.health.missingSystemKey")
        : runtimeHealth?.code === "invalid-key"
          ? t("runtime.health.invalidKey")
          : runtimeHealth?.code === "quota-exhausted"
            ? t("runtime.health.quotaExhausted")
            : runtimeHealth?.code === "key-unavailable"
              ? t("runtime.health.keyUnavailable")
              : runtimeHealth?.code === "provider-unavailable"
                ? t("runtime.health.providerUnavailable")
                : t("runtime.health.networkError");
 const triggerLabel = isRuntimeLoading || isHealthChecking
  ? t("runtime.compactChecking")
  : runtimeHealth?.ready && runtimeHealth.provider
    ? t("runtime.compactReady", { provider: runtimeHealth.provider })
    : t("runtime.compactUnavailable");

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="ghost"
     size="compact"
     align="start"
     className="min-w-0 max-w-full"
     aria-label={t("runtime.menuAria")}
    >
     <Bot data-icon="inline-start" />
     <Typography as="span" variant="caption" tone="inherit" clamp="one">
      {triggerLabel}
     </Typography>
     <ChevronDown data-icon="inline-end" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" width="lg">
    <div className="grid gap-1 px-2.5 py-2">
     <Typography
      as="p"
      variant="caption"
      tone={runtimeHealth?.ready ? "successStrong" : "secondary"}
      wrapping="breakWords"
     >
      {healthMessage}
     </Typography>
     {runtimeLoadError ? (
      <Typography as="p" variant="caption" tone="danger" wrapping="breakWords">
       {t("runtime.loadError")}
      </Typography>
     ) : null}
    </div>
    <DropdownMenuSeparator />
    <DropdownMenuRadioGroup value={runtimeKeyId} onValueChange={onSelectRuntime}>
     <DropdownMenuRadioItem value={AUTO_RUNTIME_KEY_ID} disabled={isRuntimeLoading}>
      {t("runtime.auto")}
     </DropdownMenuRadioItem>
     {runtimeKeys.map((key) => (
      <DropdownMenuRadioItem key={key.id} value={key.id} disabled={isRuntimeLoading}>
       <span className="min-w-0 truncate">{`${key.providerLabel} · ${key.label}`}</span>
       <DropdownMenuShortcut>{key.defaultModel || t("runtime.modelFallback")}</DropdownMenuShortcut>
      </DropdownMenuRadioItem>
     ))}
    </DropdownMenuRadioGroup>
    {runtimeKeys.length === 0 && !isRuntimeLoading ? (
     <div className="px-2.5 py-2">
      <Typography as="p" variant="caption" tone="muted" wrapping="breakWords">
       {t("runtime.empty")}
      </Typography>
     </div>
    ) : null}
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={onRecheck} disabled={isHealthChecking || isRuntimeLoading}>
     <RefreshCcw />
     {t("runtime.recheck")}
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
     <Link href="/settings?section=ai">
      <Settings2 />
      {t("actions.apiKeys")}
     </Link>
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
