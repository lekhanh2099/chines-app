"use client";

import { Button } from "@/components/ui/actions/button";
import { preserveEditorSelection } from "./preserve-editor-selection";

export function FormatButton({
 active,
 onClick,
 title,
 children,
}: {
 active?: boolean;
 onClick: () => void;
 title: string;
 children: React.ReactNode;
}) {
 return (
  <Button
   variant={active ? "active" : "ghost"}
   size="icon-toolbar"
   onMouseDown={preserveEditorSelection}
   onClick={(event) => {
    preserveEditorSelection(event);
    onClick();
   }}
   aria-label={title}
   title={title}
  >
   {children}
  </Button>
 );
}
