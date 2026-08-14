"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Typography } from "@/components/ui/typography";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { isWeakPracticeProgress } from "@/features/hanzihome/practice/practice-progress";
import { usePracticeProgress } from "@/features/hanzihome/practice/usePracticeProgress";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";

export function HanziHomePracticeErrorsPage() {
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const practice = usePracticeProgress();
 const weakItems = useMemo(
  () =>
   Object.values(practice.items)
    .filter(isWeakPracticeProgress)
    .toSorted(
     (left, right) =>
      Date.parse(right.lastErrorAt ?? right.lastAttemptAt) -
      Date.parse(left.lastErrorAt ?? left.lastAttemptAt),
    ),
  [practice.items],
 );

 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader
     eyebrow="Practice Intelligence"
     title="Lỗi cần luyện"
     description="Tập trung lại các câu tự chấm đã trả lời sai hoặc còn dao động. Dữ liệu vòng này được giữ cục bộ trên trình duyệt."
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {weakItems.length} mục cần chú ý
      </Typography>
     }
    />

    {!practice.hasHydrated ? (
     <Card variant="subtle" padding="lg">
      <Typography as="p" variant="bodySmall" tone="muted" weight="bold">
       Đang đọc lịch sử luyện tập trên thiết bị…
      </Typography>
     </Card>
    ) : null}

    {practice.hasHydrated && weakItems.length === 0 ? (
     <EmptyState
      surface="subtle"
      icon={<CircleAlert />}
      title="Chưa có lỗi cần luyện lại"
      description="Các câu tự chấm ở phần luyện nghe sẽ xuất hiện ở đây khi có đáp án sai hoặc kết quả chưa ổn định."
     />
    ) : null}

    {practice.hasHydrated && weakItems.length > 0 ? (
     <section className="grid gap-2" aria-label="Các lỗi cần luyện lại">
      {weakItems.map((item) => {
       const lesson = catalog.lessons.find((candidate) => candidate.id === item.lessonId);
       const href = lesson?.courseId
        ? buildHanziHomeLessonHref({
           courseId: lesson.courseId,
           bookId: lesson.bookId,
           lessonNumber: lesson.lessonNumber,
           module: item.source === "listening" ? "listening" : "practice",
          })
        : null;

       return (
        <Card key={`${item.source}:${item.lessonId}:${item.itemId}`} variant="section" padding="md">
         <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="grid min-w-0 gap-1.5">
           <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="warning">{item.lastResult ? "Chưa ổn định" : "Sai gần nhất"}</Badge>
            <Badge variant="default" casing="natural">
             {item.exerciseType}
            </Badge>
           </div>
           <Typography as="h2" variant="body" tone="default" weight="black" clamp="one">
            {lesson?.titleZh || lesson?.title || `Bài ${item.lessonId}`}
           </Typography>
           <Typography as="p" variant="caption" tone="muted">
            Item {item.itemId} · đúng {item.correctCount}/{item.attemptCount} · mastery {Math.round(item.masteryScore * 100)}%
           </Typography>
          </div>

          {href ? (
           <Button asChild variant="outline" size="toolbar">
            <Link href={href} prefetch={false}>
             Luyện lại
             <ArrowRight data-icon="inline-end" />
            </Link>
           </Button>
          ) : null}
         </div>
        </Card>
       );
      })}
     </section>
    ) : null}
   </main>
  </PageContainer>
 );
}
