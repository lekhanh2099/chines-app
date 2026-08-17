import { HanziHomeVocabReviewPage } from "@/features/hanzihome/HanziHomeVocabReviewPage";

export default async function VocabReviewRoute({
 searchParams,
}: PageProps<"/[locale]/vocab/review">) {
 const params = await searchParams;
 const reviewLessonsParam = Array.isArray(params.reviewLessons)
  ? params.reviewLessons[0] || null
  : params.reviewLessons || null;

 return <HanziHomeVocabReviewPage reviewLessonsParam={reviewLessonsParam} />;
}
