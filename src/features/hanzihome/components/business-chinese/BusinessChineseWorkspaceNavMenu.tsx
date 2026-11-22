"use client";

import { memo } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";

export type BusinessChineseNavTab<T extends string = string> = {
 key: T;
 label: string;
};

type BusinessChineseWorkspaceNavMenuProps<T extends string = string> = {
 tabs: ReadonlyArray<BusinessChineseNavTab<T>>;
 activeView: T;
 onActiveViewChange: (view: T) => void;
 className?: string;
};

export const BusinessChineseWorkspaceNavMenu = memo(function BusinessChineseWorkspaceNavMenu<
 T extends string = string,
>({ tabs, activeView, onActiveViewChange, className }: BusinessChineseWorkspaceNavMenuProps<T>) {
 const t = useTranslations("BusinessChinese");
 if (tabs.length === 0) return null;

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     variant="navigation"
     size="icon-toolbar"
     className={className}
     aria-label={t("moreSectionsLabel")}
     title={t("moreSectionsLabel")}
    >
     <MoreHorizontal />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start" width="md">
    <DropdownMenuLabel>{t("tabsLabel")}</DropdownMenuLabel>
    {tabs.map((tab) => (
     <DropdownMenuItem key={tab.key} onSelect={() => onActiveViewChange(tab.key)}>
      {tab.label}
      {activeView === tab.key ? <Check /> : null}
     </DropdownMenuItem>
    ))}
   </DropdownMenuContent>
  </DropdownMenu>
 );
});
