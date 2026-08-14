"use client";

import { use } from "react";
import { PersonalLearningKnowledgeDetailPage } from "@/features/hanzihome/personal-learning/ui/PersonalLearningPages";

export default function KnowledgeNodePage({ params }: { params: Promise<{ nodeId: string }> }) {
 const { nodeId } = use(params);
 return <PersonalLearningKnowledgeDetailPage nodeId={nodeId} />;
}
