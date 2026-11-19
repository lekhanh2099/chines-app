"use client";

type PdfjsModule = typeof import("pdfjs-dist");

// pdf.js is large; it is fetched the first time a note PDF is opened or
// imported, never with the notes bundle. One worker is shared by every document.
const loads = new Map<string, Promise<PdfjsModule>>();

export function loadPdfjs(): Promise<PdfjsModule> {
 const existing = loads.get("pdfjs");
 if (existing) return existing;
 const loading = import("pdfjs-dist").then((pdfjs) => {
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
   pdfjs.GlobalWorkerOptions.workerPort = new Worker(
    new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
    { type: "module" },
   );
  }
  return pdfjs;
 });
 loads.set("pdfjs", loading);
 loading.catch(() => loads.delete("pdfjs"));
 return loading;
}

/** Opens PDF bytes; the caller must `close()` it to free the worker memory. */
export async function openPdfDocument(file: Blob) {
 const pdfjs = await loadPdfjs();
 // Served by scripts/copy-pdfjs-assets.mjs for exactly this pdf.js version.
 const assets = `/vendor/pdfjs/${pdfjs.version}/`;
 const task = pdfjs.getDocument({
  data: new Uint8Array(await file.arrayBuffer()),
  cMapUrl: `${assets}cmaps/`,
  standardFontDataUrl: `${assets}standard_fonts/`,
  iccUrl: `${assets}iccs/`,
  wasmUrl: `${assets}wasm/`,
 });
 try {
  const document = await task.promise;
  return { document, close: () => task.destroy() };
 } catch (error) {
  void task.destroy();
  throw error;
 }
}

export type PdfDocument = Awaited<ReturnType<typeof openPdfDocument>>["document"];

/** Reads the page count, which also proves the file is a PDF pdf.js can open. */
export async function countPdfPages(file: Blob) {
 const opened = await openPdfDocument(file);
 try {
  return opened.document.numPages;
 } finally {
  void opened.close();
 }
}
