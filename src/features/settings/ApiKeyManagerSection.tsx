"use client";

import { ArrowUp, Check, Cpu, KeyRound, MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconTile } from "@/components/ui/icon-tile";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { AddApiKeyDialog } from "@/features/settings/AddApiKeyDialog";
import { getApiKeyModelDescriptionKey } from "@/features/settings/model-description-keys";
import { useManagedApiKeys } from "@/features/settings/useManagedApiKeys";
import { getApiKeyModelOptions, getDefaultApiKeyModel } from "@/lib/api-key-models";
import { API_KEY_PROVIDER_OPTIONS } from "@/lib/api-key-providers";

type MoveDirection = "up" | "down";

export default function ApiKeyManagerSection() {
 const t = useTranslations("Settings");
 const lookupT = useTranslations("AiLookupSettings");
 const common = useTranslations("Common");
 const locale = useLocale();
 const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
 const { query, toggleMutation, moveMutation, modelMutation, deleteMutation, busyKeyId } =
  useManagedApiKeys();
 const keys = query.data?.keys ?? [];
 const selectedKeyId = keys.find((key) => key.isActive)?.id ?? null;
 const schemaReady = query.data?.schemaReady ?? true;
 const isLoading = query.isPending;
 const formatDate = (value: string | null | undefined) =>
  value
   ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
     )
   : t("apiKeys.never");

 async function handleModelChange(keyId: string, nextModel: string) {
  try {
   await modelMutation.mutateAsync({ keyId, model: nextModel });
   toast.success(t("apiKeys.modelChanged"));
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.modelChangeError"));
  }
 }

 async function handleToggleKey(key: (typeof keys)[number]) {
  try {
   await toggleMutation.mutateAsync({ keyId: key.id, isActive: !key.isActive });
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.toggleError"));
  }
 }

 async function handleMoveKey(keyId: string, direction: MoveDirection) {
  try {
   await moveMutation.mutateAsync({ keyId, direction });
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.moveError"));
  }
 }

 async function handleDeleteKey() {
  if (!deleteKeyId) return;
  try {
   await deleteMutation.mutateAsync(deleteKeyId);
   setDeleteKeyId(null);
   toast.success(t("apiKeys.deleted"));
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.deleteError"));
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex max-w-3xl items-start gap-3">
     <IconTile tone="accent" size="sm">
      <Cpu aria-hidden="true" />
     </IconTile>
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" tone="default" weight="bold">
       {t("apiKeys.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" leading="standard">
       {t("apiKeys.description")}
      </Typography>
     </div>
    </div>

    <AddApiKeyDialog />
   </div>

   {!schemaReady ? (
    <Card variant="subtle" padding="sm">
     <Typography as="p" variant="bodySmall" tone="warning">
      {t("apiKeys.schemaNotReady")}
     </Typography>
    </Card>
   ) : null}

   {query.isError ? (
    <div className="grid justify-items-start gap-2">
     <Typography as="p" weight="semibold" tone="danger">
      {t("apiKeys.loadError")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="secondary">
      {t("apiKeys.loadErrorDescription")}
     </Typography>
     <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
      {common("actions.retry")}
     </Button>
    </div>
   ) : isLoading ? (
    <div className="flex items-center gap-3 py-4 text-text-secondary">
     <Spinner />
     <Typography variant="bodySmall">{t("apiKeys.loading")}</Typography>
    </div>
   ) : keys.length === 0 ? (
    <div className="flex items-start gap-3 py-3">
     <IconTile tone="accent" size="sm">
      <KeyRound aria-hidden="true" />
     </IconTile>
     <div className="grid gap-1">
      <Typography as="p" tone="default" weight="semibold">
       {t("apiKeys.empty")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" leading="compact">
       {schemaReady ? t("apiKeys.emptyReady") : t("apiKeys.emptyNotReady")}
      </Typography>
     </div>
    </div>
   ) : (
    <div className="divide-y divide-border-default border-y border-border-default">
     {keys.map((key, index) => {
      const isBusy = busyKeyId === key.id;
      const providerOption = API_KEY_PROVIDER_OPTIONS.find(
       (option) => option.value === key.provider,
      );
      const storedModelOptions = getApiKeyModelOptions(key.provider);

      return (
       <article
        key={key.id}
        className="grid min-w-0 gap-3 py-3 md:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)_auto] md:items-center"
       >
        <div className="grid min-w-0 gap-1.5">
         <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Typography as="h3" variant="cardTitle" tone="default" weight="bold" clamp="one">
           {key.label}
          </Typography>
          <Badge variant="default" size="sm" casing="natural">
           {key.providerLabel}
          </Badge>
          <Badge
           variant={key.id === selectedKeyId ? "info" : key.isActive ? "success" : "default"}
           size="sm"
           casing="natural"
          >
           {key.isActive ? <Check aria-hidden="true" /> : <Pause aria-hidden="true" />}
           {key.id === selectedKeyId
            ? t("apiKeys.statusSelected")
            : key.isActive
              ? t("apiKeys.statusActive")
              : t("apiKeys.statusPaused")}
          </Badge>
          {providerOption?.accessTier === "free-tier" ? (
           <Badge variant="success" size="sm" casing="natural">
            {t("apiKeys.freeTierAvailable")}
           </Badge>
          ) : null}
         </div>
         <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Typography as="span" variant="code" tone="secondary" clamp="one">
           {key.maskedKey}
          </Typography>
          <Typography variant="caption" tone="muted">
           {t("apiKeys.verifiedAt", { date: formatDate(key.lastValidatedAt) })}
          </Typography>
         </div>
        </div>

        <div className="grid min-w-0 gap-1">
         <Select
          value={key.defaultModel || getDefaultApiKeyModel(key.provider)}
          onValueChange={(value) => void handleModelChange(key.id, value)}
          disabled={isBusy || !schemaReady}
         >
          <SelectTrigger width="full" aria-label={t("apiKeys.modelAria", { label: key.label })}>
           <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
           {key.defaultModel &&
           !storedModelOptions.some((option) => option.value === key.defaultModel) ? (
            <SelectItem value={key.defaultModel}>
             {key.defaultModel} ({t("ai.savedSuffix")})
            </SelectItem>
           ) : null}
           {storedModelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
             {option.label}
            </SelectItem>
           ))}
          </SelectContent>
         </Select>
         <Typography as="span" variant="caption" tone="muted" leading="compact" clamp="one">
          {t(getApiKeyModelDescriptionKey(key.provider, key.defaultModel))}
         </Typography>
        </div>

        <DropdownMenu>
         <DropdownMenuTrigger asChild>
          <Button
           type="button"
           variant="ghost"
           size="icon-toolbar"
           aria-label={lookupT("modelProvider.keyActions", { label: key.label })}
           disabled={isBusy || !schemaReady}
          >
           {isBusy ? <Spinner /> : <MoreHorizontal />}
          </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" width="sm">
          {index > 0 ? (
           <DropdownMenuItem onSelect={() => void handleMoveKey(key.id, "up")}>
            <ArrowUp />
            {t("apiKeys.moveUp")}
           </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => void handleToggleKey(key)}>
           {key.isActive ? <Pause /> : <Play />}
           {key.isActive ? t("apiKeys.pause") : t("apiKeys.resume")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="destructive" onSelect={() => setDeleteKeyId(key.id)}>
           <Trash2 />
           {t("apiKeys.delete")}
          </DropdownMenuItem>
         </DropdownMenuContent>
        </DropdownMenu>
       </article>
      );
     })}
    </div>
   )}

   <Dialog open={deleteKeyId !== null} onOpenChange={(open) => !open && setDeleteKeyId(null)}>
    <DialogContent size="sm">
     <DialogHeader>
      <DialogTitle>{t("apiKeys.deleteTitle")}</DialogTitle>
      <DialogDescription>{t("apiKeys.deleteDescription")}</DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       onClick={() => setDeleteKeyId(null)}
       disabled={deleteMutation.isPending}
      >
       {common("actions.cancel")}
      </Button>
      <Button
       type="button"
       variant="destructive"
       onClick={() => void handleDeleteKey()}
       disabled={deleteMutation.isPending}
      >
       {deleteMutation.isPending ? (
        <Spinner data-icon="inline-start" />
       ) : (
        <Trash2 data-icon="inline-start" />
       )}
       {t("apiKeys.deleteConfirm")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </Card>
 );
}
