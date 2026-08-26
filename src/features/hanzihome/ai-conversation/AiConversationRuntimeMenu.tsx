"use client";

import { Bot, ChevronDown, KeyRound, RefreshCcw, Settings2 } from "lucide-react";
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
import { AddApiKeyDialog } from "@/features/settings/AddApiKeyDialog";
import { Link } from "@/i18n/navigation";
import { getApiKeyModelOptions } from "@/lib/api-key-models";

import type { AiConversationRuntimeHealth } from "./ai-conversation.schemas";

export const AUTO_RUNTIME_KEY_ID = "auto";

type ManagedApiKey = ApiKeysResponse["keys"][number];

type AiConversationRuntimeMenuProps = {
 runtimeKeys: ManagedApiKey[];
 runtimeKeyId: string;
 runtimeModel: string | null;
 runtimeHealth: AiConversationRuntimeHealth | null;
 isRuntimeLoading: boolean;
 isHealthChecking: boolean;
 runtimeLoadError: boolean;
 onSelectRuntime: (value: string) => void;
 onSelectModel: (value: string) => void;
 onRecheck: () => void;
};

export function AiConversationRuntimeMenu({
 runtimeKeys,
 runtimeKeyId,
 runtimeModel,
 runtimeHealth,
 isRuntimeLoading,
 isHealthChecking,
 runtimeLoadError,
 onSelectRuntime,
 onSelectModel,
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
      : runtimeHealth?.code === "invalid-key"
        ? t("runtime.health.invalidKey")
        : runtimeHealth?.code === "quota-exhausted"
          ? t("runtime.health.quotaExhausted")
          : runtimeHealth?.code === "key-unavailable" ||
              runtimeHealth?.code === "missing-system-key"
            ? t("runtime.health.keyUnavailable")
            : runtimeHealth?.code === "provider-unavailable"
              ? t("runtime.health.providerUnavailable")
              : t("runtime.health.networkError");
 const triggerLabel =
  isRuntimeLoading || isHealthChecking
   ? t("runtime.compactChecking")
   : runtimeHealth?.ready && runtimeHealth.provider
     ? t("runtime.compactReady", { provider: runtimeHealth.provider })
     : t("runtime.compactUnavailable");
 const needsKey = runtimeKeys.length === 0 && !runtimeHealth?.ready && !isRuntimeLoading;
 const selectedKey = runtimeKeys.find((key) => key.id === runtimeKeyId);
 const selectedModelOptions = selectedKey
  ? getApiKeyModelOptions(selectedKey.provider).map((option) => option.value)
  : [];
 const modelOptions =
  selectedKey?.defaultModel && !selectedModelOptions.includes(selectedKey.defaultModel)
   ? [selectedKey.defaultModel, ...selectedModelOptions]
   : selectedModelOptions;

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
    {selectedKey ? (
     <>
      <DropdownMenuSeparator />
      <div className="px-2.5 py-1">
       <Typography as="p" variant="caption" tone="muted">
        {t("runtime.modelOverride")}
       </Typography>
      </div>
      <DropdownMenuRadioGroup value={runtimeModel ?? ""} onValueChange={onSelectModel}>
       {modelOptions.map((model) => (
        <DropdownMenuRadioItem key={model} value={model}>
         <span className="truncate">{model}</span>
        </DropdownMenuRadioItem>
       ))}
      </DropdownMenuRadioGroup>
     </>
    ) : null}
    {needsKey ? (
     <div className="grid gap-2 px-2.5 py-2">
      <Typography as="p" variant="caption" tone="muted" wrapping="breakWords">
       {t("runtime.empty")}
      </Typography>
      <AddApiKeyDialog
       onSaved={onRecheck}
       trigger={
        <Button type="button" size="compact" className="justify-self-start">
         <KeyRound data-icon="inline-start" />
         {t("runtime.addKey")}
        </Button>
       }
      />
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
