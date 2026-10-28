"use client";

import { type ReactNode } from "react";
import { Bug, Columns2, GraduationCap, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 contentEditingEnabled,
 developerToolsEnabled,
} from "@/features/hanzihome/context/workspaceLayout";
import type { LessonViewMode } from "@/features/hanzihome/context/types";
import { HanziHomeEditingDialogShell, HanziHomeEditingTools } from "@/features/hanzihome/editing";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import {
 useHanziHomeEditMode,
 useHanziHomeFeatureSelector,
} from "@/features/hanzihome/context/selectors";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";

function isLessonViewMode(value: string): value is LessonViewMode {
 return value === "study" || value === "debug";
}
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

 if (!showEditingTools && !children) return null;

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
 const tModules = useTranslations("Shell.studyModules");
 return (
  <>
   {showEditingTools && includeDialogShell ? <HanziHomeEditingDialogShell /> : null}
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      variant={editMode ? "active" : "outline"}
      size="toolbar"
      aria-label={tModules("openTools")}
      title={tModules("lessonTools")}
     >
      <SlidersHorizontal />
      <span className="hidden sm:inline">{tModules("tools")}</span>
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     <HanziHomeDeveloperToolsMenuContent>{children}</HanziHomeDeveloperToolsMenuContent>
    </DropdownMenuContent>
   </DropdownMenu>
  </>
 );
}

export function HanziHomeDeveloperToolsMenuContent({
 children,
 leadingSeparator = false,
}: {
 children?: ReactNode;
 leadingSeparator?: boolean;
}) {
 const tModules = useTranslations("Shell.studyModules");
 const canEdit = useHanziHomeCanEdit();
 const showEditingTools = contentEditingEnabled && canEdit;
 const editMode = useHanziHomeEditMode();
 const showDeveloperTools = developerToolsEnabled && showEditingTools && editMode;
 const viewMode = useHanziHomeFeatureSelector((state) => state.viewMode);
 const { setViewMode } = useHanziHomeFeatureActions();

 return (
  <>
   {leadingSeparator ? <DropdownMenuSeparator /> : null}
   {showDeveloperTools ? (
    <>
     <DropdownMenuLabel>{tModules("viewMode")}</DropdownMenuLabel>
     <DropdownMenuRadioGroup
      value={viewMode}
      onValueChange={(value) => {
       if (isLessonViewMode(value)) setViewMode(value);
      }}
     >
      <DropdownMenuRadioItem value="study">
       <GraduationCap />
       {tModules("studyMode")}
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="debug">
       <Bug />
       {tModules("dataAudit")}
      </DropdownMenuRadioItem>
     </DropdownMenuRadioGroup>
    </>
   ) : null}

   {children ? (
    <>
     {showDeveloperTools ? <DropdownMenuSeparator /> : null}
     <DropdownMenuLabel>{tModules("workspace")}</DropdownMenuLabel>
     {children}
    </>
   ) : null}

   {showEditingTools ? (
    <>
     {showDeveloperTools || children ? <DropdownMenuSeparator /> : null}
     <DropdownMenuLabel>{tModules("editContent")}</DropdownMenuLabel>
     <HanziHomeEditingTools includeDialogShell={false} presentation="menu" />
    </>
   ) : null}
  </>
 );
}

export function HanziHomeDeveloperToolsSheetContent({
 splitEnabled,
 onToggleSplit,
}: {
 splitEnabled: boolean;
 onToggleSplit: () => void;
}) {
 const tModules = useTranslations("Shell.studyModules");
 const canEdit = useHanziHomeCanEdit();
 const showEditingTools = contentEditingEnabled && canEdit;
 const editMode = useHanziHomeEditMode();
 const showDeveloperTools = developerToolsEnabled && showEditingTools && editMode;
 const viewMode = useHanziHomeFeatureSelector((state) => state.viewMode);
 const { setViewMode } = useHanziHomeFeatureActions();

 return (
  <div className="grid gap-5">
   <section className="grid gap-3">
    <Typography as="h3" variant="cardTitle" tone="muted" weight="black" transform="uppercase">
     {tModules("workspace")}
    </Typography>
    <Button type="button" variant="surfaceCard" size="touch" onClick={onToggleSplit}>
     <Columns2 data-icon="inline-start" />
     {splitEnabled ? tModules("closeSplitScreen") : tModules("splitScreen")}
    </Button>
   </section>

   {showDeveloperTools ? (
    <section className="grid gap-3">
     <Typography as="h3" variant="cardTitle" tone="muted" weight="black" transform="uppercase">
      {tModules("viewMode")}
     </Typography>
     <div className="grid grid-cols-2 gap-2">
      <Button
       type="button"
       variant={viewMode === "study" ? "active" : "surfaceCard"}
       size="touch"
       aria-pressed={viewMode === "study"}
       onClick={() => setViewMode("study")}
      >
       <GraduationCap data-icon="inline-start" />
       {tModules("studyMode")}
      </Button>
      <Button
       type="button"
       variant={viewMode === "debug" ? "active" : "surfaceCard"}
       size="touch"
       aria-pressed={viewMode === "debug"}
       onClick={() => setViewMode("debug")}
      >
       <Bug data-icon="inline-start" />
       {tModules("dataAudit")}
      </Button>
     </div>
    </section>
   ) : null}

   {showEditingTools ? (
    <section className="grid gap-3">
     <Typography as="h3" variant="cardTitle" tone="muted" weight="black" transform="uppercase">
      {tModules("editContent")}
     </Typography>
     <div className="flex flex-wrap gap-2">
      <HanziHomeEditingTools includeDialogShell={false} />
     </div>
    </section>
   ) : null}
  </div>
 );
}
