"use client";

import {
 Activity,
 KeyRound,
 MessageCircle,
 Newspaper,
 RefreshCcw,
 Save,
 Settings2,
 SlidersHorizontal,
 Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import ApiKeyManagerSection from "@/components/settings/ApiKeyManagerSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import type { SegmentedControlItem } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useRouter } from "@/i18n/navigation";
import {
 ClientAiPromptSettingsSchema,
 loadClientAiPromptSettings,
 saveClientAiPromptSettings,
 type ClientAiPromptSettings,
} from "@/lib/ai-prompt-settings-client";
import {
 DEFAULT_SENTENCE_LOOKUP_PROMPT,
 DEFAULT_WORD_LOOKUP_PROMPT,
 SENTENCE_PLACEHOLDER,
 WORD_PLACEHOLDER,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 DEFAULT_GEMINI_QUICK_MODEL,
 GEMINI_DETAIL_MODEL_OPTIONS,
 GeminiModelIdSchema,
 getGeminiModelLabel,
} from "@/lib/gemini-models";

import { AiConversationSettingsSection } from "./AiConversationSettingsSection";
import { AiConversationUsageSettings } from "./AiConversationUsageSettings";
import {
 AiSettingsPanelSchema,
 type AiSettingsPanel,
 resolveAiSettingsPanel,
} from "./ai-settings-navigation";
import { getApiKeyModelDescriptionKey } from "./model-description-keys";

type AiSettingsWorkspaceProps = {
 panelValue?: string;
 dailyReadingSettings: ReactNode;
};

export function AiSettingsWorkspace({
 panelValue,
 dailyReadingSettings,
}: AiSettingsWorkspaceProps) {
 const t = useTranslations("Settings");
 const lookupT = useTranslations("AiLookupSettings");
 const navigationT = useTranslations("AiSettings");
 const router = useRouter();
 const panel = resolveAiSettingsPanel(panelValue);
 const needsLookupSettings =
  panel === AiSettingsPanelSchema.enum.providers || panel === AiSettingsPanelSchema.enum.advanced;
 const [wordLookupPrompt, setWordLookupPrompt] = useState(DEFAULT_WORD_LOOKUP_PROMPT);
 const [sentenceLookupPrompt, setSentenceLookupPrompt] = useState(DEFAULT_SENTENCE_LOOKUP_PROMPT);
 const [geminiModel, setGeminiModel] =
  useState<ClientAiPromptSettings["geminiModel"]>(DEFAULT_GEMINI_MODEL);
 const [savedSettings, setSavedSettings] = useState<ClientAiPromptSettings | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [hasLoaded, setHasLoaded] = useState(false);

 useEffect(() => {
  if (!needsLookupSettings || hasLoaded) return;

  let isMounted = true;
  setIsLoading(true);

  async function loadSettings() {
   const localSettings = loadClientAiPromptSettings();

   try {
    const response = await fetch("/api/settings/ai-prompts", {
     method: "GET",
     credentials: "include",
    });

    if (!response.ok) throw new Error("load_failed");

    const data = ClientAiPromptSettingsSchema.parse(await response.json());
    if (!isMounted) return;

    const merged = saveClientAiPromptSettings({
     wordLookupPrompt: data.wordLookupPrompt || localSettings.wordLookupPrompt,
     sentenceLookupPrompt: data.sentenceLookupPrompt || localSettings.sentenceLookupPrompt,
     geminiModel: data.geminiModel || localSettings.geminiModel,
    });

    setWordLookupPrompt(merged.wordLookupPrompt || DEFAULT_WORD_LOOKUP_PROMPT);
    setSentenceLookupPrompt(merged.sentenceLookupPrompt || DEFAULT_SENTENCE_LOOKUP_PROMPT);
    setGeminiModel(merged.geminiModel || DEFAULT_GEMINI_MODEL);
    setSavedSettings({
     wordLookupPrompt: merged.wordLookupPrompt || DEFAULT_WORD_LOOKUP_PROMPT,
     sentenceLookupPrompt: merged.sentenceLookupPrompt || DEFAULT_SENTENCE_LOOKUP_PROMPT,
     geminiModel: merged.geminiModel || DEFAULT_GEMINI_MODEL,
    });
    setHasLoaded(true);
   } catch {
    if (!isMounted) return;
    setWordLookupPrompt(localSettings.wordLookupPrompt);
    setSentenceLookupPrompt(localSettings.sentenceLookupPrompt);
    setGeminiModel(localSettings.geminiModel);
    setSavedSettings({
     wordLookupPrompt: localSettings.wordLookupPrompt,
     sentenceLookupPrompt: localSettings.sentenceLookupPrompt,
     geminiModel: localSettings.geminiModel,
    });
    setHasLoaded(true);
    toast.info(t("ai.localFallback"));
   } finally {
    if (isMounted) setIsLoading(false);
   }
  }

  void loadSettings();

  return () => {
   isMounted = false;
  };
 }, [hasLoaded, needsLookupSettings, t]);

 async function persistAiLookupSettings(nextSettings: ClientAiPromptSettings) {
  const normalized = saveClientAiPromptSettings(nextSettings);

  try {
   const response = await fetch("/api/settings/ai-prompts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(normalized),
   });

   if (!response.ok) throw new Error(String(response.status));

   const data = ClientAiPromptSettingsSchema.parse(await response.json());
   return { settings: saveClientAiPromptSettings(data), remote: true };
  } catch {
   return { settings: normalized, remote: false };
  }
 }

 async function handleSaveModel() {
  if (!savedSettings) return;
  setIsSaving(true);

  try {
   const persisted = await persistAiLookupSettings({
    wordLookupPrompt: savedSettings.wordLookupPrompt,
    sentenceLookupPrompt: savedSettings.sentenceLookupPrompt,
    geminiModel,
   });
   setGeminiModel(persisted.settings.geminiModel);
   setSavedSettings((current) =>
    current ? { ...current, geminiModel: persisted.settings.geminiModel } : persisted.settings,
   );
   toast.success(persisted.remote ? t("ai.savedRemote") : t("ai.savedLocal"));
  } finally {
   setIsSaving(false);
  }
 }

 async function handleSavePrompts() {
  if (!savedSettings) return;
  setIsSaving(true);

  try {
   const persisted = await persistAiLookupSettings({
    wordLookupPrompt,
    sentenceLookupPrompt,
    geminiModel: savedSettings.geminiModel,
   });
   setWordLookupPrompt(persisted.settings.wordLookupPrompt);
   setSentenceLookupPrompt(persisted.settings.sentenceLookupPrompt);
   setSavedSettings((current) =>
    current
     ? {
        ...current,
        wordLookupPrompt: persisted.settings.wordLookupPrompt,
        sentenceLookupPrompt: persisted.settings.sentenceLookupPrompt,
       }
     : persisted.settings,
   );
   toast.success(persisted.remote ? t("ai.savedRemote") : t("ai.savedLocal"));
  } finally {
   setIsSaving(false);
  }
 }

 const hasUnsavedWordPrompt =
  savedSettings !== null && wordLookupPrompt !== savedSettings.wordLookupPrompt;
 const hasUnsavedSentencePrompt =
  savedSettings !== null && sentenceLookupPrompt !== savedSettings.sentenceLookupPrompt;
 const hasUnsavedPromptChanges = hasUnsavedWordPrompt || hasUnsavedSentencePrompt;
 const hasUnsavedModelChange = savedSettings !== null && geminiModel !== savedSettings.geminiModel;
 const selectedDetailModel = GEMINI_DETAIL_MODEL_OPTIONS.find(
  (option) => option.value === geminiModel,
 );
 const tabItems: SegmentedControlItem<AiSettingsPanel>[] = [
  {
   key: AiSettingsPanelSchema.enum.conversation,
   label: navigationT("tabs.conversation"),
   icon: MessageCircle,
  },
  {
   key: AiSettingsPanelSchema.enum["daily-reading"],
   label: navigationT("tabs.dailyReading"),
   icon: Newspaper,
  },
  {
   key: AiSettingsPanelSchema.enum.providers,
   label: navigationT("tabs.providers"),
   icon: KeyRound,
  },
  {
   key: AiSettingsPanelSchema.enum.usage,
   label: navigationT("tabs.usage"),
   icon: Activity,
  },
  {
   key: AiSettingsPanelSchema.enum.advanced,
   label: navigationT("tabs.advanced"),
   icon: SlidersHorizontal,
  },
 ];

 return (
  <Tabs<AiSettingsPanel>
   value={panel}
   items={tabItems}
   listClassName="flex-wrap"
   aria-label={navigationT("tabs.aria")}
   onValueChange={(nextPanel) => {
    router.push(`/settings?section=ai&panel=${nextPanel}`, { scroll: false });
   }}
  >
   <TabsContent value={AiSettingsPanelSchema.enum.conversation} className="pt-4">
    <AiConversationSettingsSection />
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum["daily-reading"]} className="pt-4">
    {dailyReadingSettings}
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum.providers} className="grid gap-5 pt-4">
    <Card variant="section" padding="lg" className="grid gap-4">
     <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <SectionHeading
       icon={<Sparkles />}
       title={lookupT("modelProvider.title")}
       description={lookupT("modelProvider.description")}
      />
      <div className="flex flex-wrap items-center gap-2">
       {hasLoaded ? (
        <Badge variant={hasUnsavedModelChange ? "warning" : "success"} size="sm">
         {hasUnsavedModelChange
          ? lookupT("modelProvider.dirty")
          : lookupT("modelProvider.synced")}
        </Badge>
       ) : null}
       <Button
        variant="outline"
        size="toolbar"
        onClick={() => setGeminiModel(DEFAULT_GEMINI_MODEL)}
        disabled={isLoading || isSaving}
       >
        <RefreshCcw data-icon="inline-start" />
        {lookupT("modelProvider.reset")}
       </Button>
       <Button
        size="toolbar"
        onClick={() => void handleSaveModel()}
        disabled={isLoading || isSaving || !hasLoaded || !hasUnsavedModelChange}
       >
        {isSaving ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
        {lookupT("modelProvider.save")}
       </Button>
      </div>
     </div>

     <Separator />

     <div className="grid gap-2">
      <div className="grid gap-1">
       <Typography as="h3" variant="cardTitle" weight="bold">
        {t("ai.detailTitle")}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="muted">
        {t("ai.detailDescription")}
       </Typography>
      </div>
      <div className="grid max-w-xl gap-2">
       <Label htmlFor="gemini-model" variant="label" tone="default" weight="semibold">
        {t("ai.detailModelLabel")}
       </Label>
       <Select
        value={geminiModel}
        onValueChange={(value) => setGeminiModel(GeminiModelIdSchema.parse(value))}
        disabled={isLoading || isSaving}
       >
        <SelectTrigger id="gemini-model" width="full" aria-label={t("ai.detailModelAria")}>
         <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
         {!selectedDetailModel ? (
          <SelectItem value={geminiModel}>
           {getGeminiModelLabel(geminiModel)} ({t("ai.savedSuffix")})
          </SelectItem>
         ) : null}
         {GEMINI_DETAIL_MODEL_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
           {option.label}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
       <Typography as="p" variant="bodySmall" tone="muted" leading="compact">
        {selectedDetailModel
         ? t(getApiKeyModelDescriptionKey("gemini", selectedDetailModel.value))
         : t("ai.legacyModel")}
       </Typography>
      </div>
     </div>

     <Separator />

     <div className="grid gap-2">
      <Typography as="h3" variant="cardTitle" weight="bold">
       {t("ai.quickTitle")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("ai.quickDescription")}
      </Typography>
      <div className="flex flex-wrap items-center gap-3">
       <div className="grid gap-1">
        <Typography as="p" tone="default" weight="semibold">
         {getGeminiModelLabel(DEFAULT_GEMINI_QUICK_MODEL)}
        </Typography>
        <Typography as="p" variant="bodySmall" tone="muted">
         {t("ai.quickModelDescription")}
        </Typography>
       </div>
       <Badge variant="success" size="sm">
        {t("ai.noPersonalKey")}
       </Badge>
       <Badge variant="info" size="sm">
        {t("ai.freeTier")}
       </Badge>
      </div>
     </div>
    </Card>

    <ApiKeyManagerSection />
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum.usage} className="pt-4">
    <AiConversationUsageSettings />
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum.advanced} className="pt-4">
    <Card variant="section" padding="lg" className="grid gap-4">
     <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <SectionHeading
       icon={<Settings2 />}
       title={lookupT("advanced.title")}
       description={lookupT("advanced.description")}
      />
      <div className="flex flex-wrap items-center gap-2">
       {hasLoaded ? (
        <Badge variant={hasUnsavedPromptChanges ? "warning" : "default"} size="sm">
         {hasUnsavedPromptChanges ? t("prompts.dirty") : t("prompts.synced")}
        </Badge>
       ) : null}
       <Button
        size="toolbar"
        onClick={() => void handleSavePrompts()}
        disabled={isLoading || isSaving || !hasLoaded || !hasUnsavedPromptChanges}
       >
        {isSaving ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
        {t("prompts.save")}
       </Button>
      </div>
     </div>

     <Separator />

     <div className="grid gap-6 xl:grid-cols-2">
      <PromptPanel
       title={t("prompts.wordTitle")}
       description={t("prompts.wordDescription", { token: WORD_PLACEHOLDER })}
       placeholderToken={WORD_PLACEHOLDER}
       value={wordLookupPrompt}
       onChange={setWordLookupPrompt}
       defaultValue={DEFAULT_WORD_LOOKUP_PROMPT}
       disabled={isLoading || isSaving}
       isDirty={hasUnsavedWordPrompt}
      />

      <PromptPanel
       title={t("prompts.sentenceTitle")}
       description={t("prompts.sentenceDescription", { token: SENTENCE_PLACEHOLDER })}
       placeholderToken={SENTENCE_PLACEHOLDER}
       value={sentenceLookupPrompt}
       onChange={setSentenceLookupPrompt}
       defaultValue={DEFAULT_SENTENCE_LOOKUP_PROMPT}
       disabled={isLoading || isSaving}
       isDirty={hasUnsavedSentencePrompt}
      />
     </div>
    </Card>
   </TabsContent>
  </Tabs>
 );
}

function SectionHeading({
 title,
 description,
 icon,
}: {
 title: string;
 description: string;
 icon?: ReactNode;
}) {
 return (
  <div className="flex min-w-0 max-w-3xl items-start gap-3">
   {icon ? (
    <IconTile tone="accent" size="sm">
     {icon}
    </IconTile>
   ) : null}
   <div className="grid min-w-0 gap-1">
    <Typography as="h2" variant="sectionTitle" tone="default" weight="bold">
     {title}
    </Typography>
    <Typography as="p" tone="secondary" leading="standard">
     {description}
    </Typography>
   </div>
  </div>
 );
}

function PromptPanel({
 title,
 description,
 placeholderToken,
 value,
 onChange,
 defaultValue,
 disabled,
 isDirty,
}: {
 title: string;
 description: string;
 placeholderToken: string;
 value: string;
 onChange: (value: string) => void;
 defaultValue: string;
 disabled: boolean;
 isDirty: boolean;
}) {
 const t = useTranslations("Settings.prompts");
 const hasPlaceholder = value.includes(placeholderToken);

 return (
  <Card variant="default" padding="lg" className="grid gap-4">
   <div className="flex items-start justify-between gap-4">
    <div className="grid gap-2">
     <Typography as="h4" variant="cardTitle" tone="default" weight="bold">
      {title}
     </Typography>
     <Typography as="p" tone="secondary" leading="standard">
      {description}
     </Typography>
    </div>

    <div className="flex items-center gap-2">
     <Badge variant={isDirty ? "warning" : "default"} size="sm">
      {isDirty ? t("unsaved") : t("saved")}
     </Badge>
     <Button size="sm" variant="ghost" onClick={() => onChange(defaultValue)} disabled={disabled}>
      {t("restore")}
     </Button>
    </div>
   </div>

   <div className="flex items-center justify-between gap-3">
    <Badge variant={hasPlaceholder ? "success" : "danger"} size="sm">
     {hasPlaceholder
      ? t("hasPlaceholder", { token: placeholderToken })
      : t("missingPlaceholder", { token: placeholderToken })}
    </Badge>
    <Typography as="span" variant="caption" tone="muted">
     {t("characters", { count: value.length })}
    </Typography>
   </div>

   <Textarea
    aria-label={title}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    spellCheck={false}
    rows={16}
    font="mono"
   />
  </Card>
 );
}
