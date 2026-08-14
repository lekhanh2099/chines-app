"use client";

import { use } from "react";
import { PersonalLearningEvidencePage } from "@/features/hanzihome/personal-learning/ui/PersonalLearningPages";

export default function PersonalLearningEvidenceRoute({
 params,
}: {
 params: Promise<{ nodeId: string }>;
}) {
 const { nodeId } = use(params);
 return <PersonalLearningEvidencePage nodeId={nodeId} />;
}
