"use client";

import {
 Download,
 Eraser,
 Expand,
 ExternalLink,
 Hand,
 Highlighter,
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

import {
 appendPdfStrokePoint,
 createPdfStroke,
 erasePdfStrokesAtPoint,
 pdfStrokePath,
 type PdfDrawingTool,
 type PdfPoint,
 type PdfStroke,
} from "./pdf-annotations";
import {
 clampPdfZoom,
 nextPdfZoom,
 PDF_MAX_ZOOM,
 PDF_MIN_ZOOM,
 pdfPageWidthRem,
 previousPdfZoom,
 normalizedPdfPoint,
} from "./pdf-viewer-utils";

type PdfAsset = {
 id: string;
 title: string;
 resourceFile: string;
 pdfPage: number;
 printedPage: number;
 imageSrc: string;
};

type PdfEditorTool = PdfDrawingTool | "eraser";
type PdfAssetSeed = [string, string, string, number, number];

const PDF_ASSET_SEEDS: PdfAssetSeed[] = [
 ["book-1-21", "Hán ngữ · Quyển 1 · trang 21", "hanyu-series-reading-book-1.pdf", 21, 21],
 ["book-1-25", "Hán ngữ · Quyển 1 · trang 25", "hanyu-series-reading-book-1.pdf", 25, 25],
 ["book-1-29", "Hán ngữ · Quyển 1 · trang 29", "hanyu-series-reading-book-1.pdf", 29, 29],
 ["book-1-40", "Hán ngữ · Quyển 1 · trang 40", "hanyu-series-reading-book-1.pdf", 40, 40],
 ["book-1-48", "Hán ngữ · Quyển 1 · trang 48", "hanyu-series-reading-book-1.pdf", 48, 48],
 ["book-1-52", "Hán ngữ · Quyển 1 · trang 52", "hanyu-series-reading-book-1.pdf", 52, 52],
 ["book-1-56", "Hán ngữ · Quyển 1 · trang 56", "hanyu-series-reading-book-1.pdf", 56, 56],
 ["book-1-83", "Hán ngữ · Quyển 1 · trang 83", "hanyu-series-reading-book-1.pdf", 83, 83],
 ["book-1-99", "Hán ngữ · Quyển 1 · trang 99", "hanyu-series-reading-book-1.pdf", 99, 99],
 ["book-1-103", "Hán ngữ · Quyển 1 · trang 103", "hanyu-series-reading-book-1.pdf", 103, 103],
 ["book-1-110", "Hán ngữ · Quyển 1 · trang 110", "hanyu-series-reading-book-1.pdf", 110, 110],
 ["book-1-131", "Hán ngữ · Quyển 1 · trang 131", "hanyu-series-reading-book-1.pdf", 131, 131],
 ["book-2-10", "Hán ngữ · Quyển 2 · trang 10", "hanyu-series-reading-book-2.pdf", 10, 10],
 ["book-2-32", "Hán ngữ · Quyển 2 · trang 32", "hanyu-series-reading-book-2.pdf", 32, 32],
 ["book-2-44", "Hán ngữ · Quyển 2 · trang 44", "hanyu-series-reading-book-2.pdf", 44, 44],
 ["book-2-54", "Hán ngữ · Quyển 2 · trang 54", "hanyu-series-reading-book-2.pdf", 54, 54],
 ["book-2-124", "Hán ngữ · Quyển 2 · trang 124", "hanyu-series-reading-book-2.pdf", 124, 124],
 ["book-2-129", "Hán ngữ · Quyển 2 · trang 129", "hanyu-series-reading-book-2.pdf", 129, 129],
 ["book-2-161", "Hán ngữ · Quyển 2 · trang 161", "hanyu-series-reading-book-2.pdf", 161, 161],
 ["book-2-171", "Hán ngữ · Quyển 2 · trang 171", "hanyu-series-reading-book-2.pdf", 171, 171],
 ["book-2-182", "Hán ngữ · Quyển 2 · trang 182", "hanyu-series-reading-book-2.pdf", 182, 182],
 ["book-2-200", "Hán ngữ · Quyển 2 · trang 200", "hanyu-series-reading-book-2.pdf", 200, 200],
 ["book-2-208", "Hán ngữ · Quyển 2 · trang 208", "hanyu-series-reading-book-2.pdf", 208, 208],
 ["book-2-254", "Hán ngữ · Quyển 2 · trang 254", "hanyu-series-reading-book-2.pdf", 254, 254],
];

const PDF_ASSETS: PdfAsset[] = PDF_ASSET_SEEDS.map(
 ([id, title, resourceFile, pdfPage, printedPage]) => ({
  id,
  title,
  resourceFile,
  pdfPage,
  printedPage,
  imageSrc: `/resources/pages/${resourceFile.replace(".pdf", "")}-page-${pdfPage}.webp`,
 }),
);

const PEN_COLORS = ["#ef4444", "#2563eb", "#16a34a", "#f59e0b", "#111827"];

function pdfHref(asset: PdfAsset) {
 return `/resources/${asset.resourceFile}#page=${asset.pdfPage}`;
}

function updateStrokeAtId(strokes: readonly PdfStroke[], id: string, point: PdfPoint) {
 return strokes.map((stroke) => (stroke.id === id ? appendPdfStrokePoint(stroke, point) : stroke));
}

export function PdfReaderWorkspace() {
 const [selectedAssetId, setSelectedAssetId] = useState(PDF_ASSETS[0]?.id ?? "");
 const selectedAsset = useMemo(
  () => PDF_ASSETS.find((asset) => asset.id === selectedAssetId) ?? PDF_ASSETS[0],
  [selectedAssetId],
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
      <Badge variant="purple" className="w-fit">
       Reader PDF
      </Badge>
      <Typography as="h1" variant="sectionTitle" weight="black">
       Tài liệu Hán ngữ
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Trang preview đã được kiểm checksum; mở PDF gốc khi cần chuyển tới trang bất kỳ.
      </Typography>
     </div>
     <Badge>{PDF_ASSETS.length} trang preview</Badge>
    </div>
    <div
     className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-soft"
     aria-label="Chọn trang PDF"
    >
     {PDF_ASSETS.map((asset) => (
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
   </Card>
   <PdfPageViewer key={selectedAsset.id} asset={selectedAsset} />
  </div>
 );
}

function PdfPageViewer({ asset }: { asset: PdfAsset }) {
 const viewerRef = useRef<HTMLElement>(null);
 const pageRef = useRef<HTMLDivElement>(null);
 const activeStrokeRef = useRef("");
 const pinchDistanceRef = useRef<number | null>(null);
 const [zoom, setZoom] = useState(100);
 const [fitToContainer, setFitToContainer] = useState(true);
 const [isFullscreen, setIsFullscreen] = useState(false);
 const [imageFailed, setImageFailed] = useState(false);
 const [drawingTool, setDrawingTool] = useState<PdfEditorTool | null>(null);
 const [touchInk, setTouchInk] = useState(false);
 const [color, setColor] = useState(PEN_COLORS[0] ?? "#ef4444");
 const [width, setWidth] = useState(4);
 const [eraserSize, setEraserSize] = useState(24);
 const [strokes, setStrokes] = useState<PdfStroke[]>([]);
 const [past, setPast] = useState<PdfStroke[][]>([]);
 const [future, setFuture] = useState<PdfStroke[][]>([]);

 useEffect(() => {
  const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === viewerRef.current);
  document.addEventListener("fullscreenchange", syncFullscreen);
  return () => document.removeEventListener("fullscreenchange", syncFullscreen);
 }, []);

 const checkpoint = () => {
  setPast((current) => [...current, strokes]);
  setFuture([]);
 };
 const replaceStrokes = (next: PdfStroke[]) => setStrokes(next);
 const undo = () => {
  const previous = past.at(-1);
  if (!previous) return;
  setPast((current) => current.slice(0, -1));
  setFuture((current) => [strokes, ...current]);
  setStrokes(previous);
 };
 const redo = () => {
  const next = future[0];
  if (!next) return;
  setFuture((current) => current.slice(1));
  setPast((current) => [...current, strokes]);
  setStrokes(next);
 };
 const clear = () => {
  if (!strokes.length) return;
  checkpoint();
  setStrokes([]);
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
     <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-md">
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
     </div>
    </div>
    {drawingTool !== null && drawingTool !== "eraser" ? (
     <div className="sticky top-16 z-20 flex max-w-full flex-wrap items-center justify-center gap-2 self-center rounded-lg border border-border bg-surface px-3 py-2 shadow">
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
     </div>
    ) : null}
    {drawingTool === "eraser" ? (
     <label className="sticky top-16 z-20 flex max-w-xs items-center gap-2 self-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold shadow">
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
