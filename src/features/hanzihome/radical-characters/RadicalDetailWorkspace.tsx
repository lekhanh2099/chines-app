"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { Card } from "@/components/ui/layout/card";
import { RadicalDetailPanel } from "@/features/hanzihome/components/RadicalDetailPanel";
import { RadicalEditDialog } from "@/features/hanzihome/components/RadicalEditDialog";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";

import { RadicalCharacterNotes } from "./RadicalCharacterNotes";
import { useRadicalCharacterIndex } from "./useRadicalCharacterIndex";

const headerOwnerId = "radical-detail";

/** Detail page of one catalog radical with the explained characters that belong to it. */
export function RadicalDetailWorkspace({ radicalId }: { radicalId: string }) {
 const t = useTranslations("Radicals");
 const tShell = useTranslations("Shell");
 const catalog = useHanziHomeCatalogQuery({ includeRadicals: true });
 const canEdit = useHanziHomeCanEdit();
 const characterIndex = useRadicalCharacterIndex(true);
 const [editing, setEditing] = useState(false);
 const radical = catalog.data.radicals.find((item) => item.id === radicalId);
 const characterSet = characterIndex.data?.sets.find((set) => set.radicalId === radicalId);
 const title = radical ? `${radical.radical} · ${radical.nameVi || t("unnamed")}` : "";

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(
   headerOwnerId,
   <AppHeaderBreadcrumb
    aria-label={t("characterNotes.breadcrumbAria")}
    className="min-w-0 max-w-full"
   >
    <AppHeaderBreadcrumbItem className="shrink-0">
     <AppHeaderBreadcrumbLink href="/radicals">
      {tShell("breadcrumbs.radicals")}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    {title ? (
     <>
      <AppHeaderBreadcrumbSeparator />
      <AppHeaderBreadcrumbItem className="min-w-0">
       <AppHeaderBreadcrumbPage>{title}</AppHeaderBreadcrumbPage>
      </AppHeaderBreadcrumbItem>
     </>
    ) : null}
   </AppHeaderBreadcrumb>,
  );
 }, [t, tShell, title]);
 useEffect(() => () => headerToolbarStore.actions.clearOwnedContent(headerOwnerId), []);

 return (
  <div className="hanzihome-static-page grid w-full min-w-0 content-start gap-4">
   <Card variant="section" padding="md">
    {radical ? (
     <RadicalDetailPanel radical={radical} editMode={canEdit} onEdit={() => setEditing(true)} />
    ) : (
     <StudyInstructionText tone="muted">
      {catalog.isPending
       ? t("characterNotes.radicalLoading")
       : catalog.isError
         ? t("characterNotes.radicalUnavailable")
         : t("characterNotes.radicalMissing")}
     </StudyInstructionText>
    )}
   </Card>
   {characterSet ? <RadicalCharacterNotes set={characterSet} focusCharacter="" /> : null}
   {radical ? (
    <RadicalEditDialog
     radical={editing ? radical : null}
     open={editing}
     onOpenChange={setEditing}
    />
   ) : null}
  </div>
 );
}
