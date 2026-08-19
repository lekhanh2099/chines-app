"use client";

import { useSelector } from "@tanstack/react-store";
import { Bot, Languages, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { useRouter } from "@/i18n/navigation";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { focusModeStore } from "@/stores/focus-mode-store";

import { AiSettingsWorkspace } from "./AiSettingsWorkspace";
import { AppearanceSettingsSection } from "./AppearanceSettingsSection";

export const SettingsSectionSchema = z.enum(["app", "reading", "ai"]);
const SettingsSectionParamSchema = z.string().optional();

export function resolveSettingsSection(value: z.input<typeof SettingsSectionParamSchema>) {
 const param = SettingsSectionParamSchema.safeParse(value);
 if (!param.success) return SettingsSectionSchema.enum.app;

 const parsed = SettingsSectionSchema.safeParse(param.data);
 return parsed.success ? parsed.data : SettingsSectionSchema.enum.app;
}

type SettingsPageContentProps = {
 sectionValue: z.input<typeof SettingsSectionParamSchema>;
 aiPanelValue?: string;
 readingSettings: ReactNode;
 dailyReadingSettings: ReactNode;
};

export function SettingsPageContent({
 sectionValue,
 aiPanelValue,
 readingSettings,
 dailyReadingSettings,
}: SettingsPageContentProps) {
 const t = useTranslations("Settings");
 const section = resolveSettingsSection(sectionValue);
 const router = useRouter();
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const globalLookupEnabled = dictionaryLookupStore.actions.isEnabled("/");
 const notesLookupEnabled = dictionaryLookupStore.actions.isEnabled("/notes");
 const { setEnabled: setLookupEnabled } = dictionaryLookupStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setEnabled: setFocusModeEnabled } = focusModeStore.actions;

 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader title={t("title")} description={t("description")} />

    <Tabs<z.infer<typeof SettingsSectionSchema>>
     className="min-w-0"
     value={section}
     items={[
      { key: SettingsSectionSchema.enum.app, label: t("tabs.app"), icon: Settings2 },
      { key: SettingsSectionSchema.enum.reading, label: t("tabs.reading"), icon: Languages },
      { key: SettingsSectionSchema.enum.ai, label: t("tabs.ai"), icon: Bot },
     ]}
     onValueChange={(nextSection) => {
      const href =
       nextSection === SettingsSectionSchema.enum.ai
        ? "/settings?section=ai&panel=conversation"
        : `/settings?section=${nextSection}`;
      router.push(href, { scroll: false });
     }}
    >
     <TabsContent active={section === SettingsSectionSchema.enum.app} className="grid gap-4 pt-4">
      <AppearanceSettingsSection />

      <Card variant="section" padding="lg" className="grid gap-3">
       <SectionHeading
        title={t("learningBehavior.title")}
        description={t("learningBehavior.description")}
       />

       <div className="grid">
        <SettingsToggleRow
         id="global-dictionary-lookup"
         label={t("learningBehavior.globalLookup")}
         description={t("learningBehavior.globalLookupDescription")}
         checked={globalLookupEnabled}
         onCheckedChange={(enabled) => setLookupEnabled("/", enabled)}
         tone="accent"
        />
        <Separator />
        <SettingsToggleRow
         id="notes-dictionary-lookup"
         label={t("learningBehavior.notesLookup")}
         description={t("learningBehavior.notesLookupDescription")}
         checked={notesLookupEnabled}
         onCheckedChange={(enabled) => setLookupEnabled("/notes", enabled)}
         tone="accent"
        />
        <Separator />
        <SettingsToggleRow
         id="focus-mode"
         label={t("learningBehavior.focusMode")}
         description={t("learningBehavior.focusModeDescription")}
         checked={focusModeEnabled}
         onCheckedChange={(enabled) => {
          if (enabled && !focusModeEnabled) {
           toast.warning(t("learningBehavior.focusModeEnabled"), { duration: 5200 });
          }
          setFocusModeEnabled(enabled);
         }}
         tone="warning"
        />
       </div>
      </Card>
     </TabsContent>

     <TabsContent active={section === SettingsSectionSchema.enum.reading} className="pt-4">
      {readingSettings}
     </TabsContent>

     <TabsContent active={section === SettingsSectionSchema.enum.ai} className="pt-4">
      <AiSettingsWorkspace panelValue={aiPanelValue} dailyReadingSettings={dailyReadingSettings} />
     </TabsContent>
    </Tabs>
   </main>
  </PageContainer>
 );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
 return (
  <div className="grid min-w-0 max-w-3xl gap-1">
   <Typography as="h2" variant="sectionTitle" tone="default" weight="bold">
    {title}
   </Typography>
   <Typography as="p" tone="secondary" leading="standard">
    {description}
   </Typography>
  </div>
 );
}

function SettingsToggleRow({
 id,
 label,
 description,
 checked,
 onCheckedChange,
 tone,
}: {
 id: string;
 label: string;
 description: string;
 checked: boolean;
 onCheckedChange: (checked: boolean) => void;
 tone: ComponentProps<typeof Switch>["tone"];
}) {
 const descriptionId = `${id}-description`;

 return (
  <div className="flex min-w-0 items-center justify-between gap-4 py-3">
   <div className="grid min-w-0 gap-1">
    <Label htmlFor={id} variant="label" tone="default" weight="bold">
     {label}
    </Label>
    <Typography as="p" id={descriptionId} variant="bodySmall" tone="muted" leading="standard">
     {description}
    </Typography>
   </div>
   <Switch
    id={id}
    checked={checked}
    onCheckedChange={onCheckedChange}
    aria-describedby={descriptionId}
    tone={tone}
   />
  </div>
 );
}
