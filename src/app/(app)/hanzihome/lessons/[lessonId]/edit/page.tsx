import { LessonDbEditor } from "@/features/hanzihome/lessons/components/LessonDbEditor";

type PageProps = {
 params: Promise<{
  lessonId: string;
 }>;
};

export default async function HanziHomeLessonEditPage({ params }: PageProps) {
 const { lessonId } = await params;

 return <LessonDbEditor lessonId={lessonId} />;
}
