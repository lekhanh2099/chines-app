import { PersonalLearningPage as PersonalLearningContent } from "@/features/personal-learning/PersonalLearningPage";

export default async function PersonalLearningDocumentPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <PersonalLearningContent slug={slug} />
  </div>
 );
}
