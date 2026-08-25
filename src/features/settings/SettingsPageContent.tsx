"use client";

import { useSelector } from "@tanstack/react-store";
import {
 Bot,
 Languages,
 PlugZap,
 Settings2,
 ShieldCheck,
 SlidersHorizontal,
 Volume2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageContainer } from "@/components/layout/page-container";
import { ActionCard } from "@/components/ui/action-card";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Link, useRouter } from "@/i18n/navigation";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { focusModeStore } from "@/stores/focus-mode-store";

import { AiSettingsWorkspace } from "./AiSettingsWorkspace";
import { AppearanceSettingsSection } from "./AppearanceSettingsSection";

export const SettingsSectionSchema = z.enum(["app", "reading", "ai", "management"]);
const SettingsSectionParamSchema = z.string().optional();

export function resolveSettingsSection(
 value: z.input<typeof SettingsSectionParamSchema>,
 canManageContent: boolean,
) {
 const param = SettingsSectionParamSchema.safeParse(value);
 if (!param.success) return SettingsSectionSchema.enum.app;

 const parsed = SettingsSectionSchema.safeParse(param.data);
 if (!parsed.success) return SettingsSectionSchema.enum.app;
 if (parsed.data === SettingsSectionSchema.enum.management && !canManageContent) {
  return SettingsSectionSchema.enum.app;
 }
 return parsed.data;
}

type SettingsPageContentProps = {
 sectionValue: z.input<typeof SettingsSectionParamSchema>;
 aiPanelValue?: string;
 canManageContent: boolean;
 readingSettings: ReactNode;
 dailyReadingSettings: ReactNode;
};

export function SettingsPageContent({
 sectionValue,
 aiPanelValue,
 canManageContent,
 readingSettings,
 dailyReadingSettings,
}: SettingsPageContentProps) {
 const t = useTranslations("Settings");
 const shellT = useTranslations("Shell");
 const section = resolveSettingsSection(sectionValue, canManageContent);
 const router = useRouter();
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const globalLookupEnabled = dictionaryLookupStore.actions.isEnabled("/");
 const notesLookupEnabled = dictionaryLookupStore.actions.isEnabled("/notes");
 const { setEnabled: setLookupEnabled } = dictionaryLookupStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setEnabled: setFocusModeEnabled } = focusModeStore.actions;

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5">
    <PageHeader title={t("title")} description={t("description")} />

    <Tabs<z.infer<typeof SettingsSectionSchema>>
     className="min-w-0"
     value={section}
     items={[
      { key: SettingsSectionSchema.enum.app, label: t("tabs.app"), icon: Settings2 },
      { key: SettingsSectionSchema.enum.reading, label: t("tabs.reading"), icon: Languages },
      { key: SettingsSectionSchema.enum.ai, label: t("tabs.ai"), icon: Bot },
      ...(canManageContent
       ? [
          {
           key: SettingsSectionSchema.enum.management,
           label: t("tabs.management"),
           icon: SlidersHorizontal,
          },
         ]
       : []),
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

     <TabsContent
      active={section === SettingsSectionSchema.enum.reading}
      className="grid gap-4 pt-4"
     >
      {readingSettings}

      <ActionCard padding="lg" asChild className="grid gap-3">
       <Link
        href="/tts"
        prefetch={false}
        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
       >
        <IconTile tone="accent" size="sm">
         <Volume2 />
        </IconTile>
        <span className="grid min-w-0 gap-1">
         <Typography as="span" variant="cardTitle" tone="default" weight="bold">
          {shellT("navigation.items.tts")}
         </Typography>
         <Typography as="span" variant="bodySmall" tone="muted" leading="standard">
          {t("voiceStudio.description")}
         </Typography>
        </span>
        <Typography
         as="span"
         variant="label"
         tone="accent"
         weight="bold"
         className="col-start-2 sm:col-start-auto"
        >
         {t("management.open")}
        </Typography>
       </Link>
      </ActionCard>
     </TabsContent>

     <TabsContent active={section === SettingsSectionSchema.enum.ai} className="pt-4">
      <AiSettingsWorkspace panelValue={aiPanelValue} dailyReadingSettings={dailyReadingSettings} />
     </TabsContent>

     {canManageContent ? (
      <TabsContent active={section === SettingsSectionSchema.enum.management} className="pt-4">
       <Card variant="section" padding="lg" className="grid gap-4">
        <SectionHeading title={t("management.title")} description={t("management.description")} />

        <div className="grid gap-3 lg:grid-cols-2">
         <ActionCard padding="lg" asChild className="grid gap-3">
          <Link href="/data-quality" prefetch={false}>
           <span className="flex min-w-0 items-center gap-3">
            <IconTile tone="accent" size="sm">
             <ShieldCheck />
            </IconTile>
            <span className="grid min-w-0 flex-1 gap-1">
             <Typography as="span" variant="cardTitle" tone="default" weight="bold">
              {shellT("navigation.items.dataQuality")}
             </Typography>
             <Typography as="span" variant="bodySmall" tone="muted" leading="standard">
              {t("management.dataQualityDescription")}
             </Typography>
            </span>
            <Typography as="span" variant="label" tone="accent" weight="bold">
             {t("management.open")}
            </Typography>
           </span>
          </Link>
         </ActionCard>

         <ActionCard padding="lg" asChild className="grid gap-3">
          <Link href="/api-docs" prefetch={false}>
           <span className="flex min-w-0 items-center gap-3">
            <IconTile tone="accent" size="sm">
             <PlugZap />
            </IconTile>
            <span className="grid min-w-0 flex-1 gap-1">
             <Typography as="span" variant="cardTitle" tone="default" weight="bold">
              {shellT("navigation.items.apiDocs")}
             </Typography>
             <Typography as="span" variant="bodySmall" tone="muted" leading="standard">
              {t("management.apiDescription")}
             </Typography>
            </span>
            <Typography as="span" variant="label" tone="accent" weight="bold">
             {t("management.open")}
            </Typography>
           </span>
          </Link>
         </ActionCard>
        </div>
       </Card>
      </TabsContent>
     ) : null}
    </Tabs>
   </div>
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
