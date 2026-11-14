"use client";

import { Eraser, Hand, Highlighter, Pen, Redo2, Trash2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { PEN_COLORS, type usePdfPageInk } from "@/features/reading/pdf/usePdfPageInk";

type PdfPageInk = ReturnType<typeof usePdfPageInk>;

/** Sticky ink tool row plus the pen/highlighter and eraser option cards. */
export function PdfInkToolbar({
 ink,
 canEdit,
 strokeCount,
}: {
 ink: PdfPageInk;
 canEdit: boolean;
 strokeCount: number;
}) {
 const t = useTranslations("Reader.pdf");
 const { drawingTool, setDrawingTool, touchInk, setTouchInk, color, setColor, width, setWidth } =
  ink;
 const { eraserSize, setEraserSize, past, future, undo, redo, clear } = ink;

 return (
  <>
   <div className="sticky top-2 z-30 flex justify-center">
    <Card
     variant="elevated"
     padding="sm"
     className="flex max-w-full flex-wrap items-center justify-center gap-1"
    >
     <Button
      type="button"
      size="icon-toolbar"
      variant={drawingTool === null ? "active" : "ghost"}
      aria-label={t("pan")}
      onClick={() => setDrawingTool(null)}
     >
      <Hand />
     </Button>
     <Button
      type="button"
      size="icon-toolbar"
      variant={drawingTool === "pen" ? "active" : "ghost"}
      aria-label={t("pen")}
      disabled={!canEdit}
      onClick={() => setDrawingTool("pen")}
     >
      <Pen />
     </Button>
     <Button
      type="button"
      size="icon-toolbar"
      variant={drawingTool === "highlighter" ? "active" : "ghost"}
      aria-label={t("highlighter")}
      disabled={!canEdit}
      onClick={() => setDrawingTool("highlighter")}
     >
      <Highlighter />
     </Button>
     <Button
      type="button"
      size="icon-toolbar"
      variant={drawingTool === "eraser" ? "active" : "ghost"}
      aria-label={t("eraser")}
      disabled={!canEdit}
      onClick={() => setDrawingTool("eraser")}
     >
      <Eraser />
     </Button>
     <span className="h-6 w-px bg-border" aria-hidden="true" />
     <Button
      type="button"
      size="icon-toolbar"
      variant="ghost"
      aria-label={t("undo")}
      disabled={!canEdit || past.length === 0}
      onClick={undo}
     >
      <Undo2 />
     </Button>
     <Button
      type="button"
      size="icon-toolbar"
      variant="ghost"
      aria-label={t("redo")}
      disabled={!canEdit || future.length === 0}
      onClick={redo}
     >
      <Redo2 />
     </Button>
     <Button
      type="button"
      size="icon-toolbar"
      variant="ghost"
      aria-label={t("clear")}
      disabled={!canEdit || strokeCount === 0}
      onClick={clear}
     >
      <Trash2 />
     </Button>
     <Button
      type="button"
      size="icon-toolbar"
      variant={touchInk ? "active" : "ghost"}
      aria-label={t("touch")}
      disabled={!canEdit}
      aria-pressed={touchInk}
      onClick={() => setTouchInk((current) => !current)}
     >
      <Pen />
     </Button>
    </Card>
   </div>
   {drawingTool !== null && drawingTool !== "eraser" ? (
    <Card
     variant="elevated"
     padding="sm"
     className="sticky top-16 z-20 flex max-w-full flex-wrap items-center justify-center gap-2 self-center"
    >
     <div className="flex items-center gap-1" aria-label={t("penColor")}>
      {PEN_COLORS.map((preset) => (
       <Button
        key={preset}
        type="button"
        size="icon-xs"
        variant={color === preset ? "active" : "ghost"}
        aria-label={`Chọn màu ${preset}`}
        aria-pressed={color === preset}
        style={{ backgroundColor: preset }}
        onClick={() => setColor(preset)}
       >
        <span className="sr-only">{preset}</span>
       </Button>
      ))}
      <Input
       type="color"
       value={color}
       aria-label={t("customColor")}
       onChange={(event) => setColor(event.target.value)}
      />
     </div>
     <label className="flex min-w-44 items-center gap-2 text-xs font-bold">
      <span>{t("strokeWidth", { width })}</span>
      <Input
       type="range"
       min={1}
       max={12}
       value={width}
       aria-label={t("strokeWidth", { width })}
       onChange={(event) => setWidth(Number(event.target.value))}
      />
     </label>
    </Card>
   ) : null}
   {drawingTool === "eraser" ? (
    <Card
     asChild
     variant="elevated"
     padding="sm"
     className="sticky top-16 z-20 flex max-w-xs items-center gap-2 self-center"
    >
     <label>
      <span>{t("eraserSize", { size: eraserSize })}</span>
      <Input
       type="range"
       min={12}
       max={56}
       value={eraserSize}
       aria-label={t("eraserSize", { size: eraserSize })}
       onChange={(event) => setEraserSize(Number(event.target.value))}
      />
     </label>
    </Card>
   ) : null}
  </>
 );
}
