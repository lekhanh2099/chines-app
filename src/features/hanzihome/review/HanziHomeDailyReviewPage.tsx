"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Typography } from "@/components/ui/typography";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { VocabReviewSkeleton } from "@/features/hanzihome/components/VocabReviewSkeleton";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { isReviewDue } from "@/features/hanzihome/review/review-scheduler";
import type {
 HanziHomeLesson,
 HanziHomeVocabItem,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

function buildReviewLesson(lessons: HanziHomeLesson[]) {
 const firstLesson = lessons[0];
 if (!firstLesson) return null;

 const vocabById = new Map<string, HanziHomeVocabItem>();
 const grammarById = new Map<string, HanziHomeLesson["grammar"][number]>();

 for (const lesson of lessons) {
  for (const word of lesson.vocab) {
   const itemId = getVocabItemKey(word);
   if (!vocabById.has(itemId)) vocabById.set(itemId, word);
  }
  for (const point of lesson.grammar) {
   if (!grammarById.has(point.id)) grammarById.set(point.id, point);
  }
 }

 return {
  ...firstLesson,
  id: "daily-review",
  title: "Ôn đến hạn",
  titleZh: "每日复习",
  vocab: [...vocabById.values()],
  grammar: [...grammarById.values()],
  vocabIds: [...vocabById.keys()],
  grammarPointIds: [...grammarById.keys()],
 };
}

function countDueItems(state: UserLearningState) {
 const vocabDue = Object.values(state.progress.vocab ?? {}).filter((item) => isReviewDue(item)).length;
 const grammarDue = Object.values(state.progress.grammar ?? {}).filter((item) =>
  isReviewDue(item),
 ).length;
 return vocabDue + grammarDue;
}

export function HanziHomeDailyReviewPage() {
 const catalogQuery = useHanziHomeCatalogQuery({ includeLessons: true });
 const learning = useLearningState();
 const lessons = catalogQuery.data.lessons;
 const reviewLesson = useMemo(() => buildReviewLesson(lessons), [lessons]);
 const lessonByReviewItemId = useMemo(() => {
  const byId = new Map<string, HanziHomeLesson>();

  for (const lesson of lessons) {
   for (const word of lesson.vocab) {
    const key = `vocab:${getVocabItemKey(word)}`;
    if (!byId.has(key)) byId.set(key, lesson);
   }
   for (const point of lesson.grammar) {
    const key = `grammar:${point.id}`;
    if (!byId.has(key)) byId.set(key, lesson);
   }
  }

  return byId;
 }, [lessons]);
 const dueCount = countDueItems(learning.state);

 const answerReview = (
  item: {
   type: UserLearningState["reviewHistory"][number]["type"];
   id: string;
  },
  result: ReviewResult,
 ) => {
  if (item.type === "vocab" || item.type === "grammar") {
   learning.recordReview(item, result);
  }
 };

 if (catalogQuery.isPending || learning.isLoading) {
  return (
   <PageContainer>
    <main className="grid w-full min-w-0 gap-5">
     <PageHeader
      eyebrow="Review"
      title="Ôn đến hạn"
      description="Ưu tiên các mục đã học và đến lượt ôn lại."
     />
     <VocabReviewSkeleton />
    </main>
   </PageContainer>
  );
 }

 return (
  <PageContainer>
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader
     eyebrow="Review"
     title="Ôn đến hạn"
     description="Hàng đợi được tính từ trạng thái và lần ôn gần nhất; mục chưa từng học không bị đẩy vào hàng đợi."
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {dueCount} mục đến hạn
      </Typography>
     }
     actions={
      <Button asChild variant="outline" size="toolbar">
       <Link href="/hanzihome" prefetch={false}>
        <BookOpen data-icon="inline-start" />
        Về bài học
       </Link>
      </Button>
     }
    />

    {catalogQuery.isError ? (
     <Card variant="subtle" padding="md" role="alert">
      <Typography as="p" variant="bodySmall" tone="danger" weight="bold">
       {catalogQuery.error?.message ?? "Không tải được dữ liệu để tạo hàng đợi ôn tập."}
      </Typography>
     </Card>
    ) : null}

    {!catalogQuery.isError && !reviewLesson ? (
     <EmptyState
      surface="subtle"
      title="Chưa có học liệu để ôn"
      description="HanziHome chưa có bài học khả dụng cho hàng đợi ôn tập."
     />
    ) : null}

    {!catalogQuery.isError && reviewLesson ? (
     <VocabReviewPanel
      lesson={reviewLesson}
      learningState={learning.state}
      initialMode="due"
      availableModes={["due", "hard"]}
      title="Hàng đợi hôm nay"
      description="Làm mục đến hạn trước; có thể chuyển sang nhóm còn khó nếu muốn luyện thêm."
      onAnswer={answerReview}
      onToggleBookmark={(scope, id) => learning.toggleBookmark(scope, id)}
      getItemLesson={(item) => lessonByReviewItemId.get(`${item.type}:${item.id}`) ?? null}
     />
    ) : null}
   </main>
  </PageContainer>
 );
}
