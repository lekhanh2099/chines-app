"use client";

import {
 Activity,
 KeyRound,
 ListTodo,
 MessageCircle,
 Newspaper,
 Save,
 Settings2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import ApiKeyManagerSection from "@/features/settings/ApiKeyManagerSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import type { SegmentedControlItem } from "@/components/ui/segmented-control";
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
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini-models";

import { AiConversationSettingsSection } from "./AiConversationSettingsSection";
import { AiActivitySettings } from "./AiActivitySettings";
import { AiTaskSettingsSection } from "./AiTaskSettingsSection";
import {
 AiSettingsPanelSchema,
 type AiSettingsPanel,
 resolveAiSettingsPanel,
} from "./ai-settings-navigation";

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
 const [lookupPromptOpen, setLookupPromptOpen] = useState(panelValue === "advanced");
 const needsLookupSettings = lookupPromptOpen;
 const [wordLookupPrompt, setWordLookupPrompt] = useState(DEFAULT_WORD_LOOKUP_PROMPT);
 const [sentenceLookupPrompt, setSentenceLookupPrompt] = useState(DEFAULT_SENTENCE_LOOKUP_PROMPT);
 const [savedSettings, setSavedSettings] = useState<ClientAiPromptSettings | null>(null);
 const [isSaving, setIsSaving] = useState(false);
 const [hasLoaded, setHasLoaded] = useState(false);
 const isLoading = needsLookupSettings && !hasLoaded;

 useEffect(() => {
  if (panelValue !== "advanced") return;
  router.replace("/settings?section=ai&panel=tasks#lookup-deep", { scroll: false });
 }, [panelValue, router]);

 useEffect(() => {
  if (!needsLookupSettings || hasLoaded) return;

  let isMounted = true;

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
    setSavedSettings({
     wordLookupPrompt: localSettings.wordLookupPrompt,
     sentenceLookupPrompt: localSettings.sentenceLookupPrompt,
     geminiModel: localSettings.geminiModel,
    });
    setHasLoaded(true);
    toast.info(t("ai.localFallback"));
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
 const tabItems: SegmentedControlItem<AiSettingsPanel>[] = [
  {
   key: AiSettingsPanelSchema.enum.tasks,
   label: navigationT("tabs.tasks"),
   icon: ListTodo,
  },
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
   <TabsContent value={AiSettingsPanelSchema.enum.tasks} className="pt-4">
    <AiTaskSettingsSection onCustomizeLookup={() => setLookupPromptOpen(true)} />
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum.conversation} className="pt-4">
    <AiConversationSettingsSection />
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum["daily-reading"]} className="pt-4">
    {dailyReadingSettings}
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum.providers} className="grid gap-5 pt-4">
    <ApiKeyManagerSection />
   </TabsContent>

   <TabsContent value={AiSettingsPanelSchema.enum.usage} className="pt-4">
    <AiActivitySettings />
   </TabsContent>

   <Dialog open={lookupPromptOpen} onOpenChange={setLookupPromptOpen}>
    <DialogContent size="editor">
     <DialogHeader>
      <DialogTitle icon={<Settings2 />}>{lookupT("advanced.title")}</DialogTitle>
      <DialogDescription>{lookupT("advanced.description")}</DialogDescription>
     </DialogHeader>
     <DialogBody>
      <Typography variant="bodySmall" tone="secondary">
       {navigationT("taskRouting.lookupPromptScope")}
      </Typography>
      <details className="rounded-lg border border-border-default bg-bg-subtle p-4">
       <summary className="cursor-pointer font-bold">
        {navigationT("taskRouting.technicalPrompt")}
       </summary>
       <div className="grid gap-6 pt-4 xl:grid-cols-2">
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
      </details>
     </DialogBody>
     <DialogFooter>
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
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </Tabs>
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
