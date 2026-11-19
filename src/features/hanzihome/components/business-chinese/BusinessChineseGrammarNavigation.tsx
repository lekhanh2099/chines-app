"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import type { TextbookLesson } from "@/features/hanzihome/static-json/textbook-catalog";
import { GrammarSectionNavigation } from "./BusinessChineseSectionNavigation";

/** Owns the compact grammar table-of-contents sheet and its focus-return targets. */
export function useBusinessChineseGrammarNavigation() {
 const [isOpen, setIsOpen] = useState(false);
 const triggerRef = useRef<HTMLButtonElement>(null);
 const panelRef = useRef<HTMLElement>(null);
 return { isOpen, setIsOpen, triggerRef, panelRef };
}

export type BusinessChineseGrammarNavigationControls = ReturnType<
 typeof useBusinessChineseGrammarNavigation
>;

export function BusinessChineseGrammarNavigationSummary({
 sectionCount,
 showPipButton,
 isPipActive,
 onOpenPip,
}: {
 sectionCount: number;
 showPipButton: boolean;
 isPipActive: boolean;
 onOpenPip: () => void;
}) {
 return (
  <>
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
    <Badge variant="default" size="sm">
     {`${sectionCount} điểm ngữ pháp`}
    </Badge>
    {showPipButton ? (
     <Button
      type="button"
      size="compact"
      variant={isPipActive ? "active" : "outline"}
      onClick={onOpenPip}
      title="Mở cửa sổ nổi PiP để ôn tập ngữ pháp"
     >
      <PictureInPicture2 className="size-3.5" />
      <span>{isPipActive ? "Đang mở PiP" : "Cửa sổ nổi (PiP)"}</span>
     </Button>
    ) : null}
   </div>
   <Typography variant="bodySmall" tone="secondary">
    Cấu trúc ngữ pháp và câu ví dụ kèm phiên âm
   </Typography>
  </>
 );
}

export function BusinessChineseGrammarNavigationPanel({
 panelRef,
 summary,
 sections,
 onSelect,
}: {
 panelRef: BusinessChineseGrammarNavigationControls["panelRef"];
 summary: ReactNode;
 sections: TextbookLesson["sections"];
 onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");
 return (
  <Card
   asChild
   variant="section"
   padding="sm"
   className="max-h-full min-w-0 self-start overflow-y-auto scrollbar-soft"
  >
   <aside ref={panelRef} tabIndex={-1} aria-label={t("tocLabel")}>
    <div className="grid min-w-0 gap-2">
     <Typography variant="overline" tone="muted">
      {t("tocLabel")}
     </Typography>
     {summary}
     <GrammarSectionNavigation sections={sections} onSelect={onSelect} />
    </div>
   </aside>
  </Card>
 );
}

export function BusinessChineseGrammarNavigationSheet({
 isOpen,
 setIsOpen,
 triggerRef,
 panelRef,
 summary,
 sections,
 onSelect,
}: {
 isOpen: BusinessChineseGrammarNavigationControls["isOpen"];
 setIsOpen: BusinessChineseGrammarNavigationControls["setIsOpen"];
 triggerRef: BusinessChineseGrammarNavigationControls["triggerRef"];
 panelRef: BusinessChineseGrammarNavigationControls["panelRef"];
 summary: ReactNode;
 sections: TextbookLesson["sections"];
 onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");
 const common = useTranslations("Common");
 return (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
   <DialogContent
    size="sm"
    onCloseAutoFocus={(event) => {
     event.preventDefault();
     setIsOpen(false);
     const focusTarget = triggerRef.current ?? panelRef.current;
     focusTarget?.focus({ preventScroll: true });
    }}
    closeLabel={common("actions.close")}
    aria-describedby={undefined}
   >
    <DialogHeader>
     <DialogTitle>{t("tocLabel")}</DialogTitle>
    </DialogHeader>
    <DialogBody className="grid content-start gap-3">
     {summary}
     <GrammarSectionNavigation
      sections={sections}
      onSelect={(sectionId) => {
       setIsOpen(false);
       onSelect(sectionId);
      }}
     />
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
