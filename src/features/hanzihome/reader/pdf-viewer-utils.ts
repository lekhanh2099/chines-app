import type { PdfPoint } from "./pdf-annotations";

export const PDF_BASE_PAGE_WIDTH_REM = 45;
export const PDF_MIN_ZOOM = 60;
export const PDF_MAX_ZOOM = 300;
export const PDF_ZOOM_STEP = 25;

export function clampPdfZoom(value: number): number {
 if (!Number.isFinite(value)) return 100;
 return Math.min(PDF_MAX_ZOOM, Math.max(PDF_MIN_ZOOM, value));
}

export function previousPdfZoom(zoom: number): number {
 const normalized = clampPdfZoom(zoom);
 return clampPdfZoom(Math.floor((normalized - 1) / PDF_ZOOM_STEP) * PDF_ZOOM_STEP);
}

export function nextPdfZoom(zoom: number): number {
 const normalized = clampPdfZoom(zoom);
 return clampPdfZoom(Math.ceil((normalized + 1) / PDF_ZOOM_STEP) * PDF_ZOOM_STEP);
}

export function pdfPageWidthRem(zoom: number): number {
 return PDF_BASE_PAGE_WIDTH_REM * (clampPdfZoom(zoom) / 100);
}

export function normalizedPdfPoint(clientX: number, clientY: number, rect: DOMRect): PdfPoint {
 return {
  x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
  y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
 };
}
