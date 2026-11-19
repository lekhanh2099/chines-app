"use client";

import { useRef, useState, type RefObject } from "react";
import {
 ChevronLeft,
 ChevronRight,
 CloudAlert,
 CloudCheck,
 CloudUpload,
 Ellipsis,
 Eraser,
 Expand,
 FileX,
 Hand,
 Highlighter,
 Loader2,
 Minimize,
 Pen,
 Pointer,
 Redo2,
 Replace,
 Trash2,
 Undo2,
 ZoomIn,
 ZoomOut,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import { cn } from "@/lib/utils";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/overlays/base-popover";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import {
 nextPdfZoom,
 PDF_MAX_ZOOM,
 PDF_MIN_ZOOM,
 previousPdfZoom,
} from "@/features/reading/pdf/pdf-viewer-utils";
import type { usePdfAnnotations } from "@/features/reading/pdf/usePdfAnnotations";
import { PEN_COLORS, type usePdfPageInk } from "@/features/reading/pdf/usePdfPageInk";
import type { usePdfPageViewport } from "@/features/reading/pdf/usePdfPageViewport";

type PdfPageInk = ReturnType<typeof usePdfPageInk>;
type PdfAnnotations = ReturnType<typeof usePdfAnnotations>;
type PdfViewport = ReturnType<typeof usePdfPageViewport>;

/**
 * The single GoodNotes-style command bar of a note PDF: pages on the left,
 * ink tools in the middle, view/save/menu on the right. Tapping the active
 * pen, highlighter or eraser again opens its size options.
 */
export function NotePdfToolbar({
 fileName,
 pageNumber,
 pageCount,
 onGoToPage,
 ink,
 annotations,
 viewport,
 onReplace,
 onRemove,
}: {
 fileName: string;
 pageNumber: number;
 pageCount: number;
 onGoToPage: (page: number) => void;
 ink: PdfPageInk;
 annotations: PdfAnnotations;
 viewport: Pick<
  PdfViewport,
  "zoom" | "setZoom" | "fitToContainer" | "setFitToContainer" | "isFullscreen" | "toggleFullscreen"
 >;
 onReplace: () => void;
 onRemove: () => void;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const reader = useTranslations("Reader.pdf");
 const { canEdit, strokes } = annotations;
 const { drawingTool, setDrawingTool, color } = ink;
 const [pageDraft, setPageDraft] = useState(String(pageNumber));
 const [optionsOpen, setOptionsOpen] = useState(false);
 const penRef = useRef<HTMLButtonElement>(null);
 const highlighterRef = useRef<HTMLButtonElement>(null);
 const eraserRef = useRef<HTMLButtonElement>(null);
 const optionsAnchor: RefObject<HTMLButtonElement | null> =
  drawingTool === "eraser" ? eraserRef : drawingTool === "highlighter" ? highlighterRef : penRef;

 const chooseTool = (tool: PdfPageInk["drawingTool"]) => {
  if (tool !== null && drawingTool === tool) {
   setOptionsOpen((current) => !current);
   return;
  }
  setOptionsOpen(false);
  setDrawingTool(tool);
 };
 const save = () => void annotations.retrySave().catch(() => {});

 return (
  <div className="@container flex min-h-12 min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border bg-surface px-2 py-1">
   <div className="flex min-w-0 items-center gap-1">
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={t("previousPage")}
     disabled={pageNumber <= 1}
     onClick={() => onGoToPage(pageNumber - 1)}
    >
     <ChevronLeft />
    </Button>
    <form
     className="flex items-center gap-1"
     title={fileName}
     onSubmit={(event) => {
      event.preventDefault();
      if (pageDraft) onGoToPage(Number(pageDraft));
      else setPageDraft(String(pageNumber));
     }}
    >
     <Input
      aria-label={t("goToPage")}
      inputMode="numeric"
      enterKeyHint="go"
      className="w-12 text-center"
      value={pageDraft}
      onChange={(event) => setPageDraft(event.target.value.replace(/\D/gu, ""))}
      onBlur={() => setPageDraft(String(pageNumber))}
     />
     <Typography as="span" variant="caption" tone="muted" className="whitespace-nowrap">
      / {pageCount}
     </Typography>
    </form>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={t("nextPage")}
     disabled={pageNumber >= pageCount}
     onClick={() => onGoToPage(pageNumber + 1)}
    >
     <ChevronRight />
    </Button>
   </div>

   <div
    className="flex min-w-0 flex-wrap items-center justify-center gap-0.5"
    role="toolbar"
    aria-label={t("tools")}
   >
    <Button
     type="button"
     size="icon-toolbar"
     variant={drawingTool === null ? "active" : "ghost"}
     aria-label={reader("pan")}
     aria-pressed={drawingTool === null}
     onClick={() => chooseTool(null)}
    >
     <Hand />
    </Button>
    <Button
     ref={penRef}
     type="button"
     size="icon-toolbar"
     variant={drawingTool === "pen" ? "active" : "ghost"}
     aria-label={reader("pen")}
     aria-pressed={drawingTool === "pen"}
     disabled={!canEdit}
     onClick={() => chooseTool("pen")}
    >
     <Pen />
    </Button>
    <Button
     ref={highlighterRef}
     type="button"
     size="icon-toolbar"
     variant={drawingTool === "highlighter" ? "active" : "ghost"}
     aria-label={reader("highlighter")}
     aria-pressed={drawingTool === "highlighter"}
     disabled={!canEdit}
     onClick={() => chooseTool("highlighter")}
    >
     <Highlighter />
    </Button>
    <Button
     ref={eraserRef}
     type="button"
     size="icon-toolbar"
     variant={drawingTool === "eraser" ? "active" : "ghost"}
     aria-label={reader("eraser")}
     aria-pressed={drawingTool === "eraser"}
     disabled={!canEdit}
     onClick={() => chooseTool("eraser")}
    >
     <Eraser />
    </Button>

    {drawingTool === "pen" ? (
     <>
      <NotePdfColorSwatches ink={ink} className="hidden @[52rem]:flex" />
      <Button
       type="button"
       size="icon-toolbar"
       variant="ghost"
       className="@[52rem]:hidden"
       aria-label={reader("penColor")}
       aria-haspopup="dialog"
       onClick={() => setOptionsOpen(true)}
      >
       <span
        aria-hidden="true"
        className="size-5 rounded-full border border-border-strong"
        style={{ backgroundColor: color }}
       />
      </Button>
     </>
    ) : null}

    <span className="h-6 w-px bg-border" aria-hidden="true" />
    <Button
     type="button"
     size="icon-toolbar"
     variant="ghost"
     aria-label={reader("undo")}
     disabled={!canEdit || ink.past.length === 0}
     onClick={ink.undo}
    >
     <Undo2 />
    </Button>
    <Button
     type="button"
     size="icon-toolbar"
     variant="ghost"
     aria-label={reader("redo")}
     disabled={!canEdit || ink.future.length === 0}
     onClick={ink.redo}
    >
     <Redo2 />
    </Button>
   </div>

   <div className="flex items-center gap-0.5">
    <NotePdfZoomControl viewport={viewport} />

    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={reader("fullscreen")}
     aria-pressed={viewport.isFullscreen}
     onClick={() => void viewport.toggleFullscreen()}
    >
     {viewport.isFullscreen ? <Minimize /> : <Expand />}
    </Button>

    <NotePdfSaveButton annotations={annotations} onSave={save} />

    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button type="button" variant="ghost" size="icon-toolbar" aria-label={t("more")}>
       <Ellipsis />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" width="md">
      <DropdownMenuCheckboxItem
       checked={ink.touchInk}
       onSelect={(event) => event.preventDefault()}
       onCheckedChange={(checked) => ink.setTouchInk(checked === true)}
      >
       <Pointer />
       <span>{t("fingerInk")}</span>
      </DropdownMenuCheckboxItem>
      <DropdownMenuItem disabled={!canEdit || strokes.length === 0} onSelect={ink.clear}>
       <Trash2 />
       <span>{t("clearPage")}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onReplace}>
       <Replace />
       <span>{t("replace")}</span>
      </DropdownMenuItem>
      <DropdownMenuItem tone="destructive" onSelect={onRemove}>
       <FileX />
       <span>{t("remove")}</span>
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>

   <Popover.Root open={optionsOpen && drawingTool !== null} onOpenChange={setOptionsOpen}>
    <Popover.Portal>
     <BasePopoverPositioner
      anchor={optionsAnchor}
      side="bottom"
      align="center"
      sideOffset={8}
      collisionPadding={8}
     >
      <BasePopoverPopup variant="menu">
       <NotePdfToolOptions ink={ink} />
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </Popover.Portal>
   </Popover.Root>
  </div>
 );
}

/** Zoom level button; its popover holds zoom out, fit width and zoom in. */
function NotePdfZoomControl({
 viewport,
}: {
 viewport: Pick<PdfViewport, "zoom" | "setZoom" | "fitToContainer" | "setFitToContainer">;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const reader = useTranslations("Reader.pdf");

 return (
  <Popover.Root>
   <Popover.Trigger
    render={
     <Button type="button" variant="ghost" size="toolbar" aria-label={t("zoom")}>
      {viewport.fitToContainer ? reader("fitWidth") : `${Math.round(viewport.zoom)}%`}
     </Button>
    }
   />
   <Popover.Portal>
    <BasePopoverPositioner side="bottom" align="end" sideOffset={6} collisionPadding={8}>
     <BasePopoverPopup variant="actions">
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       aria-label={reader("zoomOut")}
       disabled={!viewport.fitToContainer && viewport.zoom <= PDF_MIN_ZOOM}
       onClick={() => {
        viewport.setFitToContainer(false);
        viewport.setZoom(previousPdfZoom(viewport.zoom));
       }}
      >
       <ZoomOut />
      </Button>
      <Button
       type="button"
       variant={viewport.fitToContainer ? "active" : "ghost"}
       size="toolbar"
       aria-pressed={viewport.fitToContainer}
       onClick={() => viewport.setFitToContainer(true)}
      >
       {reader("fitWidth")}
      </Button>
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       aria-label={reader("zoomIn")}
       disabled={!viewport.fitToContainer && viewport.zoom >= PDF_MAX_ZOOM}
       onClick={() => {
        viewport.setFitToContainer(false);
        viewport.setZoom(nextPdfZoom(viewport.zoom));
       }}
      >
       <ZoomIn />
      </Button>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}

/** The five pen colours. */
function NotePdfColorSwatches({ ink, className }: { ink: PdfPageInk; className?: string }) {
 const t = useTranslations("Notes.editor.pdf");
 const reader = useTranslations("Reader.pdf");
 // Names for PEN_COLORS, in the same order.
 const colorNames = [
  t("colors.red"),
  t("colors.blue"),
  t("colors.green"),
  t("colors.orange"),
  t("colors.black"),
 ];

 return (
  <div
   className={cn("flex items-center gap-0.5", className)}
   role="group"
   aria-label={reader("penColor")}
  >
   {PEN_COLORS.map((preset, index) => (
    <Button
     key={preset}
     type="button"
     size="icon-toolbar"
     variant={ink.color === preset ? "active" : "ghost"}
     aria-label={colorNames[index] ?? preset}
     aria-pressed={ink.color === preset}
     onClick={() => ink.setColor(preset)}
    >
     <span
      aria-hidden="true"
      className="size-5 rounded-full border border-border-strong"
      style={{ backgroundColor: preset }}
     />
    </Button>
   ))}
  </div>
 );
}

/** Stroke width (pen/highlighter) or eraser size, with a live preview. */
function NotePdfToolOptions({ ink }: { ink: PdfPageInk }) {
 const reader = useTranslations("Reader.pdf");
 const { drawingTool, width, setWidth, eraserSize, setEraserSize, color } = ink;

 if (drawingTool === "eraser") {
  return (
   <label className="grid gap-2 px-1">
    <Typography as="span" variant="label">
     {reader("eraserSize", { size: eraserSize })}
    </Typography>
    <Input
     type="range"
     min={12}
     max={56}
     value={eraserSize}
     onChange={(event) => setEraserSize(Number(event.target.value))}
    />
   </label>
  );
 }

 const highlighter = drawingTool === "highlighter";
 const previewWidth = highlighter ? Math.max(12, width * 4) : width;
 return (
  <div className="grid gap-3">
   {highlighter ? null : <NotePdfColorSwatches ink={ink} className="justify-center" />}
   <label className="grid gap-2 px-1">
    <Typography as="span" variant="label">
     {reader("strokeWidth", { width })}
    </Typography>
    <svg viewBox="0 0 200 40" className="h-10 w-full" aria-hidden="true">
     <path
      d="M 12 28 C 60 4, 120 36, 188 14"
      fill="none"
      stroke={highlighter ? "#facc15" : color}
      strokeOpacity={highlighter ? 0.42 : 1}
      strokeLinecap="round"
      strokeWidth={Math.min(previewWidth, 30)}
     />
    </svg>
    <Input
     type="range"
     min={1}
     max={12}
     value={width}
     onChange={(event) => setWidth(Number(event.target.value))}
    />
   </label>
  </div>
 );
}

/** Cloud icon: saved, unsaved (tap to save now), saving, or failed (tap to retry). */
function NotePdfSaveButton({
 annotations,
 onSave,
}: {
 annotations: PdfAnnotations;
 onSave: () => void;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const reader = useTranslations("Reader.pdf");

 if (annotations.loadFailed) {
  return (
   <Button
    type="button"
    variant="ghost"
    size="icon-toolbar"
    aria-label={reader("annotationError")}
    title={reader("annotationError")}
    onClick={() => void annotations.retryLoad()}
   >
    <CloudAlert className="text-danger-text" />
   </Button>
  );
 }
 if (annotations.saveFailed && !annotations.conflict.active) {
  return (
   <Button
    type="button"
    variant="ghost"
    size="icon-toolbar"
    aria-label={t("saveError")}
    title={t("saveError")}
    onClick={onSave}
   >
    <CloudAlert className="text-danger-text" />
   </Button>
  );
 }
 if (annotations.isSaving) {
  return (
   <Button type="button" variant="ghost" size="icon-toolbar" aria-label={t("saving")} disabled>
    <Loader2 className="animate-spin" />
   </Button>
  );
 }
 if (annotations.isQueued) {
  return (
   <Button
    type="button"
    variant="active"
    size="icon-toolbar"
    aria-label={t("save")}
    title={t("unsavedHint")}
    onClick={onSave}
   >
    <CloudUpload />
   </Button>
  );
 }
 return (
  <Button
   type="button"
   variant="ghost"
   size="icon-toolbar"
   aria-label={t("saved")}
   title={t("saved")}
   disabled={!annotations.canEdit}
   onClick={onSave}
  >
   <CloudCheck />
  </Button>
 );
}
