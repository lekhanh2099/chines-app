"use client";

import {
 Download,
 Eraser,
 Expand,
 ExternalLink,
 Hand,
 Highlighter,
 Info,
 Pen,
 Redo2,
 Trash2,
 Undo2,
 ZoomIn,
 ZoomOut,
} from "lucide-react";
import {
 useEffect,
 useMemo,
 useRef,
 useState,
 type PointerEvent,
 type TouchEvent,
 type WheelEvent,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { cn } from "@/lib/utils";

import {
 appendPdfStrokePoint,
 createPdfStroke,
 erasePdfStrokesAtPoint,
 pdfAnnotationPayloadSchema,
 pdfStrokePath,
 type PdfDrawingTool,
 type PdfPoint,
 type PdfStroke,
} from "./pdf-annotations";
import { fetchPdfAnnotation, savePdfAnnotation } from "./pdf-annotation-api";
import {
 clampPdfZoom,
 nextPdfZoom,
 PDF_MAX_ZOOM,
 PDF_MIN_ZOOM,
 pdfPageWidthRem,
 previousPdfZoom,
 normalizedPdfPoint,
} from "./pdf-viewer-utils";
import type { ReaderPdfAsset } from "./reader.schemas";
import { hanzihomeQueryKeys } from "../query-keys";
type PdfEditorTool = PdfDrawingTool | "eraser";

export function pdfAssetIdForDocument(
 resourceFile: string,
 pdfPage: number,
 assets: ReadonlyArray<ReaderPdfAsset>,
): string | null {
 const asset = assets.find(
  (candidate) => candidate.resourceFile === resourceFile && candidate.pdfPage === pdfPage,
 );
 return asset?.id ?? null;
}

const PEN_COLORS = ["#ef4444", "#2563eb", "#16a34a", "#f59e0b", "#111827"];

function pdfHref(asset: ReaderPdfAsset) {
 return `/resources/${asset.resourceFile}#page=${asset.pdfPage}`;
}

function importedPdfAssetId(asset: ReaderPdfAsset) {
 return `hanzihome-studio-asset:public/resources/${asset.resourceFile}`;
}

function updateStrokeAtId(strokes: readonly PdfStroke[], id: string, point: PdfPoint) {
 return strokes.map((stroke) => (stroke.id === id ? appendPdfStrokePoint(stroke, point) : stroke));
}

type PdfReaderWorkspaceProps = {
 initialAssetId?: string;
 heading?: string;
 description?: string;
 badgeLabel?: string;
 backHref?: string;
 backLabel?: string;
 metadata?: string;
 notice?: string;
 studyTasks?: string[];
 badges?: string[];
 initialAssets: ReadonlyArray<ReaderPdfAsset>;
 showAssetPicker?: boolean;
};

export function PdfReaderWorkspace({
 initialAssetId,
 heading = "Tài liệu Hán ngữ",
 description = "Trang preview đã được kiểm checksum; mở PDF gốc khi cần chuyển tới trang bất kỳ.",
 badgeLabel = "Reader PDF",
 backHref,
 backLabel = "Quay lại",
 metadata,
 notice,
 studyTasks = [],
 badges = [],
 initialAssets,
 showAssetPicker = true,
}: PdfReaderWorkspaceProps) {
 const assets = initialAssets;
 const [selectedAssetId, setSelectedAssetId] = useState(initialAssetId ?? assets[0]?.id ?? "");
 const selectedAsset = useMemo(
  () => assets.find((asset) => asset.id === selectedAssetId) ?? assets[0],
  [assets, selectedAssetId],
 );

 if (!selectedAsset) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     Chưa có tài liệu PDF được import.
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      {backHref ? (
       <Button
        type="button"
        variant="ghost"
        size="sm"
        asChild
        className="justify-self-start justify-self-start"
       >
        <a href={backHref}>{backLabel}</a>
       </Button>
      ) : null}
      <Badge variant="purple" className="justify-self-start">
       {badgeLabel}
      </Badge>
      <Typography as="h1" variant="sectionTitle" weight="black">
       {heading}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {metadata ?? description}
      </Typography>
     </div>
     <div className="flex max-w-full flex-wrap items-start justify-end gap-2">
      {notice ? (
       <Popover.Root>
        <Popover.Trigger
         render={
          <Button type="button" variant="outline" size="sm">
           <Info data-icon="inline-start" />
           Hướng dẫn luyện
          </Button>
         }
        />
        <Popover.Portal>
         <BasePopoverPositioner side="bottom" align="end" sideOffset={8} collisionPadding={8}>
          <BasePopoverPopup variant="default" initialFocus={false} finalFocus={false}>
           <div className="grid max-w-sm gap-2 p-3 text-sm leading-6 text-foreground-muted">
            <Typography as="p" variant="bodySmall" tone="muted">
             {notice}
            </Typography>
            {studyTasks.length > 0 ? (
             <ol className="grid gap-1 ps-5">
              {studyTasks.map((task) => (
               <li key={task}>{task}</li>
              ))}
             </ol>
            ) : null}
           </div>
          </BasePopoverPopup>
         </BasePopoverPositioner>
        </Popover.Portal>
       </Popover.Root>
      ) : null}
      {badges.length > 0 ? (
       <div className="flex flex-wrap justify-end gap-1">
        {badges.map((badge) => (
         <Badge key={badge}>{badge}</Badge>
        ))}
       </div>
      ) : notice ? null : (
       <Badge>{assets.length} trang preview</Badge>
      )}
     </div>
    </div>
    {showAssetPicker ? (
     <div
      className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-soft"
      aria-label="Chọn trang PDF"
     >
      {assets.map((asset) => (
       <Button
        key={asset.id}
        type="button"
        size="sm"
        variant={asset.id === selectedAsset.id ? "active" : "outline"}
        aria-pressed={asset.id === selectedAsset.id}
        onClick={() => setSelectedAssetId(asset.id)}
       >
        {asset.title.replace("Hán ngữ · ", "")}
       </Button>
      ))}
     </div>
    ) : null}
   </Card>
   <PdfPageViewer key={selectedAsset.id} asset={selectedAsset} />
  </div>
 );
}

function PdfPageViewer({ asset }: { asset: ReaderPdfAsset }) {
 const viewerRef = useRef<HTMLElement>(null);
 const pageRef = useRef<HTMLDivElement>(null);
 const activeStrokeRef = useRef("");
 const pinchDistanceRef = useRef<number | null>(null);
 const revisionRef = useRef(0);
 const pendingSaveRef = useRef<PdfStroke[] | null>(null);
 const savingRef = useRef(false);
 const queryClient = useQueryClient();
 const assetId = importedPdfAssetId(asset);
 const annotationQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerPdfAnnotation(assetId, asset.pdfPage),
  queryFn: () => fetchPdfAnnotation({ assetId, pageNumber: asset.pdfPage }),
  staleTime: 0,
 });
 const [zoom, setZoom] = useState(100);
 const [fitToContainer, setFitToContainer] = useState(true);
 const [isFullscreen, setIsFullscreen] = useState(false);
 const [imageFailed, setImageFailed] = useState(false);
 const [drawingTool, setDrawingTool] = useState<PdfEditorTool | null>(null);
 const [touchInk, setTouchInk] = useState(false);
 const [color, setColor] = useState(PEN_COLORS[0] ?? "#ef4444");
 const [width, setWidth] = useState(4);
 const [eraserSize, setEraserSize] = useState(24);
 const [localStrokes, setLocalStrokes] = useState<PdfStroke[] | null>(null);
 const [past, setPast] = useState<PdfStroke[][]>([]);
 const [future, setFuture] = useState<PdfStroke[][]>([]);
 const [saveError, setSaveError] = useState("");
 const remoteStrokes = annotationQuery.data?.payload.strokes ?? [];
 const strokes = localStrokes ?? remoteStrokes;

 useEffect(() => {
  if (annotationQuery.isSuccess) revisionRef.current = annotationQuery.data?.revision ?? 0;
 }, [annotationQuery.data, annotationQuery.isSuccess]);

 useEffect(() => {
  if (!annotationQuery.isSuccess || localStrokes === null) return;
  pendingSaveRef.current = localStrokes;
  if (savingRef.current) return;
  savingRef.current = true;
  void (async () => {
   while (pendingSaveRef.current !== null) {
    const snapshot = pendingSaveRef.current;
    pendingSaveRef.current = null;
    try {
     const saved = await savePdfAnnotation({
      assetId,
      pageNumber: asset.pdfPage,
      payload: pdfAnnotationPayloadSchema.parse({ strokes: snapshot }),
      expectedRevision: revisionRef.current,
     });
     revisionRef.current = saved?.revision ?? revisionRef.current;
     queryClient.setQueryData(
      hanzihomeQueryKeys.readerPdfAnnotation(assetId, asset.pdfPage),
      saved,
     );
     setSaveError("");
    } catch (error) {
     pendingSaveRef.current = null;
     setSaveError(error instanceof Error ? error.message : "Không lưu được ghi chú PDF.");
    }
   }
   savingRef.current = false;
  })();
 }, [annotationQuery.isSuccess, asset.pdfPage, assetId, localStrokes, queryClient]);

 useEffect(() => {
  const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === viewerRef.current);
  document.addEventListener("fullscreenchange", syncFullscreen);
  return () => document.removeEventListener("fullscreenchange", syncFullscreen);
 }, []);

 const checkpoint = () => {
  setPast((current) => [...current, strokes]);
  setFuture([]);
 };
 const replaceStrokes = (next: PdfStroke[]) => setLocalStrokes(next);
 const undo = () => {
  const previous = past.at(-1);
  if (!previous) return;
  setPast((current) => current.slice(0, -1));
  setFuture((current) => [strokes, ...current]);
  setLocalStrokes(previous);
 };
 const redo = () => {
  const next = future[0];
  if (!next) return;
  setFuture((current) => current.slice(1));
  setPast((current) => [...current, strokes]);
  setLocalStrokes(next);
 };
 const clear = () => {
  if (!strokes.length) return;
  checkpoint();
  setLocalStrokes([]);
 };
 const toggleFullscreen = async () => {
  const element = viewerRef.current;
  if (!element) return;
  if (document.fullscreenElement === element) {
   await document.exitFullscreen();
   return;
  }
  if (document.fullscreenEnabled) {
   try {
    await element.requestFullscreen();
    return;
   } catch {
    setIsFullscreen(true);
    return;
   }
  }
  setIsFullscreen((current) => !current);
 };
 const pointerCanInk = (event: PointerEvent<SVGSVGElement>) =>
  drawingTool !== null && (event.pointerType !== "touch" || touchInk);
 const pointFromEvent = (event: PointerEvent<SVGSVGElement>) =>
  normalizedPdfPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
 const beginStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (!pointerCanInk(event)) return;
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  checkpoint();
  const point = pointFromEvent(event);
  const tool = drawingTool;
  if (tool === "eraser") {
   activeStrokeRef.current = "eraser";
   replaceStrokes(erasePdfStrokesAtPoint(strokes, point, eraserSize / 1000));
   return;
  }
  if (tool === null) return;
  const stroke = createPdfStroke(
   tool,
   tool === "highlighter" ? "#facc15" : color,
   tool === "highlighter" ? Math.max(12, width * 4) : width,
   point,
  );
  replaceStrokes([...strokes, stroke]);
  activeStrokeRef.current = stroke.id;
 };
 const continueStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (!pointerCanInk(event) || !activeStrokeRef.current) return;
  event.preventDefault();
  const point = pointFromEvent(event);
  if (activeStrokeRef.current === "eraser") {
   replaceStrokes(erasePdfStrokesAtPoint(strokes, point, eraserSize / 1000));
   return;
  }
  replaceStrokes(updateStrokeAtId(strokes, activeStrokeRef.current, point));
 };
 const endStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
   event.currentTarget.releasePointerCapture(event.pointerId);
  }
  activeStrokeRef.current = "";
 };
 const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  setFitToContainer(false);
  setZoom((current) => clampPdfZoom(current + (event.deltaY < 0 ? 10 : -10)));
 };
 const touchDistance = (event: TouchEvent<HTMLDivElement>) => {
  const first = event.touches[0];
  const second = event.touches[1];
  if (!first || !second) return null;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
 };
 const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
  pinchDistanceRef.current = touchDistance(event);
 };
 const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
  const distance = touchDistance(event);
  const previousDistance = pinchDistanceRef.current;
  if (distance === null || previousDistance === null || Math.abs(distance - previousDistance) < 2)
   return;
  event.preventDefault();
  pinchDistanceRef.current = distance;
  setFitToContainer(false);
  setZoom((current) => clampPdfZoom(current + (distance > previousDistance ? 4 : -4)));
 };

 return (
  <section
   ref={viewerRef}
   className={cn(
    "relative flex min-h-[36rem] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-bg-subtle shadow-lg",
    isFullscreen && "fixed inset-0 z-120 h-dvh w-dvw rounded-none",
   )}
   data-pdf-viewer
  >
   <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
    <div className="min-w-0">
     <Typography as="p" variant="bodySmall" weight="black" clamp="one">
      {asset.title}
     </Typography>
     <Typography as="p" variant="caption" tone="muted">
      Trang in {asset.printedPage} · PDF {asset.pdfPage}
     </Typography>
    </div>
    <div className="flex min-w-0 flex-wrap items-center gap-1">
     <Button
      type="button"
      variant="ghost"
      size="icon-toolbar"
      aria-label="Thu nhỏ PDF"
      disabled={!fitToContainer && zoom <= PDF_MIN_ZOOM}
      onClick={() => {
       setFitToContainer(false);
       setZoom(previousPdfZoom(zoom));
      }}
     >
      <ZoomOut />
     </Button>
     <output className="min-w-14 text-center text-xs font-bold" aria-live="polite">
      {fitToContainer ? "Vừa khung" : `${Math.round(zoom)}%`}
     </output>
     <Button
      type="button"
      variant="ghost"
      size="icon-toolbar"
      aria-label="Phóng to PDF"
      disabled={!fitToContainer && zoom >= PDF_MAX_ZOOM}
      onClick={() => {
       setFitToContainer(false);
       setZoom(nextPdfZoom(zoom));
      }}
     >
      <ZoomIn />
     </Button>
     <Button
      type="button"
      variant={fitToContainer ? "active" : "outline"}
      size="sm"
      onClick={() => setFitToContainer((current) => !current)}
     >
      Vừa trang
     </Button>
     <Button type="button" variant="ghost" size="icon-toolbar" aria-label="Mở PDF gốc" asChild>
      <a href={pdfHref(asset)} target="_blank" rel="noreferrer">
       <ExternalLink />
      </a>
     </Button>
     <Button
      type="button"
      variant="ghost"
      size="icon-toolbar"
      aria-label="Toàn màn hình"
      onClick={() => void toggleFullscreen()}
     >
      <Expand />
     </Button>
    </div>
   </header>

   {annotationQuery.isError ? (
    <Typography as="p" variant="caption" tone="danger" className="px-3 pt-2 sm:px-4">
     Không tải được ghi chú PDF; nét mới sẽ được giữ trong phiên này.
    </Typography>
   ) : saveError ? (
    <Typography as="p" variant="caption" tone="danger" className="px-3 pt-2 sm:px-4">
     {saveError}
    </Typography>
   ) : null}

   <div
    className="relative grid min-h-0 flex-1 gap-2 overflow-auto overscroll-contain bg-bg-subtle px-3 py-4 sm:px-6"
    data-pdf-scroll
    onWheel={handleWheel}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={() => {
     pinchDistanceRef.current = null;
    }}
   >
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
       aria-label="Di chuyển PDF"
       onClick={() => setDrawingTool(null)}
      >
       <Hand />
      </Button>
      <Button
       type="button"
       size="icon-toolbar"
       variant={drawingTool === "pen" ? "active" : "ghost"}
       aria-label="Bút vẽ"
       onClick={() => setDrawingTool("pen")}
      >
       <Pen />
      </Button>
      <Button
       type="button"
       size="icon-toolbar"
       variant={drawingTool === "highlighter" ? "active" : "ghost"}
       aria-label="Bút highlight"
       onClick={() => setDrawingTool("highlighter")}
      >
       <Highlighter />
      </Button>
      <Button
       type="button"
       size="icon-toolbar"
       variant={drawingTool === "eraser" ? "active" : "ghost"}
       aria-label="Tẩy"
       onClick={() => setDrawingTool("eraser")}
      >
       <Eraser />
      </Button>
      <span className="h-6 w-px bg-border" aria-hidden="true" />
      <Button
       type="button"
       size="icon-toolbar"
       variant="ghost"
       aria-label="Hoàn tác"
       disabled={past.length === 0}
       onClick={undo}
      >
       <Undo2 />
      </Button>
      <Button
       type="button"
       size="icon-toolbar"
       variant="ghost"
       aria-label="Làm lại"
       disabled={future.length === 0}
       onClick={redo}
      >
       <Redo2 />
      </Button>
      <Button
       type="button"
       size="icon-toolbar"
       variant="ghost"
       aria-label="Xóa nét vẽ"
       disabled={strokes.length === 0}
       onClick={clear}
      >
       <Trash2 />
      </Button>
      <Button
       type="button"
       size="icon-toolbar"
       variant={touchInk ? "active" : "ghost"}
       aria-label="Cho phép viết bằng cảm ứng"
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
      <div className="flex items-center gap-1" aria-label="Màu bút">
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
        aria-label="Màu tùy chỉnh"
        onChange={(event) => setColor(event.target.value)}
       />
      </div>
      <label className="flex min-w-44 items-center gap-2 text-xs font-bold">
       <span>Độ dày {width}</span>
       <Input
        type="range"
        min={1}
        max={12}
        value={width}
        aria-label="Độ dày nét bút"
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
       <span>Cỡ tẩy {eraserSize}</span>
       <Input
        type="range"
        min={12}
        max={56}
        value={eraserSize}
        aria-label="Cỡ tẩy"
        onChange={(event) => setEraserSize(Number(event.target.value))}
       />
      </label>
     </Card>
    ) : null}

    <div className="grid justify-items-center gap-3 pt-4">
     <div
      ref={pageRef}
      className={cn(
       "relative min-w-[18.75rem] bg-surface shadow-lg",
       fitToContainer ? "w-full max-w-[60rem]" : "max-w-none",
      )}
      style={fitToContainer ? undefined : { inlineSize: `${pdfPageWidthRem(zoom)}rem` }}
     >
      {imageFailed ? (
       <div className="grid min-h-[60dvh] place-content-center gap-3 p-8 text-center">
        <Typography variant="bodySmall" tone="muted">
         Không tải được trang preview.
        </Typography>
        <Button type="button" variant="outline" asChild>
         <a href={pdfHref(asset)} target="_blank" rel="noreferrer">
          <Download data-icon="inline-start" />
          Mở PDF gốc
         </a>
        </Button>
       </div>
      ) : (
       <>
        {/* oxlint-disable-next-line next/no-img-element -- local pre-rendered PDF page keeps the annotation canvas aligned */}
        <img
         src={asset.imageSrc}
         alt={`${asset.title}, trang PDF ${asset.pdfPage}`}
         className="block h-auto w-full select-none"
         draggable={false}
         onError={() => setImageFailed(true)}
        />
        <svg
         aria-label="Lớp ghi chú PDF"
         className={cn(
          "pointer-events-none absolute inset-0 size-full",
          drawingTool !== null && "pointer-events-auto cursor-crosshair",
         )}
         viewBox="0 0 1000 1000"
         preserveAspectRatio="none"
         role="img"
         onContextMenu={(event) => event.preventDefault()}
         onPointerDown={beginStroke}
         onPointerMove={continueStroke}
         onPointerUp={endStroke}
         onPointerCancel={endStroke}
         style={{ touchAction: drawingTool !== null && touchInk ? "none" : "pan-x pan-y" }}
        >
         {strokes.map((stroke) => (
          <path
           key={stroke.id}
           d={pdfStrokePath(stroke)}
           fill="none"
           stroke={stroke.color}
           strokeLinecap="round"
           strokeLinejoin="round"
           strokeWidth={stroke.width}
           opacity={stroke.tool === "highlighter" ? 0.42 : 1}
          />
         ))}
        </svg>
       </>
      )}
     </div>
     <Typography as="p" variant="caption" tone="muted" className="text-center">
      Ctrl/Cmd + wheel hoặc pinch để zoom · bật “Cho phép viết bằng cảm ứng” khi dùng bút trên iPad.
     </Typography>
    </div>
   </div>
  </section>
 );
}
