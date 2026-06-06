"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EditButton({ onClick }: { onClick: () => void }) {
 return (
  <Button
   type="button"
   variant="outline"
   size="sm"
   className="h-7 gap-1 bg-bg-card/95 px-2 text-xs shadow-theme-sm backdrop-blur"
   onClick={onClick}
  >
   <Pencil className="h-3.5 w-3.5" />
   Sửa
  </Button>
 );
}
