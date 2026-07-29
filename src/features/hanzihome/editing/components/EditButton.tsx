"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EditButton({ onClick, label = "Sửa" }: { onClick: () => void; label?: string }) {
 return (
  <Button type="button" variant="outline" size="sm" onClick={onClick}>
   <Pencil className="h-3.5 w-3.5" />
   {label}
  </Button>
 );
}
