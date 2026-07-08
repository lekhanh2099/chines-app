"use client";

import { Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";

export function EditModeToggle() {
 const editMode = useHanziHomeEditMode();
 const { setEditMode } = useHanziHomeFeatureActions();

 return (
  <Button
   type="button"
   variant={editMode ? "active" : "outline"}
   size="sm"
   className="h-8 shrink-0 px-2.5 text-xs"
   onClick={() => setEditMode(!editMode)}
  >
   {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
   {editMode ? "Tắt sửa" : "Edit"}
  </Button>
 );
}
