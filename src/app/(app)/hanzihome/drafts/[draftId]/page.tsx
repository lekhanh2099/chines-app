import { LessonDraftEditor } from "@/features/hanzihome/lesson-drafts/components/LessonDraftEditor";

type PageProps = {
  params: Promise<{
    draftId: string;
  }>;
};

export default async function HanziHomeLessonDraftPage({ params }: PageProps) {
  const { draftId } = await params;

  return <LessonDraftEditor draftId={draftId} />;
}
