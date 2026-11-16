import { SpeakingDrillsWorkspace } from "@/features/hanzihome/speaking-drills/SpeakingDrillsWorkspace";
import {
 getSpeakingDrillSelection,
 getSpeakingDrillsCatalog,
} from "@/features/hanzihome/speaking-drills/speaking-drills-content.server";

export default async function SpeakingDrillsPage({
 searchParams,
}: Pick<PageProps<"/[locale]/speaking-drills">, "searchParams">) {
 const params = await searchParams;
 const topicId = typeof params.topic === "string" ? params.topic : "";

 return (
  <div className="hanzihome-static-page min-w-0">
   <SpeakingDrillsWorkspace
    catalog={getSpeakingDrillsCatalog()}
    selection={getSpeakingDrillSelection(topicId)}
   />
  </div>
 );
}
