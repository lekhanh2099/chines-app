"use client";

import type { MobileNotePane } from "./types";

export function NotePaneToggle({
 activePane,
 onChange,
}: {
 activePane: MobileNotePane;
 onChange: (pane: MobileNotePane) => void;
}) {
 return (
  <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg-subtle p-1 lg:hidden">
   {(["reading", "note"] as const).map((pane) => (
    <button
     key={pane}
     type="button"
     onClick={() => onChange(pane)}
     className={[
      "rounded-xl px-3 py-2 text-sm font-black transition-colors",
      activePane === pane
       ? "bg-bg-primary text-text-primary shadow-theme-sm"
       : "text-text-muted",
     ].join(" ")}
    >
     {pane === "reading" ? "Bài đọc" : "Ghi chú"}
    </button>
   ))}
  </div>
 );
}
