"use client";

import Link from "next/link";
import { RotateCcw, TimerReset } from "lucide-react";
import { useSyncExternalStore } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Typography } from "@/components/ui/typography";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type {
 ReviewItem,
 ReviewRating,
} from "@/features/hanzihome/learning-loop/learning-loop.schemas";

const kindLabel: Record<ReviewItem["kind"], string> = {
 dictation_mistake: "Nghe chép",
 vocabulary: "Từ vựng",
 reading_bookmark: "Đọc",
 shadowing: "Shadowing",
 minimal_contrast: "Đối chiếu tối thiểu",
 error_correction: "Sửa lỗi",
 sentence_transformation: "Biến đổi câu",
 guided_production: "Sản xuất có hướng dẫn",
 timed_production: "Sản xuất giới hạn thời gian",
 delayed_transfer: "Chuyển giao trễ",
};

const ratingLabel: Record<ReviewRating, string> = {
 again: "Lại từ đầu",
 hard: "Khó",
 good: "Ổn",
};

let reviewClockSnapshot = 0;

function subscribeToReviewClock(onStoreChange: () => void) {
 const refresh = () => {
  reviewClockSnapshot = Date.now();
  onStoreChange();
 };

 refresh();
 const timer = window.setInterval(refresh, 60_000);
 return () => window.clearInterval(timer);
}

function getReviewClockSnapshot() {
 return reviewClockSnapshot;
}

function getReviewClockServerSnapshot() {
 return 0;
}

function useReviewClock() {
 return useSyncExternalStore(
  subscribeToReviewClock,
  getReviewClockSnapshot,
  getReviewClockServerSnapshot,
 );
}

export function LearningLoopReviewPage() {
 const learning = useLearningState();
 const loop = learning.state.progress.learningLoop;
 const now = useReviewClock();
 const reviewItems = loop?.reviewItems ?? [];
 const dueItems =
  now === 0
   ? []
   : [...reviewItems]
      .filter((item) => Date.parse(item.dueAt) <= now)
      .sort((first, second) => first.dueAt.localeCompare(second.dueAt));
 const upcomingItems =
  now === 0
   ? []
   : [...reviewItems]
      .filter((item) => Date.parse(item.dueAt) > now)
      .sort((first, second) => first.dueAt.localeCompare(second.dueAt));
 const latestSession = loop?.latestSession ?? null;

 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader
     eyebrow="HanziHome · Learning loop"
     title="Ôn tập & tiếp tục học"
     description="Một hàng đợi chung cho lỗi nghe chép, từ vựng, bookmark đọc, shadowing và các bài luyện chuyển giao. Lịch ôn dùng cùng persisted learning state của HanziHome."
    />

    {latestSession ? (
     <Card
      variant="section"
      padding="lg"
      className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center"
     >
      <div className="grid gap-1">
       <div className="flex flex-wrap items-center gap-2">
        <Typography as="h2" variant="sectionTitle" weight="black">
         Tiếp tục phiên gần nhất
        </Typography>
        <Badge variant={latestSession.status === "completed" ? "success" : "info"}>
         {latestSession.status}
        </Badge>
       </div>
       <Typography weight="black">
        {latestSession.titleZh || latestSession.titleVi || latestSession.sourceId}
       </Typography>
       {latestSession.positionLabel ? (
        <Typography variant="caption" tone="muted">
         {latestSession.positionLabel}
        </Typography>
       ) : null}
      </div>
      <Button asChild size="toolbar" variant="outline">
       <Link href={latestSession.href}>Mở lại</Link>
      </Button>
     </Card>
    ) : null}

    <section className="grid gap-3" aria-labelledby="due-review-title">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography id="due-review-title" as="h2" variant="sectionTitle" weight="black">
       Đến hạn
      </Typography>
      <Badge variant={dueItems.length > 0 ? "warning" : "default"}>{dueItems.length}</Badge>
     </div>
     {learning.isLoading || now === 0 ? (
      <Card variant="subtle" padding="lg">
       <Typography tone="muted">Đang tải hàng đợi ôn tập…</Typography>
      </Card>
     ) : dueItems.length === 0 ? (
      <Card variant="subtle" padding="lg" className="grid gap-2">
       <Typography weight="black">Chưa có mục nào đến hạn.</Typography>
       <Typography tone="muted">
        Các mục mới sẽ xuất hiện khi reader, dictation hoặc Personal Learning thêm bằng chứng cần
        ôn.
       </Typography>
      </Card>
     ) : (
      dueItems.map((item) => (
       <ReviewQueueItem key={item.id} item={item} onRate={learning.rateLearningReviewItem} />
      ))
     )}
    </section>

    {upcomingItems.length > 0 ? (
     <section className="grid gap-3" aria-labelledby="upcoming-review-title">
      <Typography id="upcoming-review-title" as="h2" variant="sectionTitle" weight="black">
       Sắp tới
      </Typography>
      {upcomingItems.slice(0, 8).map((item) => (
       <Card
        key={item.id}
        variant="section"
        padding="sm"
        className="flex flex-wrap items-center justify-between gap-3"
       >
        <div className="grid min-w-0 gap-1">
         <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{kindLabel[item.kind]}</Badge>
          <Badge variant="default">{item.state}</Badge>
         </div>
         <Typography clamp="one" weight="bold">
          {item.promptZh}
         </Typography>
        </div>
        <Typography variant="caption" tone="muted">
         <TimerReset className="mr-1 inline size-4" />
         {new Date(item.dueAt).toLocaleString("vi-VN")}
        </Typography>
       </Card>
      ))}
     </section>
    ) : null}
   </main>
  </PageContainer>
 );
}

function ReviewQueueItem({
 item,
 onRate,
}: {
 item: ReviewItem;
 onRate: (id: string, rating: ReviewRating) => void;
}) {
 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="grid gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="info">{kindLabel[item.kind]}</Badge>
     <Badge variant="default">{item.state}</Badge>
     {item.lapseCount > 0 ? (
      <Badge variant="warning">
       <RotateCcw className="mr-1 inline size-3.5" />
       {item.lapseCount}
      </Badge>
     ) : null}
    </div>
    <Typography as="h3" variant="sectionTitle" weight="black">
     {item.promptZh}
    </Typography>
    {item.pinyin ? <Typography tone="muted">{item.pinyin}</Typography> : null}
    {item.meaningVi ? <Typography tone="secondary">{item.meaningVi}</Typography> : null}
    {item.userAnswer ? (
     <Typography variant="caption" tone="muted">
      Lần trả lời trước: {item.userAnswer}
     </Typography>
    ) : null}
   </div>
   <div className="flex flex-wrap gap-2">
    {(["again", "hard", "good"] as const).map((rating) => (
     <Button
      key={rating}
      size="toolbar"
      variant={rating === "good" ? "default" : "outline"}
      onClick={() => onRate(item.id, rating)}
     >
      {ratingLabel[rating]}
     </Button>
    ))}
    <Button asChild size="toolbar" variant="link">
     <Link href={item.sourceHref}>Mở nguồn</Link>
    </Button>
   </div>
  </Card>
 );
}
