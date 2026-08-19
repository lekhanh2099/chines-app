"use client";

import { EditableDialogShell } from "./components/EditableDialogShell";
import { DeletedContentDialog } from "./components/DeletedContentDialog";
import { EditModeToggle } from "./components/EditModeToggle";
import { LessonContentCreateDialog } from "./components/LessonContentCreateDialog";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import type { EditingToolsPresentation } from "@/features/hanzihome/context/types";

export { EditableNodeWrapper } from "./components/EditableNodeWrapper";
export { NestedEditControls } from "./components/NestedEditControls";
export type { EditableNodePath, EditableEntityType, NullableEditableNodePath } from "./store/types";

export function HanziHomeEditingDialogShell() {
 return <EditableDialogShell />;
}

export function HanziHomeEditingTools({
 includeDialogShell = true,
 presentation = "toolbar",
}: {
 includeDialogShell?: boolean;
 presentation?: EditingToolsPresentation;
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
