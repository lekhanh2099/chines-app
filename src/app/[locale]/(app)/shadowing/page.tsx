import { Suspense } from "react";

import { SkillsHubHeaderContext } from "@/features/skills-hub/SkillsHubHeaderContext";
import { YoutubeShadowingWorkspace } from "@/features/youtube-shadowing/YoutubeShadowingWorkspace";

export default function ShadowingPage() {
 return (
  <>
   <SkillsHubHeaderContext sectionId="shadowing" />
   <Suspense fallback={null}>
    <YoutubeShadowingWorkspace />
   </Suspense>
  </>
 );
}
