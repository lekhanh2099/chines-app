import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  LibraryBig,
  NotebookPen,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHanziHomeData } from "@/features/hanzihome/static-data";
import type {
  HanziHomeCourse,
  HanziHomeCourseBook,
  HanziHomeLesson,
} from "@/features/hanzihome/types";

type CourseStats = {
  lessons: HanziHomeLesson[];
  books: HanziHomeCourseBook[];
  vocabCount: number;
  grammarCount: number;
};

export default function HomePage() {
  const data = getHanziHomeData();

  const courses = data.courses ?? [];
  const books = data.books ?? [];
  const lessons = data.lessons ?? [];

  const totalVocab = lessons.reduce((sum, lesson) => sum + lesson.vocab.length, 0);
  const totalGrammar = lessons.reduce(
    (sum, lesson) => sum + lesson.grammar.length,
    0,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 lg:px-8">
      <section className="grid gap-3">
        <p className="text-sm font-black uppercase tracking-wide text-text-muted">
          HanziHome Library
        </p>

        <h1 className="text-4xl font-black tracking-normal text-text-primary md:text-5xl">
          Thư viện học liệu
        </h1>

        <p className="max-w-3xl text-base font-semibold leading-relaxed text-text-secondary">
          Chọn course trước, rồi vào workspace học theo bài: từ vựng, ngữ pháp,
          ghi chú, bộ thủ và ôn tập.
        </p>
      </section>

      <Card padding="lg" className="rounded-2xl">
        <div className="grid gap-4 sm:grid-cols-3">
          <HomeMetric label="Course" value={courses.length || 1} />
          <HomeMetric label="Từ vựng" value={totalVocab} />
          <HomeMetric label="Ngữ pháp" value={totalGrammar} />
        </div>
      </Card>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              Courses
            </p>
            <h2 className="mt-1 text-2xl font-black text-text-primary">
              Chọn bộ học liệu
            </h2>
          </div>
        </div>

        <div className="grid gap-4">
          {courses.length > 0 ? (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                stats={getCourseStats(course, lessons, books)}
              />
            ))
          ) : (
            <FallbackCourseCard
              lessons={lessons}
              vocabCount={totalVocab}
              grammarCount={totalGrammar}
            />
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <HomeAction
          href="/hanzihome"
          icon={BookOpen}
          title="Workspace tự học"
          description="Mở nhanh workspace nếu chỉ muốn tiếp tục bài đang học."
        />

        <HomeAction
          href="/notes"
          icon={NotebookPen}
          title="Ghi chú"
          description="Mở hệ ghi chú chính: rich editor, autosave, tab và split view."
        />
      </section>
    </main>
  );
}

function getCourseStats(
  course: HanziHomeCourse,
  lessons: HanziHomeLesson[],
  books: HanziHomeCourseBook[],
): CourseStats {
  const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
  const courseBooks = books.filter((book) => book.courseId === course.id);

  return {
    lessons: courseLessons,
    books: courseBooks,
    vocabCount: courseLessons.reduce(
      (sum, lesson) => sum + lesson.vocab.length,
      0,
    ),
    grammarCount: courseLessons.reduce(
      (sum, lesson) => sum + lesson.grammar.length,
      0,
    ),
  };
}

function CourseCard({
  course,
  stats,
}: {
  course: HanziHomeCourse;
  stats: CourseStats;
}) {
  const primaryBook = stats.books[0];
  const href = `/hanzihome?courseId=${course.id}`;

  return (
    <Card padding="lg" className="rounded-2xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle">
            <BookMarked className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              {primaryBook?.shortTitle || primaryBook?.title || "Course"}
            </p>

            <h3 className="mt-1 text-2xl font-black text-text-primary">
              {course.title}
            </h3>

            {course.subtitle && (
              <p className="mt-1 text-sm font-semibold leading-relaxed text-text-secondary">
                {course.subtitle}
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <HomeMetric label="Bài học" value={stats.lessons.length} />
              <HomeMetric label="Từ vựng" value={stats.vocabCount} />
              <HomeMetric label="Ngữ pháp" value={stats.grammarCount} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild size="lg">
            <Link href={href}>
              <Sparkles className="h-5 w-5" />
              Vào học
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FallbackCourseCard({
  lessons,
  vocabCount,
  grammarCount,
}: {
  lessons: HanziHomeLesson[];
  vocabCount: number;
  grammarCount: number;
}) {
  return (
    <Card padding="lg" className="rounded-2xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle">
            <LibraryBig className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              Legacy data
            </p>

            <h3 className="mt-1 text-2xl font-black text-text-primary">
              Giáo trình Hán ngữ
            </h3>

            <p className="mt-1 text-sm font-semibold leading-relaxed text-text-secondary">
              Dữ liệu cũ chưa có course metadata, app sẽ mở workspace mặc định.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <HomeMetric label="Bài học" value={lessons.length} />
              <HomeMetric label="Từ vựng" value={vocabCount} />
              <HomeMetric label="Ngữ pháp" value={grammarCount} />
            </div>
          </div>
        </div>

        <Button asChild size="lg">
          <Link href="/hanzihome">
            <Sparkles className="h-5 w-5" />
            Vào học
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function HomeMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-border-default bg-bg-subtle p-4">
      <p className="text-3xl font-black text-text-primary">{value}</p>
      <p className="text-sm font-bold text-text-muted">{label}</p>
    </div>
  );
}

function HomeAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card
        padding="lg"
        className="h-full rounded-2xl transition-colors hover:border-accent-muted hover:bg-accent-subtle"
      >
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle shadow-theme-sm">
            <Icon className="h-5 w-5" />
          </span>

          <span className="grid gap-1">
            <span className="text-xl font-black text-text-primary">{title}</span>
            <span className="text-sm font-semibold leading-relaxed text-text-secondary">
              {description}
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
