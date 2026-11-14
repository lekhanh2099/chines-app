"use client";

import { useEffect, useMemo } from "react";
import { FileCode2, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbPage,
} from "@/components/layout/header/app-header-breadcrumb";
import { Button } from "@/components/ui/actions/button";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";
import { Link } from "@/i18n/navigation";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import { CreateBookDialog } from "./CreateBookDialog";
import { CreateCourseDialog } from "./CreateCourseDialog";
import { CreateLessonDialog } from "./CreateLessonDialog";
import { DeletedContentDialog } from "@/features/hanzihome/editing/components/DeletedContentDialog";

const HEADER_OWNER_ID = "hanzihome-library";

export function HanziHomeLibraryCrudToolbar({
 courses,
 books,
 editMode,
 onEditModeChange,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 editMode: boolean;
 onEditModeChange: (enabled: boolean) => void;
}) {
 const t = useTranslations("Common.library");
 const shell = useTranslations("Shell");
 const content = useMemo(
  () => (
   <>
    <AppHeaderBreadcrumb className="hidden shrink-0 md:inline-flex">
     <AppHeaderBreadcrumbItem>
      <AppHeaderBreadcrumbPage title={shell("breadcrumbs.hanzihome")}>
       {shell("breadcrumbs.hanzihome")}
      </AppHeaderBreadcrumbPage>
     </AppHeaderBreadcrumbItem>
    </AppHeaderBreadcrumb>
    <div className="flex shrink-0 items-center gap-1.5">
     <Button
      type="button"
      size="compact"
      variant="ghost"
      aria-label={t("htmlFiles")}
      title={t("htmlFiles")}
      asChild
     >
      <Link href="/html-artifacts">
       <FileCode2 data-icon="inline-start" />
       <span className="hidden sm:inline">{t("htmlFiles")}</span>
      </Link>
     </Button>
     <Button
      type="button"
      size="compact"
      variant={editMode ? "active" : "ghost"}
      aria-label={editMode ? t("exitEdit") : t("edit")}
      title={editMode ? t("exitEdit") : t("edit")}
      aria-pressed={editMode}
      onClick={() => onEditModeChange(!editMode)}
     >
      {editMode ? <X data-icon="inline-start" /> : <Pencil data-icon="inline-start" />}
      <span className="hidden sm:inline">{editMode ? t("exitEdit") : t("edit")}</span>
     </Button>
    </div>
   </>
  ),
  [editMode, onEditModeChange, shell, t],
 );

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(HEADER_OWNER_ID, content);
 }, [content]);

 useEffect(
  () => () => {
   headerToolbarStore.actions.clearOwnedContent(HEADER_OWNER_ID);
  },
  [],
 );

 return editMode ? (
  <div className="flex flex-wrap items-center gap-2">
   <CreateCourseDialog />
   <CreateBookDialog courses={courses} />
   <CreateLessonDialog courses={courses} books={books} />
   <DeletedContentDialog />
  </div>
 ) : null;
}
