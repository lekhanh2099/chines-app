"use client";

import { EditableDialogShell } from "./components/EditableDialogShell";
import { DeletedContentDialog } from "./components/DeletedContentDialog";
import { EditModeToggle } from "./components/EditModeToggle";
import { LessonContentCreateDialog } from "./components/LessonContentCreateDialog";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";

export { EditableNodeWrapper } from "./components/EditableNodeWrapper";
export { NestedEditControls } from "./components/NestedEditControls";
export type { EditableNodePath, EditableEntityType } from "./store/types";

export function HanziHomeEditingDialogShell() {
 return <EditableDialogShell />;
}

export function HanziHomeEditingTools({
 includeDialogShell = true,
}: {
 includeDialogShell?: boolean;
} = {}) {
 const editMode = useHanziHomeEditMode();
 return (
  <>
   <EditModeToggle />
   {editMode ? <LessonContentCreateDialog /> : null}
   {editMode ? <DeletedContentDialog /> : null}
   {includeDialogShell ? <EditableDialogShell /> : null}
  </>
 );
}
