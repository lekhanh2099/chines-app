import type { ComponentProps } from "react";
import { AudioLines, Keyboard, MessageCircle, Mic, Newspaper, type LucideIcon } from "lucide-react";
import { z } from "zod";

import type { IconTile } from "@/components/ui/display/icon-tile";

export const skillsHubSectionIdSchema = z.enum([
 "shadowing",
 "speakingDrills",
 "conversation",
 "dailyReading",
 "dictation",
]);

export type SkillsHubSectionId = z.infer<typeof skillsHubSectionIdSchema>;

export type SkillsHubSectionConfig = {
 id: SkillsHubSectionId;
 href: string;
 icon: LucideIcon;
 tone: NonNullable<ComponentProps<typeof IconTile>["tone"]>;
};

export const skillsHubSections = [
 {
  id: "shadowing",
  href: "/shadowing",
  icon: AudioLines,
  tone: "accent",
 },
 {
  id: "speakingDrills",
  href: "/speaking-drills",
  icon: Mic,
  tone: "info",
 },
 {
  id: "conversation",
  href: "/conversation",
  icon: MessageCircle,
  tone: "success",
 },
 {
  id: "dailyReading",
  href: "/daily-reading",
  icon: Newspaper,
  tone: "warning",
 },
 {
  id: "dictation",
  href: "/dictation",
  icon: Keyboard,
  tone: "neutral",
 },
] satisfies readonly SkillsHubSectionConfig[];
