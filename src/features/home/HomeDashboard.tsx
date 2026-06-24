"use client";

import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeQuickActions } from "@/features/home/components/HomeQuickActions";
import { HomeResourceLinks } from "@/features/home/components/HomeResourceLinks";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import { useHomeDashboard } from "@/features/home/hooks/useHomeDashboard";

export function HomeDashboard() {
 const dashboard = useHomeDashboard();

 return (
  <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
   <div className="grid gap-5">
    <ContinueLearningPanel lesson={dashboard.lesson} />
    <HomeResourceLinks />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
     <RecentNotesPanel notes={dashboard.recentNotes} />
     <HomeQuickActions />
    </div>
   </div>
  </div>
 );
}
