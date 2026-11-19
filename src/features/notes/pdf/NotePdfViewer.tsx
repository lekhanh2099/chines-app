"use client";

import {
 useCallback,
 useEffect,
 useRef,
 useState,
 type ComponentProps,
 type KeyboardEvent,
 type ReactNode,
 type RefCallback,
} from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { cn } from "@/lib/utils";
import { pdfPageWidthRem } from "@/features/reading/pdf/pdf-viewer-utils";
import { usePdfInkTools } from "@/features/reading/pdf/usePdfPageInk";
import { usePdfPageViewport } from "@/features/reading/pdf/usePdfPageViewport";
import type { NotePdfAttachment } from "@/services/notes/note-pdf.service";
import { DEFAULT_PDF_PAGE_ASPECT } from "./NotePdfPageCanvas";
import { NotePdfPage } from "./NotePdfPage";
import { NotePdfThumbnails } from "./NotePdfThumbnails";
import { useNotePdfDocument } from "./useNotePdfDocument";
import type { PdfDocument } from "./pdfjs-loader";

type PageProps = ComponentProps<typeof NotePdfPage>;

function lastPageKey(attachmentId: string) {
 return `hanzihome:note-pdf-page:${attachmentId}`;
}

function readLastPage(attachmentId: string, pageCount: number) {
 try {
  const stored = Number(window.localStorage.getItem(lastPageKey(attachmentId)));
  return Number.isInteger(stored) && stored >= 1 && stored <= pageCount ? stored : 1;
 } catch {
  return 1;
 }
}

/**
 * A page's place in the vertical list. Its canvas, ink and annotation query
 * exist only while it is near the viewport (or current), so a 200-page PDF
 * keeps a handful of pages alive on an iPad.
 */
function NotePdfPageSlot({
 pageNumber,
 aspectRatio,
 root,
 isCurrent,
 widthStyle,
 fitToContainer,
 renderPage,
}: {
 pageNumber: number;
 aspectRatio: number;
 root: HTMLElement;
 isCurrent: boolean;
 widthStyle: string;
 fitToContainer: boolean;
 renderPage: () => ReactNode;
}) {
 const slotRef = useRef<HTMLDivElement>(null);
 const [near, setNear] = useState(false);

 useEffect(() => {
  const slot = slotRef.current;
  if (!slot) return;
  const observer = new IntersectionObserver(([entry]) => setNear(Boolean(entry?.isIntersecting)), {
   root,
   rootMargin: "150% 0px",
  });
  observer.observe(slot);
  return () => observer.disconnect();
 }, [root]);

 return (
  <div
   ref={slotRef}
   data-pdf-page={pageNumber}
   className={cn(
    "relative min-w-[18.75rem] bg-surface shadow-lg",
    fitToContainer ? "w-full max-w-[60rem]" : "max-w-none",
   )}
   style={{
    inlineSize: fitToContainer ? undefined : widthStyle,
    aspectRatio: near || isCurrent ? undefined : aspectRatio,
   }}
  >
   {near || isCurrent ? renderPage() : null}
  </div>
 );
}

/**
 * A note's PDF: pages in one vertical scroll (GoodNotes "Vertical"), a page
 * thumbnail sidebar, and the ink tools shared by every page.
 */
export function NotePdfViewer({
 attachment,
 onReplace,
 onRemove,
}: {
 attachment: NotePdfAttachment;
 onReplace: () => void;
 onRemove: () => void;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const common = useTranslations("Common");
 const { document, failed, retry } = useNotePdfDocument(attachment);
 // Without an Apple Pencil the finger is the pen; two fingers scroll and zoom.
 const tools = usePdfInkTools({ fingerInk: true });
 const viewport = usePdfPageViewport({ expandInPage: true });
 const { viewerRef, scrollAreaRef, zoom, fitToContainer, isFullscreen } = viewport;
 const [toolbarSlot, setToolbarSlot] = useState<HTMLElement>();
 const toolbarSlotRef: RefCallback<HTMLDivElement> = useCallback(
  (element) => setToolbarSlot(element ?? undefined),
  [],
 );
 const [scrollArea, setScrollArea] = useState<HTMLDivElement>();
 const scrollRef: RefCallback<HTMLDivElement> = useCallback(
  (element) => {
   scrollAreaRef(element);
   setScrollArea(element ?? undefined);
  },
  [scrollAreaRef],
 );
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [currentPage, setCurrentPage] = useState(() =>
  readLastPage(attachment.id, attachment.page_count),
 );
 const pageCount = document?.numPages ?? attachment.page_count;

 useEffect(() => {
  try {
   window.localStorage.setItem(lastPageKey(attachment.id), String(currentPage));
  } catch {
   // Remembering the page is a convenience only.
  }
 }, [attachment.id, currentPage]);

 const goToPage = useCallback(
  (next: number) => {
   const page = Math.min(pageCount, Math.max(1, Math.round(next)));
   const slot = scrollArea?.querySelector<HTMLElement>(`[data-pdf-page="${page}"]`);
   if (scrollArea && slot) scrollArea.scrollTo({ top: slot.offsetTop - 16 });
   setCurrentPage(page);
  },
  [pageCount, scrollArea],
 );

 // The current page is the one crossing the upper third of the scroll area.
 useEffect(() => {
  if (!scrollArea || !document) return;
  let frame = 0;
  const track = () => {
   if (frame) return;
   frame = window.requestAnimationFrame(() => {
    frame = 0;
    const probe = scrollArea.getBoundingClientRect().top + scrollArea.clientHeight / 3;
    let page = 1;
    for (const slot of scrollArea.querySelectorAll<HTMLElement>("[data-pdf-page]")) {
     if (slot.getBoundingClientRect().top <= probe) page = Number(slot.dataset.pdfPage);
     else break;
    }
    setCurrentPage(page);
   });
  };
  scrollArea.addEventListener("scroll", track, { passive: true });
  return () => {
   scrollArea.removeEventListener("scroll", track);
   window.cancelAnimationFrame(frame);
  };
 }, [document, scrollArea]);

 // Reopen at the page read last time, once the pages are laid out.
 const restoredRef = useRef(false);
 useEffect(() => {
  if (restoredRef.current || !document || !scrollArea) return;
  restoredRef.current = true;
  const page = readLastPage(attachment.id, document.numPages);
  if (page > 1) window.requestAnimationFrame(() => goToPage(page));
 }, [attachment.id, document, goToPage, scrollArea]);

 const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === "ArrowLeft" || event.key === "PageUp") goToPage(currentPage - 1);
  if (event.key === "ArrowRight" || event.key === "PageDown") goToPage(currentPage + 1);
 };

 return (
  <section
   ref={viewerRef}
   aria-label={attachment.file_name}
   className={cn(
    "flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-bg-subtle",
    // Expanded: cover the app header and toolbars inside the browser window.
    isFullscreen && "fixed inset-0 z-120 h-dvh w-dvw",
   )}
   onKeyDown={handleKeyDown}
  >
   <div ref={toolbarSlotRef} className="min-h-[49px] shrink-0 bg-surface" />

   {failed ? (
    <div className="grid flex-1 place-content-center p-4">
     <EmptyState
      surface="card"
      title={t("loadError")}
      description={t("loadErrorDescription")}
      actions={
       <Button type="button" variant="outline" onClick={retry}>
        {common("actions.retry")}
       </Button>
      }
     />
    </div>
   ) : (
    <div className="relative flex min-h-0 flex-1">
     {sidebarOpen && document ? (
      <div className="absolute inset-y-0 start-0 z-20 flex w-40 shadow-lg md:static md:w-44 md:shadow-none">
       <NotePdfThumbnails
        document={document}
        aspectRatio={DEFAULT_PDF_PAGE_ASPECT}
        currentPage={currentPage}
        onSelect={(page) => {
         goToPage(page);
         if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
        }}
       />
      </div>
     ) : null}
     <div
      ref={scrollRef}
      className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain px-2 py-4 sm:px-6"
      data-pdf-scroll
     >
      <div
       className={cn(
        "grid justify-items-center gap-4",
        fitToContainer ? "w-full" : "mx-auto w-max min-w-full",
       )}
      >
       {document && toolbarSlot && scrollArea ? (
        <NotePdfPages
         document={document}
         attachmentId={attachment.id}
         fileName={attachment.file_name}
         currentPage={currentPage}
         root={scrollArea}
         toolbarSlot={toolbarSlot}
         tools={tools}
         viewport={viewport}
         zoomWidth={`${pdfPageWidthRem(zoom)}rem`}
         sidebarOpen={sidebarOpen}
         onToggleSidebar={() => setSidebarOpen((open) => !open)}
         onGoToPage={goToPage}
         onReplace={onReplace}
         onRemove={onRemove}
        />
       ) : (
        // Same footprint as a page while the PDF opens, so nothing jumps.
        <div
         aria-busy="true"
         aria-label={t("loading")}
         className={cn(
          "min-w-[18.75rem] animate-pulse bg-surface shadow-lg",
          fitToContainer ? "w-full max-w-[60rem]" : "max-w-none",
         )}
         style={{ aspectRatio: DEFAULT_PDF_PAGE_ASPECT }}
        />
       )}
      </div>
     </div>
    </div>
   )}
  </section>
 );
}

/** Every page slot, with the toolbar wiring the current page renders. */
function NotePdfPages({
 document,
 attachmentId,
 fileName,
 currentPage,
 root,
 toolbarSlot,
 tools,
 viewport,
 zoomWidth,
 sidebarOpen,
 onToggleSidebar,
 onGoToPage,
 onReplace,
 onRemove,
}: {
 document: PdfDocument;
 attachmentId: string;
 fileName: string;
 currentPage: number;
 root: HTMLElement;
 toolbarSlot: HTMLElement;
 tools: PageProps["tools"];
 viewport: PageProps["toolbarProps"]["viewport"];
 zoomWidth: string;
 sidebarOpen: boolean;
 onToggleSidebar: () => void;
 onGoToPage: (page: number) => void;
 onReplace: () => void;
 onRemove: () => void;
}) {
 const [aspectRatio, setAspectRatio] = useState(DEFAULT_PDF_PAGE_ASPECT);
 useEffect(() => {
  let active = true;
  void document.getPage(1).then((page) => {
   const size = page.getViewport({ scale: 1 });
   if (active) setAspectRatio(size.width / size.height);
  });
  return () => {
   active = false;
  };
 }, [document]);

 const toolbarProps: PageProps["toolbarProps"] = {
  fileName,
  pageCount: document.numPages,
  onGoToPage,
  viewport,
  onReplace,
  onRemove,
  sidebarOpen,
  onToggleSidebar,
 };

 return Array.from({ length: document.numPages }, (_, index) => {
  const pageNumber = index + 1;
  return (
   <NotePdfPageSlot
    key={pageNumber}
    pageNumber={pageNumber}
    aspectRatio={aspectRatio}
    root={root}
    isCurrent={pageNumber === currentPage}
    widthStyle={zoomWidth}
    fitToContainer={viewport.fitToContainer}
    renderPage={() => (
     <NotePdfPage
      document={document}
      attachmentId={attachmentId}
      pageNumber={pageNumber}
      aspectRatio={aspectRatio}
      tools={tools}
      isCurrent={pageNumber === currentPage}
      toolbarSlot={toolbarSlot}
      toolbarProps={toolbarProps}
     />
    )}
   />
  );
 });
}
