"use client";

import { BookMarked } from "lucide-react";

import { Card } from "@/components/ui/card";
import type {
  HanziHomeCourseBook,
  HanziHomeLesson,
} from "@/features/hanzihome/types";

type BookLessonSummaryProps = {
  books: HanziHomeCourseBook[];
  lessons: HanziHomeLesson[];
};

export function BookLessonSummary({ books, lessons }: BookLessonSummaryProps) {
  const groupedBooks = books
    .map((book) => ({
      book,
      lessons: lessons.filter((lesson) => lesson.bookId === book.id),
    }))
    .filter((group) => group.lessons.length > 0);

  const fallbackLessons = lessons.filter(
    (lesson) => !lesson.bookId || !books.some((book) => book.id === lesson.bookId),
  );

  if (groupedBooks.length === 0 && fallbackLessons.length === 0) return null;

  return (
    <Card padding="md" className="rounded-2xl">
      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle">
            <BookMarked className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              Sách / quyển
            </p>
            <h2 className="text-lg font-black text-text-primary">
              Bài học trong course này
            </h2>
          </div>
        </div>

        <div className="grid gap-2">
          {groupedBooks.map(({ book, lessons: bookLessons }) => (
            <div
              key={book.id}
              className="rounded-2xl border border-border-default bg-bg-subtle p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-text-primary">
                    {book.title}
                  </p>
                  {book.shortTitle && (
                    <p className="text-xs font-bold text-text-muted">
                      {book.shortTitle}
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-bg-primary px-3 py-1 text-xs font-black text-text-muted">
                  {bookLessons.length} bài
                </span>
              </div>
            </div>
          ))}

          {fallbackLessons.length > 0 && (
            <div className="rounded-2xl border border-border-default bg-bg-subtle p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-text-primary">
                  Chưa phân quyển
                </p>

                <span className="rounded-full bg-bg-primary px-3 py-1 text-xs font-black text-text-muted">
                  {fallbackLessons.length} bài
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
