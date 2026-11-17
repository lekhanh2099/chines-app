"use client";

import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { lessonTextToReaderDocument } from "@/features/hanzihome/reader-adapters/lesson-text.adapter";
import { Reader } from "@/features/reader/components/Reader";
import { useLessonReader } from "@/features/hanzihome/reader-adapters/useLessonReader";
import type { LessonDisplayMode } from "./types";

export function TextSectionView({
 lessonId,
 section,
 displayMode,
}: {
 lessonId?: string;
 section: Extract<Section, { type: "text" }>;
 displayMode: LessonDisplayMode;
}) {
 const document = lessonTextToReaderDocument({
  documentId: `${lessonId ?? "text"}:${section.id}`,
  lessonId: lessonId ?? "",
  titleZh: section.title,
  titleVi: section.title_vi,
  sections: [section],
 });

 const integration = useLessonReader({
  document,
  lessonId,
  displayMode: lessonId ? undefined : displayMode,
 });
 return (
  <Reader data={integration.data} display={integration.display} services={integration.services} />
 );
}
