"use client";

import { Check, Monitor, Moon, Palette, Sun, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import {
 ThemeModeSchema,
 ThemePaletteSchema,
 type ThemeMode,
} from "@/components/layout/theme-contract";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

export function AppearanceSettingsSection() {
 const t = useTranslations("Settings.appearance");
 const { mode, palette, setMode, setPalette } = useTheme();
 const themeModeItems: Array<{
  key: ThemeMode;
  label: string;
  compactLabel: string;
  icon: LucideIcon;
 }> = [
  {
   key: ThemeModeSchema.enum.system,
   label: t("modes.system"),
   compactLabel: t("modes.systemCompact"),
   icon: Monitor,
  },
  {
   key: ThemeModeSchema.enum.light,
   label: t("modes.light"),
   compactLabel: t("modes.light"),
   icon: Sun,
  },
  {
   key: ThemeModeSchema.enum.dark,
   label: t("modes.dark"),
   compactLabel: t("modes.dark"),
   icon: Moon,
  },
 ];
 const paletteOptions = ThemePaletteSchema.options.map((value) => ({
  value,
  label: t(`palettes.${value}.label`),
  description: t(`palettes.${value}.description`),
 }));
 const selectedPalette = paletteOptions.find((option) => option.value === palette);

 return (
  <Card variant="section" padding="lg" className="grid gap-5">
   <div className="flex min-w-0 items-start gap-3">
    <IconTile tone="accent" size="md">
     <Palette />
    </IconTile>
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" leading="standard">
      {t("description")}
     </Typography>
    </div>
   </div>

   <div className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="label" weight="bold">
      {t("modeTitle")}
     </Typography>
     <Typography as="p" variant="caption" tone="muted">
      {t("modeDescription")}
     </Typography>
    </div>
    <SegmentedControl<ThemeMode>
     value={mode}
     items={themeModeItems}
     onChange={setMode}
     density="touch"
     aria-label={t("modeAria")}
    />
   </div>

   <Separator />

   <div className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="label" weight="bold">
      {t("paletteTitle")}
     </Typography>
     <Typography as="p" variant="caption" tone="muted">
      {t("paletteDescription")}
     </Typography>
    </div>

    <div
     role="group"
     aria-label={t("paletteAria")}
     className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
    >
     {paletteOptions.map((option) => {
      const selected = palette === option.value;

      return (
       <Button
        key={option.value}
        type="button"
        variant={selected ? "active" : "outline"}
        size="touch"
        align="between"
        aria-pressed={selected}
        onClick={() => setPalette(option.value)}
        className="w-full"
       >
        <span className="flex min-w-0 items-center gap-2">
         <span
          className="theme-palette-swatch"
          data-theme-swatch={option.value}
          aria-hidden="true"
         />
         <span className="truncate">{option.label}</span>
        </span>
        {selected ? <Check data-icon="inline-end" /> : null}
       </Button>
      );
     })}
    </div>

    <Typography as="p" variant="caption" tone="muted" leading="standard">
     {selectedPalette?.description}
    </Typography>
   </div>
  </Card>
 );
}
