"use client";

import { use } from "react";
import { PersonalLearningErrorDetailPage } from "@/features/hanzihome/personal-learning/ui/PersonalLearningPages";

export default function PersonalLearningErrorPage({
 params,
}: {
 params: Promise<{ hypothesisId: string }>;
}) {
 const { hypothesisId } = use(params);
 return <PersonalLearningErrorDetailPage hypothesisId={hypothesisId} />;
}
