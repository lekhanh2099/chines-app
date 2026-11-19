"use client";

import type { ComponentProps, Dispatch, RefObject, SetStateAction } from "react";
import type { MutationStatus } from "@tanstack/react-query";
import {
 Download,
 Eye,
 FileText,
 PanelLeft,
 PanelLeftClose,
 PanelTopClose,
 PanelTopOpen,
 Pencil,
 Trash2,
 Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { NoteLibraryMetadataDialog } from "@/features/notes/components/NoteLibraryMetadataDialog";
import { SaveStatusBadge } from "./NoteEditorSaveStatusBadge";

const noteEditorActionButtonClassName = "shrink-0 rounded-full";

/** Inline note editor actions rendered into the desktop header slot. */
export function NoteEditorDesktopActions({
 note,
 displaySaveStatus,
 handleRetrySave,
 importInputRef,
 isReadOnlyMode,
 setReadOnlyOverride,
 isToolbarVisible,
 setIsToolbarVisible,
 isSplitView,
 handleToggleSplitView,
 isImporting,
 handleExport,
 setShowDeleteConfirm,
 isPdfView,
 handleTogglePdfView,
}: {
 note: ComponentProps<typeof NoteLibraryMetadataDialog>["note"];
 displaySaveStatus: MutationStatus;
 handleRetrySave: () => void;
 importInputRef: RefObject<HTMLInputElement | null>;
 isReadOnlyMode: boolean;
 setReadOnlyOverride: (readOnly: boolean) => void;
 isToolbarVisible: boolean;
 setIsToolbarVisible: Dispatch<SetStateAction<boolean>>;
 isSplitView: boolean;
 handleToggleSplitView: () => void;
 isImporting: boolean;
 handleExport: () => void;
 setShowDeleteConfirm: Dispatch<SetStateAction<boolean>>;
 isPdfView: boolean;
 handleTogglePdfView: () => void;
}) {
 const t = useTranslations("Notes.editor");
 const editModeLabel = isReadOnlyMode ? t("editMode") : t("viewMode");
 const toolbarLabel = isToolbarVisible ? t("hideToolbar") : t("showToolbar");
 const splitLabel = isSplitView ? t("disableSplit") : t("enableSplit");
 const splitTitle = isSplitView ? t("disableSplitShortcut") : t("enableSplitShortcut");
 const pdfLabel = isPdfView ? t("pdf.close") : t("pdf.open");

 return (
  <div className="hidden min-w-max items-center gap-2 xl:flex">
   <SaveStatusBadge status={displaySaveStatus} onRetry={handleRetrySave} />
   <Button
    type="button"
    variant={!isReadOnlyMode ? "active" : "outline"}
    size="icon-sm"
    onClick={() => setReadOnlyOverride(!isReadOnlyMode)}
    title={editModeLabel}
    aria-label={editModeLabel}
    className={noteEditorActionButtonClassName}
   >
    {isReadOnlyMode ? <Eye /> : <Pencil />}
   </Button>
   {!isReadOnlyMode ? (
    <Button
     type="button"
     variant={isToolbarVisible ? "active" : "outline"}
     size="icon-sm"
     onClick={() => setIsToolbarVisible((current) => !current)}
     title={toolbarLabel}
     aria-label={toolbarLabel}
     className={noteEditorActionButtonClassName}
    >
     {isToolbarVisible ? <PanelTopClose /> : <PanelTopOpen />}
    </Button>
   ) : null}
   <Button
    type="button"
    variant={isPdfView ? "active" : "outline"}
    size="icon-sm"
    aria-pressed={isPdfView}
    onClick={handleTogglePdfView}
    title={pdfLabel}
    aria-label={pdfLabel}
    className={noteEditorActionButtonClassName}
   >
    <FileText />
   </Button>
   <Button
    type="button"
    variant={isSplitView ? "active" : "outline"}
    size="icon-sm"
    disabled={isImporting}
    onClick={handleToggleSplitView}
    title={splitTitle}
    aria-label={splitLabel}
    className={noteEditorActionButtonClassName}
   >
    {isSplitView ? <PanelLeftClose /> : <PanelLeft />}
   </Button>
   <Button
    type="button"
    variant="outline"
    size="icon-sm"
    disabled={isImporting}
    onClick={() => importInputRef.current?.click()}
    title={t("import")}
    aria-label={t("import")}
    className="hidden shrink-0 xl:inline-flex"
   >
    <Upload />
   </Button>
   <Button
    type="button"
    variant="outline"
    size="icon-sm"
    onClick={handleExport}
    title={t("export")}
    aria-label={t("export")}
    className="hidden shrink-0 xl:inline-flex"
   >
    <Download />
   </Button>
   <NoteLibraryMetadataDialog note={note} />
   <Button
    type="button"
    variant="outline"
    size="icon-sm"
    title={t("delete")}
    aria-label={t("delete")}
    className="shrink-0"
    onClick={() => setShowDeleteConfirm(true)}
   >
    <Trash2 />
   </Button>
  </div>
 );
}
