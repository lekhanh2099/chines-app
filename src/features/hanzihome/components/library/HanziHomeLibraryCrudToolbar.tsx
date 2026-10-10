"use client";

import { Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";
import { CreateBookDialog } from "./CreateBookDialog";
import { CreateCourseDialog } from "./CreateCourseDialog";
import { CreateLessonDialog } from "./CreateLessonDialog";
import { DeletedContentDialog } from "@/features/hanzihome/editing/components/DeletedContentDialog";

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
 return (
  <div className="flex flex-wrap items-center gap-2">
   <Button
    type="button"
    size="sm"
    variant={editMode ? "active" : "outline"}
    onClick={() => onEditModeChange(!editMode)}
   >
    {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
    {editMode ? t("exitEdit") : t("edit")}
   </Button>
   {editMode ? (
    <>
     <CreateCourseDialog />
     <CreateBookDialog courses={courses} />
     <CreateLessonDialog courses={courses} books={books} />
     <DeletedContentDialog />
    </>
   ) : null}
  </div>
 );
}
