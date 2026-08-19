"use client";

import { Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import type { EditingToolsPresentation } from "@/features/hanzihome/context/types";

export function EditModeToggle({
 presentation = "toolbar",
}: {
 presentation?: EditingToolsPresentation;
}) {
 const editMode = useHanziHomeEditMode();
 const { setEditMode } = useHanziHomeFeatureActions();

 if (presentation === "menu") {
  return (
   <DropdownMenuCheckboxItem
    checked={editMode}
    onSelect={(event) => event.preventDefault()}
    onCheckedChange={setEditMode}
   >
    {editMode ? <X /> : <Pencil />}
    {editMode ? "Kết thúc chỉnh sửa" : "Bật chỉnh sửa"}
   </DropdownMenuCheckboxItem>
  );
 }

 return (
  <Button
   type="button"
   variant={editMode ? "active" : "outline"}
   size="toolbar"
   aria-pressed={editMode}
   onClick={() => setEditMode(!editMode)}
  >
   {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
   {editMode ? "Kết thúc chỉnh sửa" : "Bật chỉnh sửa"}
  </Button>
 );
}
