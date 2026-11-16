"use client";

import { memo, useRef, useState } from "react";
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
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

export type BusinessChineseNavTab<T extends string = string> = {
 key: T;
 label: string;
};

type BusinessChineseWorkspaceNavMenuProps<T extends string = string> = {
 tabs: ReadonlyArray<BusinessChineseNavTab<T>>;
 activeView: T;
 onActiveViewChange: (view: T) => void;
 compact?: boolean;
 className?: string;
};

export const BusinessChineseWorkspaceNavMenu = memo(function BusinessChineseWorkspaceNavMenu<
 T extends string = string,
>({
 tabs,
 activeView,
 onActiveViewChange,
 compact = false,
 className,
}: BusinessChineseWorkspaceNavMenuProps<T>) {
 const t = useTranslations("BusinessChinese");
 const common = useTranslations("Common.actions");
 const coarsePointer = useCoarsePointer();
 const [open, setOpen] = useState(false);
 const trigger = useRef<HTMLButtonElement>(null);
 const touch = compact || coarsePointer;

 if (tabs.length === 0) return null;

 return touch ? (
  <>
   <Button
    ref={trigger}
    variant="navigation"
    size="icon-toolbar"
    className={className}
    aria-label={t("moreSectionsLabel")}
    title={t("moreSectionsLabel")}
    aria-haspopup="dialog"
    aria-expanded={open}
    onClick={() => setOpen(true)}
   >
    <MoreHorizontal />
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent
     size="sm"
     closeLabel={common("close")}
     aria-describedby={undefined}
     onCloseAutoFocus={(event) => {
      event.preventDefault();
      trigger.current?.focus();
     }}
    >
     <DialogHeader>
      <DialogTitle>{t("tabsLabel")}</DialogTitle>
     </DialogHeader>
     <DialogBody className="content-start gap-1">
      {tabs.map((tab) => (
       <Button
        key={tab.key}
        variant={activeView === tab.key ? "menuActive" : "menu"}
        size="menu"
        align="between"
        onClick={() => {
         onActiveViewChange(tab.key);
         setOpen(false);
        }}
       >
        {tab.label}
        {activeView === tab.key ? <Check /> : null}
       </Button>
      ))}
     </DialogBody>
    </DialogContent>
   </Dialog>
  </>
 ) : (
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
