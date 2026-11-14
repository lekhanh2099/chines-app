"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import {
 Download,
 Eye,
 PanelLeft,
 PanelLeftClose,
 PanelTopClose,
 PanelTopOpen,
 Pencil,
 Plus,
 Settings2,
 Trash2,
 Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Separator } from "@/components/ui/layout/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/overlays/sheet";
import { Typography } from "@/components/ui/display/typography";
import { useRouter } from "@/i18n/navigation";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";

/** Bottom sheet with the note editor's mode, split view and note actions on small viewports. */
export function NoteEditorMobileActionsSheet({
 noteId,
 mobileActionsOpen,
 setMobileActionsOpen,
 mobileActionsTriggerRef,
 importInputRef,
 isReadOnlyMode,
 setReadOnlyOverride,
 isSplitView,
 handleToggleSplitView,
 isToolbarVisible,
 setIsToolbarVisible,
 setMetadataOpen,
 setShowDeleteConfirm,
 isImporting,
 focusModeEnabled,
 handleExport,
}: {
 noteId: string;
 mobileActionsOpen: boolean;
 setMobileActionsOpen: Dispatch<SetStateAction<boolean>>;
 mobileActionsTriggerRef: RefObject<HTMLButtonElement | null>;
 importInputRef: RefObject<HTMLInputElement | null>;
 isReadOnlyMode: boolean;
 setReadOnlyOverride: (readOnly: boolean) => void;
 isSplitView: boolean;
 handleToggleSplitView: () => void;
 isToolbarVisible: boolean;
 setIsToolbarVisible: Dispatch<SetStateAction<boolean>>;
 setMetadataOpen: Dispatch<SetStateAction<boolean>>;
 setShowDeleteConfirm: Dispatch<SetStateAction<boolean>>;
 isImporting: boolean;
 focusModeEnabled: boolean;
 handleExport: () => void;
}) {
 const t = useTranslations("Notes.editor");
 const router = useRouter();
 const { closeTab } = noteTabsStore.actions;
 const toolbarLabel = isToolbarVisible ? t("hideToolbar") : t("showToolbar");

 return (
  <Sheet
   open={mobileActionsOpen}
   onOpenChange={setMobileActionsOpen}
   side="bottom"
   height="tall"
   onCloseAutoFocus={(event) => {
    event.preventDefault();
    mobileActionsTriggerRef.current?.focus();
   }}
  >
   <SheetHeader title={t("options")} onClose={() => setMobileActionsOpen(false)} />
   <SheetBody className="grid content-start gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
    <section className="grid gap-1">
     <Typography
      as="h3"
      variant="overline"
      tone="muted"
      weight="black"
      transform="uppercase"
      className="px-2.5"
     >
      {t("readMode")}
     </Typography>
     <Button
      type="button"
      variant={!isReadOnlyMode ? "active" : "menu"}
      size="touch"
      align="start"
      className="w-full"
      onClick={() => {
       setReadOnlyOverride(!isReadOnlyMode);
       setMobileActionsOpen(false);
      }}
     >
      {isReadOnlyMode ? <Pencil data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
      {isReadOnlyMode ? t("editMode") : t("viewModeAction")}
     </Button>
     <Button
      type="button"
      variant={isSplitView ? "active" : "menu"}
      size="touch"
      align="start"
      className="w-full"
      onClick={() => {
       handleToggleSplitView();
       setMobileActionsOpen(false);
      }}
     >
      {isSplitView ? (
       <PanelLeftClose data-icon="inline-start" />
      ) : (
       <PanelLeft data-icon="inline-start" />
      )}
      {isSplitView ? t("closeSplit") : t("openSplit")}
     </Button>
     {!isReadOnlyMode ? (
      <Button
       type="button"
       variant={isToolbarVisible ? "active" : "menu"}
       size="touch"
       align="start"
       className="w-full"
       onClick={() => {
        setIsToolbarVisible((current) => !current);
        setMobileActionsOpen(false);
       }}
      >
       {isToolbarVisible ? (
        <PanelTopClose data-icon="inline-start" />
       ) : (
        <PanelTopOpen data-icon="inline-start" />
       )}
       {toolbarLabel}
      </Button>
     ) : null}
    </section>

    <Separator />

    <section className="grid gap-1">
     <Typography
      as="h3"
      variant="overline"
      tone="muted"
      weight="black"
      transform="uppercase"
      className="px-2.5"
     >
      {t("noteSection")}
     </Typography>
     <Button
      type="button"
      variant="menu"
      size="touch"
      align="start"
      className="w-full"
      onClick={() => {
       setMobileActionsOpen(false);
       requestAnimationFrame(() => setMetadataOpen(true));
      }}
     >
      <Settings2 data-icon="inline-start" />
      {t("metadata")}
     </Button>
     <Button
      type="button"
      variant="menu"
      size="touch"
      align="start"
      className="w-full"
      disabled={isImporting}
      onClick={() => {
       setMobileActionsOpen(false);
       requestAnimationFrame(() => importInputRef.current?.click());
      }}
     >
      <Upload data-icon="inline-start" />
      {t("importAction")}
     </Button>
     <Button
      type="button"
      variant="menu"
      size="touch"
      align="start"
      className="w-full"
      onClick={() => {
       handleExport();
       setMobileActionsOpen(false);
      }}
     >
      <Download data-icon="inline-start" />
      {t("exportAction")}
     </Button>
     <Button
      type="button"
      variant="menu"
      size="touch"
      align="start"
      className="w-full"
      disabled={focusModeEnabled}
      onClick={() => {
       setMobileActionsOpen(false);
       router.push("/notes?action=new");
      }}
     >
      <Plus data-icon="inline-start" />
      {t("openNew")}
     </Button>
     <Button
      type="button"
      variant="menu"
      size="touch"
      align="start"
      className="w-full"
      disabled={focusModeEnabled}
      onClick={() => {
       closeTab(noteId);
       setMobileActionsOpen(false);
      }}
     >
      <PanelLeftClose data-icon="inline-start" />
      {t("closeCurrentTab")}
     </Button>
     <Button
      type="button"
      variant="menuDestructive"
      size="touch"
      align="start"
      className="w-full"
      onClick={() => {
       setMobileActionsOpen(false);
       requestAnimationFrame(() => setShowDeleteConfirm(true));
      }}
     >
      <Trash2 data-icon="inline-start" />
      {t("delete")}
     </Button>
    </section>
   </SheetBody>
  </Sheet>
 );
}
