"use client";

import { Check, Monitor, Moon, Palette, Sun, type LucideIcon } from "lucide-react";

import {
 THEME_PALETTE_META,
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

const themeModeItems: Array<{
 key: ThemeMode;
 label: string;
 compactLabel: string;
 icon: LucideIcon;
}> = [
 {
  key: ThemeModeSchema.enum.system,
  label: "Theo thiết bị",
  compactLabel: "Thiết bị",
  icon: Monitor,
 },
 { key: ThemeModeSchema.enum.light, label: "Sáng", compactLabel: "Sáng", icon: Sun },
 { key: ThemeModeSchema.enum.dark, label: "Tối", compactLabel: "Tối", icon: Moon },
];

const paletteOptions = ThemePaletteSchema.options.map((value) => ({
 value,
 ...THEME_PALETTE_META[value],
}));

export function AppearanceSettingsSection() {
 const { mode, palette, setMode, setPalette } = useTheme();
 const selectedPalette = THEME_PALETTE_META[palette];

 return (
  <Card variant="section" padding="lg" className="grid gap-5">
   <div className="flex min-w-0 items-start gap-3">
    <IconTile tone="accent" size="md">
     <Palette />
    </IconTile>
    <div className="min-w-0">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      Giao diện
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" leading="standard" className="mt-1">
      Chế độ sáng tối và màu nhấn dùng chung toàn ứng dụng. Canvas, card, popover và border giữ
      nền trung tính để nội dung học luôn là điểm tập trung.
     </Typography>
    </div>
   </div>

   <div className="grid gap-3">
    <div>
     <Typography as="h3" variant="label" weight="bold">
      Chế độ sáng tối
     </Typography>
     <Typography as="p" variant="caption" tone="muted" className="mt-1">
      “Theo thiết bị” tự đổi khi hệ điều hành đổi giao diện.
     </Typography>
    </div>
    <SegmentedControl<ThemeMode>
     value={mode}
     items={themeModeItems}
     onChange={setMode}
     density="touch"
     aria-label="Chọn chế độ sáng tối"
    />
   </div>

   <Separator />

   <div className="grid gap-3">
    <div>
     <Typography as="h3" variant="label" weight="bold">
      Bảng màu giao diện
     </Typography>
     <Typography as="p" variant="caption" tone="muted" className="mt-1">
      Chỉ đổi màu nhấn, focus, trạng thái chọn và navigation active; không nhuộm nền toàn trang.
     </Typography>
    </div>

    <div
     role="group"
     aria-label="Chọn bảng màu giao diện"
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
     {selectedPalette.description}
    </Typography>
   </div>
  </Card>
 );
}
