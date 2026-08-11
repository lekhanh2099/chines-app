"use client";

import { type ReactNode } from "react";
import { Bug, GraduationCap, SlidersHorizontal } from "lucide-react";

import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
 contentEditingEnabled,
 developerToolsEnabled,
} from "@/features/hanzihome/context/workspaceLayout";
import { HanziHomeEditingDialogShell, HanziHomeEditingTools } from "@/features/hanzihome/editing";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import {
 useHanziHomeEditMode,
 useHanziHomeFeatureSelector,
} from "@/features/hanzihome/context/selectors";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { LessonViewModeSchema } from "@/features/hanzihome/context/types";
import { HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID } from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";

export function HanziHomeDeveloperTools({
 inline = false,
 compact = false,
 children,
}: {
 inline?: boolean;
 compact?: boolean;
 children?: ReactNode;
}) {
 const canEdit = useHanziHomeCanEdit();
 const editMode = useHanziHomeEditMode();
 const showEditingTools = contentEditingEnabled && canEdit;

 if (!developerToolsEnabled && !showEditingTools && !children) return null;

 if (compact) {
  return (
   <HanziHomeCompactDeveloperTools editMode={editMode} showEditingTools={showEditingTools}>
    {children}
   </HanziHomeCompactDeveloperTools>
  );
 }

 if (inline) {
  return (
   <>
    {showEditingTools ? <HanziHomeEditingDialogShell /> : null}
    <HanziHomeCompactDeveloperTools
     editMode={editMode}
     showEditingTools={showEditingTools}
     includeDialogShell={false}
    >
     {children}
    </HanziHomeCompactDeveloperTools>
   </>
  );
 }

 return (
  <HanziHomeCompactDeveloperTools editMode={editMode} showEditingTools={showEditingTools}>
   {children}
  </HanziHomeCompactDeveloperTools>
 );
}

function HanziHomeCompactDeveloperTools({
 editMode,
 showEditingTools,
 includeDialogShell = true,
 children,
}: {
 editMode: boolean;
 showEditingTools: boolean;
 includeDialogShell?: boolean;
 children?: ReactNode;
}) {
 const viewMode = useHanziHomeFeatureSelector((state) => state.viewMode);
 const { setViewMode } = useHanziHomeFeatureActions();

 return (
  <>
   {showEditingTools && includeDialogShell ? <HanziHomeEditingDialogShell /> : null}
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      variant={editMode ? "active" : "outline"}
      size="toolbar"
      aria-label="Mở công cụ bài học"
     >
      <SlidersHorizontal />
      Công cụ
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     {developerToolsEnabled ? (
      <DropdownMenuSub>
       <DropdownMenuSubTrigger>
        <GraduationCap />
        Chế độ xem
        <Typography as="span" variant="caption" tone="muted" className="ml-auto">
         {viewMode === "study" ? "Học tập" : "Kiểm tra"}
        </Typography>
       </DropdownMenuSubTrigger>
       <DropdownMenuSubContent width="md">
        <DropdownMenuLabel>Chế độ xem</DropdownMenuLabel>
        <DropdownMenuRadioGroup
         value={viewMode}
         onValueChange={(value) => setViewMode(LessonViewModeSchema.parse(value))}
        >
         <DropdownMenuRadioItem value="study">
          <GraduationCap />
          Học tập
         </DropdownMenuRadioItem>
         <DropdownMenuRadioItem value="debug">
          <Bug />
          Kiểm tra dữ liệu
         </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
       </DropdownMenuSubContent>
      </DropdownMenuSub>
     ) : null}

     {children ? (
      <>
       {developerToolsEnabled ? <DropdownMenuSeparator /> : null}
       <DropdownMenuLabel>Không gian học</DropdownMenuLabel>
       <div id={HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID}>{children}</div>
      </>
     ) : null}

     {showEditingTools ? (
      <>
       {developerToolsEnabled || children ? <DropdownMenuSeparator /> : null}
       <DropdownMenuLabel>Chỉnh sửa nội dung</DropdownMenuLabel>
       <HanziHomeEditingTools includeDialogShell={false} presentation="menu" />
      </>
     ) : null}
    </DropdownMenuContent>
   </DropdownMenu>
  </>
 );
}
