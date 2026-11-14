import { PersonalLearningPage as PersonalLearningContent } from "@/features/personal-learning/PersonalLearningPage";

export default async function PersonalLearningPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <PersonalLearningContent documentId={documentId} />
  </div>
 );
}
