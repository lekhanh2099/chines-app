import {
 BookMarked,
 BookOpenCheck,
 BookOpenText,
 Brain,
 FileCode2,
 GraduationCap,
 Home,
 Keyboard,
 Landmark,
 Languages,
 Layers3,
 LayoutGrid,
 LibraryBig,
 Lightbulb,
 ListTree,
 MessageCircle,
 Mic,
 Newspaper,
 NotebookPen,
 NotebookTabs,
 RefreshCcw,
 SearchCheck,
 Settings,
 Target,
 Workflow,
} from "lucide-react";
import type { AppMessages } from "@/i18n/messages";

type NavigationMessageKey = `navigation.items.${keyof AppMessages["Shell"]["navigation"]["items"]}`;
type NavigationGroupMessageKey =
 `navigation.groups.${keyof AppMessages["Shell"]["navigation"]["groups"]}`;
type NavigationSectionMessageKey =
 `navigation.sections.${keyof AppMessages["Shell"]["navigation"]["sections"]}`;
type NavigationMatchMode = "exact" | "prefix";
export type NavigationItemConfig = {
 messageKey: NavigationMessageKey;
 icon: typeof Home;
 href: string;
 match?: NavigationMatchMode;
 aliases?: readonly string[];
};

export const navigationItems = {
 home: { messageKey: "navigation.items.home", icon: Home, href: "/" },
 lessons: {
  messageKey: "navigation.items.lessons",
  icon: BookOpenCheck,
  href: "/hanzihome",
  aliases: ["/hsk/han-thuong-mai", "/hsk/nhip-cau-han-ngu", "/hsk/doc-hieu", "/hsk/khau-ngu-tc1"],
 },
 reader: { messageKey: "navigation.items.reader", icon: BookOpenText, href: "/reader" },
 readerCourse: {
  messageKey: "navigation.items.readerCourse",
  icon: BookOpenText,
  href: "/reader/course",
 },
 dailyReading: {
  messageKey: "navigation.items.dailyReading",
  icon: Newspaper,
  href: "/daily-reading",
 },
 readerPractice: {
  messageKey: "navigation.items.readerPractice",
  icon: RefreshCcw,
  href: "/reader/practice",
 },
 readerMock: {
  messageKey: "navigation.items.readerMock",
  icon: Target,
  href: "/reader/mock",
 },
 hskReading: {
  messageKey: "navigation.items.hskReading",
  icon: BookMarked,
  href: "/hsk",
  match: "prefix",
  aliases: ["/reader/hsk"],
 },
 hskGrammar: {
  messageKey: "navigation.items.hskGrammar",
  icon: ListTree,
  href: "/hsk/grammar",
 },
 businessChinese: {
  messageKey: "navigation.items.businessChinese",
  icon: BookOpenText,
  href: "/hsk/han-thuong-mai",
 },
 chineseBridge: {
  messageKey: "navigation.items.chineseBridge",
  icon: BookOpenText,
  href: "/hsk/nhip-cau-han-ngu",
 },
 readingComprehension: {
  messageKey: "navigation.items.readingComprehension",
  icon: BookOpenText,
  href: "/hsk/doc-hieu",
 },
 spokenChinese: {
  messageKey: "navigation.items.spokenChinese",
  icon: BookOpenText,
  href: "/hsk/khau-ngu-tc1",
 },
 humanities: {
  messageKey: "navigation.items.humanities",
  icon: Landmark,
  href: "/humanities",
  match: "prefix",
 },
 personalLearning: {
  messageKey: "navigation.items.personalLearning",
  icon: Brain,
  href: "/personal-learning",
  match: "prefix",
 },
 notebook: { messageKey: "navigation.items.notebook", icon: NotebookTabs, href: "/notebook" },
 notes: {
  messageKey: "navigation.items.notes",
  icon: NotebookPen,
  href: "/notes",
  match: "prefix",
 },
 dictation: { messageKey: "navigation.items.dictation", icon: Keyboard, href: "/dictation" },
 translationStudio: {
  messageKey: "navigation.items.translationStudio",
  icon: Languages,
  href: "/translation",
 },
 memoryTips: {
  messageKey: "navigation.items.memoryTips",
  icon: Lightbulb,
  href: "/memory-tips",
 },
 conversation: {
  messageKey: "navigation.items.conversation",
  icon: MessageCircle,
  href: "/conversation",
 },
 speakingDrills: {
  messageKey: "navigation.items.speakingDrills",
  icon: Mic,
  href: "/speaking-drills",
 },
 learningLoop: {
  messageKey: "navigation.items.learningLoop",
  icon: Workflow,
  href: "/learning-loop",
 },
 radicals: {
  messageKey: "navigation.items.radicals",
  icon: Layers3,
  href: "/radicals",
  match: "prefix",
 },
 inspector: {
  messageKey: "navigation.items.inspector",
  icon: SearchCheck,
  href: "/inspector",
  match: "prefix",
 },
 htmlArtifacts: {
  messageKey: "navigation.items.htmlArtifacts",
  icon: FileCode2,
  href: "/html-artifacts",
 },
 settings: {
  messageKey: "navigation.items.settings",
  icon: Settings,
  href: "/settings?section=app",
  aliases: ["/tts", "/data-quality", "/api-docs"],
 },
} satisfies {
 home: NavigationItemConfig;
 lessons: NavigationItemConfig;
 reader: NavigationItemConfig;
 readerCourse: NavigationItemConfig;
 dailyReading: NavigationItemConfig;
 readerPractice: NavigationItemConfig;
 readerMock: NavigationItemConfig;
 hskReading: NavigationItemConfig;
 hskGrammar: NavigationItemConfig;
 businessChinese: NavigationItemConfig;
 chineseBridge: NavigationItemConfig;
 readingComprehension: NavigationItemConfig;
 spokenChinese: NavigationItemConfig;
 humanities: NavigationItemConfig;
 personalLearning: NavigationItemConfig;
 notebook: NavigationItemConfig;
 notes: NavigationItemConfig;
 dictation: NavigationItemConfig;
 translationStudio: NavigationItemConfig;
 memoryTips: NavigationItemConfig;
 conversation: NavigationItemConfig;
 speakingDrills: NavigationItemConfig;
 learningLoop: NavigationItemConfig;
 radicals: NavigationItemConfig;
 inspector: NavigationItemConfig;
 htmlArtifacts: NavigationItemConfig;
 settings: NavigationItemConfig;
};

export type NavigationItemId = keyof typeof navigationItems;

const contentCapabilityNavigationItemIds: readonly NavigationItemId[] = [
 "htmlArtifacts",
] satisfies readonly NavigationItemId[];

type NavigationSectionConfig = {
 id: string;
 messageKey: NavigationSectionMessageKey;
 icon: typeof Home;
 /** Folded behind a disclosure row instead of always listed. */
 collapsible: boolean;
 /** An always-listed section that shows its name above its items. */
 labelled: boolean;
 itemIds: readonly NavigationItemId[];
};
export type NavigationGroupConfig = {
 id: string;
 messageKey: NavigationGroupMessageKey;
 icon: typeof Home;
 sections: readonly NavigationSectionConfig[];
};

export const navigationGroups = [
 {
  id: "learning",
  messageKey: "navigation.groups.learning",
  icon: GraduationCap,
  sections: [
   {
    id: "learning-main",
    messageKey: "navigation.sections.learningMain",
    icon: GraduationCap,
    collapsible: false,
    labelled: false,
    itemIds: ["home", "lessons", "dailyReading", "speakingDrills", "reader"],
   },
   {
    id: "learning-reference",
    messageKey: "navigation.sections.learningReference",
    icon: SearchCheck,
    collapsible: false,
    labelled: true,
    itemIds: ["notes", "radicals", "inspector"],
   },
   {
    id: "textbooks",
    messageKey: "navigation.sections.textbooks",
    icon: LibraryBig,
    collapsible: true,
    labelled: false,
    itemIds: ["businessChinese", "chineseBridge", "readingComprehension", "spokenChinese"],
   },
   {
    id: "hsk-reading",
    messageKey: "navigation.sections.hskReading",
    icon: BookMarked,
    collapsible: true,
    labelled: false,
    itemIds: ["hskReading", "hskGrammar"],
   },
   {
    id: "learning-more",
    messageKey: "navigation.sections.learningMore",
    icon: LayoutGrid,
    collapsible: true,
    labelled: false,
    itemIds: ["humanities", "htmlArtifacts"],
   },
  ],
 },
 {
  id: "practice",
  messageKey: "navigation.groups.practice",
  icon: Target,
  sections: [
   {
    id: "practice-main",
    messageKey: "navigation.sections.practiceListeningSpeaking",
    icon: Target,
    collapsible: false,
    labelled: false,
    itemIds: ["dictation", "conversation", "translationStudio"],
   },
   {
    id: "practice-review",
    messageKey: "navigation.sections.practiceReview",
    icon: RefreshCcw,
    collapsible: false,
    labelled: true,
    itemIds: ["memoryTips", "learningLoop"],
   },
  ],
 },
 {
  id: "personal",
  messageKey: "navigation.groups.personal",
  icon: Brain,
  sections: [
   {
    id: "personal-workspace",
    messageKey: "navigation.sections.personalWorkspace",
    icon: Brain,
    collapsible: false,
    labelled: false,
    itemIds: ["personalLearning", "notebook"],
   },
  ],
 },
] satisfies readonly NavigationGroupConfig[];

function requiresContentCapability(itemId: NavigationItemId) {
 return contentCapabilityNavigationItemIds.includes(itemId);
}

export function filterNavigationGroupsForContentCapability(
 canManageContent: boolean,
): readonly NavigationGroupConfig[] {
 return navigationGroups
  .map((group) => ({
   ...group,
   sections: group.sections
    .map((section) => ({
     ...section,
     itemIds: section.itemIds.filter(
      (itemId) => canManageContent || !requiresContentCapability(itemId),
     ),
    }))
    .filter((section) => section.itemIds.length > 0),
  }))
  .filter((group) => group.sections.length > 0);
}

export const mobileNavigationItemIds = [
 "home",
 "lessons",
 "dictation",
 "notes",
] satisfies readonly NavigationItemId[];
export const mobileUtilityItemIds = ["settings"] satisfies readonly NavigationItemId[];
