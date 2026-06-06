"use client";

import { Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useHanziHomeDraftStore } from "../store/useHanziHomeDraftStore";

export function EditModeToggle() {
 const editMode = useHanziHomeDraftStore((state) => state.editMode);
 const setEditMode = useHanziHomeDraftStore((state) => state.setEditMode);

 return (
  <Button
   type="button"
   variant={editMode ? "default" : "outline"}
   size="sm"
   className="h-8 shrink-0 px-2.5 text-xs"
   onClick={() => setEditMode(!editMode)}
  >
   {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
   {editMode ? "Tắt sửa" : "Edit"}
  </Button>
 );
}
