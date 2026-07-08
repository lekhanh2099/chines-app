"use client";

import type { MobileNotePane } from "./types";
import { Button } from "@/components/ui/button";

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
    <Button
     key={pane}
     type="button"
     variant={activePane === pane ? "active" : "ghost"}
     onClick={() => onChange(pane)}
     className="w-full rounded-xl px-3 py-2 font-black"
    >
     {pane === "reading" ? "Bài đọc" : "Ghi chú"}
    </Button>
   ))}
  </div>
 );
}
