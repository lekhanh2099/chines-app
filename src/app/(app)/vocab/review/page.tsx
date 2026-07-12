import { HanziHomeVocabReviewPage } from "@/features/hanzihome/HanziHomeVocabReviewPage";

export default async function VocabReviewRoute({
 searchParams,
}: {
 searchParams: Promise<{ reviewLessons?: string | string[] }>;
}) {
 const params = await searchParams;
 const reviewLessonsParam = Array.isArray(params.reviewLessons)
  ? params.reviewLessons[0] || null
  : params.reviewLessons || null;

 return <HanziHomeVocabReviewPage reviewLessonsParam={reviewLessonsParam} />;
}
