import { Suspense } from "react";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { SkillsHubHeaderContext } from "@/features/skills-hub/SkillsHubHeaderContext";
import { YoutubeShadowingWorkspace } from "@/features/youtube-shadowing/YoutubeShadowingWorkspace";

export default function ShadowingPage() {
 return (
  <>
   <SkillsHubHeaderContext sectionId="shadowing" />
   <PageContainer>
    <Suspense fallback={null}>
     <YoutubeShadowingWorkspace />
    </Suspense>
   </PageContainer>
  </>
 );
}
