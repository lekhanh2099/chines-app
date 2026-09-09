"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { cookReaderData } from "../model/cook-reader-data";
import type { CookReaderDataOptions, ReaderDataInput } from "../model/reader.schemas";
import { ReaderProvider } from "../runtime/ReaderProvider";
import type { ReaderServices } from "../runtime/reader-services";
import { defaultReaderDisplay, type ReaderDisplayAdapter } from "../model/reader-display";
import { ReaderContent } from "./ReaderContent";
import { ReaderToolbar } from "./ReaderToolbar";
import {
 useReaderCommands,
 useReaderSelector,
 useReaderServices,
 useReaderStore,
} from "../runtime/reader-context";
import { focusRingClassName } from "@/components/ui/focus-ring";

export function Reader({
 data,
 services,
 display,
 pronunciation,
 className,
}: {
 data: ReaderDataInput;
 services?: ReaderServices;
 display?: ReaderDisplayAdapter;
 pronunciation?: CookReaderDataOptions["pronunciation"];
 className?: string;
}) {
 const content = useMemo(() => cookReaderData(data, { pronunciation }), [data, pronunciation]);
 const [localDisplay, setLocalDisplay] = useState(defaultReaderDisplay);
 return (
  <ReaderProvider
   content={content}
   services={services}
   display={display?.value ?? localDisplay}
   onDisplayChange={display?.onChange ?? setLocalDisplay}
  >
   <ReaderFrame className={className} />
  </ReaderProvider>
 );
}

function ReaderFrame({ className }: { className?: string }) {
 const t = useTranslations("Reader.study.chrome.surface");
 const commands = useReaderCommands();
 const { actions } = useReaderStore();
 const { speech, renderReader } = useReaderServices();
 const status = useReaderSelector((state) => state.playback.status);
 const focus = useReaderSelector((state) => state.ui.focusMode);
 const content = (
  <section
   aria-label={t("aria")}
   data-reader
   tabIndex={0}
   className={cn(
    "grid min-w-0 gap-4",
    focusRingClassName,
    focus && "mx-auto w-full max-w-5xl",
    className,
   )}
   onKeyDown={(event) => {
    if (event.defaultPrevented || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)
     return;
    if (
     event.target instanceof Element &&
     event.target.closest(
      'button, a, input, textarea, select, [role="button"], [role="menuitem"], [contenteditable="true"]',
     )
    )
     return;
    if (event.key === " " && speech) {
     event.preventDefault();
     if (status === "playing") commands.pause();
     else if (status === "paused") commands.resume();
     else if (status === "loading") commands.stop();
     else commands.playCurrent();
    } else if (event.key === "ArrowLeft") {
     event.preventDefault();
     commands.previous();
    } else if (event.key === "ArrowRight") {
     event.preventDefault();
     commands.next();
    } else if (event.key === "Escape" && focus) {
     event.preventDefault();
     actions.toggleFocus();
    }
   }}
   onCopy={(event) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;
    const range = selection.getRangeAt(0);
    if (!event.currentTarget.contains(range.commonAncestorContainer)) return;
    const fragment = range.cloneContents();
    if (!fragment.querySelector('ruby, rt, [data-reader-pinyin], [lang="zh-Latn-pinyin"]')) return;
    fragment
     .querySelectorAll(
      'rt, rp, [data-reader-pinyin], [lang="zh-Latn-pinyin"], [aria-hidden="true"]',
     )
     .forEach((node) => node.remove());
    event.preventDefault();
    event.clipboardData.setData("text/plain", fragment.textContent ?? "");
   }}
  >
   <ReaderToolbar />
   <ReaderContent />
  </section>
 );
 return renderReader ? renderReader({ content }) : content;
}
