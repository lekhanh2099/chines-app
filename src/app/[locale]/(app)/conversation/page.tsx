import { AiConversationWorkspace } from "@/features/hanzihome/ai-conversation/AiConversationWorkspace";
import { SkillsHubHeaderContext } from "@/features/skills-hub/SkillsHubHeaderContext";

export default function ConversationPage() {
 return (
  <>
   <SkillsHubHeaderContext sectionId="conversation" />
   <div className="hanzihome-static-page h-full min-h-0 min-w-0 p-3 sm:p-5 lg:p-6">
    <AiConversationWorkspace />
   </div>
  </>
 );
}
