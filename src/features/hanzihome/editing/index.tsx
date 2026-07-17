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
 presentation = "toolbar",
}: {
 includeDialogShell?: boolean;
 presentation?: "toolbar" | "menu";
} = {}) {
 const editMode = useHanziHomeEditMode();
 return (
  <>
   <EditModeToggle presentation={presentation} />
   {editMode ? <LessonContentCreateDialog presentation={presentation} /> : null}
   {editMode ? <DeletedContentDialog presentation={presentation} /> : null}
   {includeDialogShell ? <EditableDialogShell /> : null}
  </>
 );
}
