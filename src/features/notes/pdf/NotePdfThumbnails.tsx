"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";
import { useTranslations } from "next-intl";

import { ActionCard } from "@/components/ui/actions/action-card";
import { Badge } from "@/components/ui/display/badge";
import { NotePdfPageCanvas } from "./NotePdfPageCanvas";
import type { PdfDocument } from "./pdfjs-loader";

/** One thumbnail; its page is drawn only once it scrolls near the sidebar viewport. */
function Thumbnail({
 document,
 pageNumber,
 aspectRatio,
 current,
 root,
 onSelect,
}: {
 document: PdfDocument;
 pageNumber: number;
 aspectRatio: number;
 current: boolean;
 root: HTMLElement;
 onSelect: (page: number) => void;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const boxRef = useRef<HTMLButtonElement>(null);
 const [near, setNear] = useState(false);

 useEffect(() => {
  const box = boxRef.current;
  if (!box) return;
  const observer = new IntersectionObserver(
   ([entry]) => {
    if (entry?.isIntersecting) setNear(true);
   },
   { root, rootMargin: "200% 0px" },
  );
  observer.observe(box);
  return () => observer.disconnect();
 }, [root]);

 // Keep the current page visible in the sidebar only (scrollIntoView would also
 // scroll the app's own scroll containers).
 useEffect(() => {
  const box = boxRef.current;
  if (!current || !box) return;
  const top = box.offsetTop;
  const bottom = top + box.offsetHeight;
  if (top < root.scrollTop) root.scrollTo({ top: top - 12 });
  else if (bottom > root.scrollTop + root.clientHeight)
   root.scrollTo({ top: bottom - root.clientHeight + 12 });
 }, [current, root]);

 return (
  <ActionCard
   ref={boxRef}
   padding="sm"
   aria-label={t("goToPageNumber", { page: pageNumber })}
   aria-current={current ? "page" : undefined}
   onClick={() => onSelect(pageNumber)}
   className="grid gap-1.5"
  >
   <span className="relative block w-full overflow-hidden" style={{ aspectRatio }}>
    {near ? <NotePdfPageCanvas document={document} pageNumber={pageNumber} /> : null}
   </span>
   <Badge variant={current ? "accent" : "default"} size="sm" className="justify-self-center">
    {pageNumber}
   </Badge>
  </ActionCard>
 );
}

/** GoodNotes-style page sidebar: every page as a thumbnail; tap to jump. */
export function NotePdfThumbnails({
 document,
 aspectRatio,
 currentPage,
 onSelect,
}: {
 document: PdfDocument;
 aspectRatio: number;
 currentPage: number;
 onSelect: (page: number) => void;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const [root, setRoot] = useState<HTMLElement>();
 const rootRef: RefCallback<HTMLElement> = useCallback(
  (element) => setRoot(element ?? undefined),
  [],
 );

 return (
  <nav
   ref={rootRef}
   aria-label={t("pages")}
   className="relative grid min-h-0 content-start gap-3 overflow-y-auto overscroll-contain border-e border-border bg-surface p-3 scrollbar-soft"
  >
   {root
    ? Array.from({ length: document.numPages }, (_, index) => (
       <Thumbnail
        key={index + 1}
        document={document}
        pageNumber={index + 1}
        aspectRatio={aspectRatio}
        current={index + 1 === currentPage}
        root={root}
        onSelect={onSelect}
       />
      ))
    : null}
  </nav>
 );
}
