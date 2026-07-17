"use client";

import { Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";

export function EditModeToggle({
 presentation = "toolbar",
}: {
 presentation?: "toolbar" | "menu";
}) {
 const editMode = useHanziHomeEditMode();
 const { setEditMode } = useHanziHomeFeatureActions();

 return (
  <Button
   type="button"
   variant={
    presentation === "menu" ? (editMode ? "menuActive" : "menu") : editMode ? "active" : "outline"
   }
   size="sm"
   role={presentation === "menu" ? "menuitemcheckbox" : undefined}
   aria-checked={presentation === "menu" ? editMode : undefined}
   onClick={() => setEditMode(!editMode)}
  >
   {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
   {editMode ? "Kết thúc chỉnh sửa" : "Bật chỉnh sửa"}
  </Button>
 );
}
