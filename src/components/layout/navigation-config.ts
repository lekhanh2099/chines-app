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
 Library,
 Lightbulb,
 ListTree,
 MessageCircle,
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
 lessons: { messageKey: "navigation.items.lessons", icon: BookOpenCheck, href: "/hanzihome" },
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
 grammar: { messageKey: "navigation.items.grammar", icon: ListTree, href: "/grammar" },
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
 dictionary: {
  messageKey: "navigation.items.dictionary",
  icon: RefreshCcw,
  href: "/dictionary",
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
 learningLoop: {
  messageKey: "navigation.items.learningLoop",
  icon: Workflow,
  href: "/learning-loop",
 },
 vocab: { messageKey: "navigation.items.vocab", icon: Library, href: "/vocab" },
 radicals: { messageKey: "navigation.items.radicals", icon: Layers3, href: "/radicals" },
 inspector: {
  messageKey: "navigation.items.inspector",
  icon: SearchCheck,
  href: "/inspector",
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
 grammar: NavigationItemConfig;
 humanities: NavigationItemConfig;
 personalLearning: NavigationItemConfig;
 notebook: NavigationItemConfig;
 notes: NavigationItemConfig;
 dictation: NavigationItemConfig;
 translationStudio: NavigationItemConfig;
 dictionary: NavigationItemConfig;
 memoryTips: NavigationItemConfig;
 conversation: NavigationItemConfig;
 learningLoop: NavigationItemConfig;
 vocab: NavigationItemConfig;
 radicals: NavigationItemConfig;
 inspector: NavigationItemConfig;
 htmlArtifacts: NavigationItemConfig;
 settings: NavigationItemConfig;
};

export type NavigationItemId = keyof typeof navigationItems;

export const contentCapabilityNavigationItemIds: readonly NavigationItemId[] = [
 "htmlArtifacts",
] satisfies readonly NavigationItemId[];

export const compatibilityNavigationItemIds: readonly NavigationItemId[] = [
 "readerCourse",
 "readerPractice",
 "readerMock",
] satisfies readonly NavigationItemId[];

type NavigationSectionConfig = {
 id: string;
 messageKey: NavigationSectionMessageKey;
 collapsible: boolean;
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
    collapsible: false,
    itemIds: ["home", "lessons", "dailyReading", "reader", "notes"],
   },
   {
    id: "hsk-reading",
    messageKey: "navigation.sections.hskReading",
    collapsible: true,
    itemIds: ["hskReading", "hskGrammar", "businessChinese"],
   },
   {
    id: "learning-more",
    messageKey: "navigation.sections.learningMore",
    collapsible: true,
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
    collapsible: false,
    itemIds: ["dictation", "conversation", "translationStudio"],
   },
   {
    id: "practice-review",
    messageKey: "navigation.sections.practiceReview",
    collapsible: true,
    itemIds: ["dictionary", "memoryTips", "learningLoop"],
   },
  ],
 },
 {
  id: "knowledge",
  messageKey: "navigation.groups.knowledge",
  icon: Library,
  sections: [
   {
    id: "knowledge-language",
    messageKey: "navigation.sections.knowledgeLanguage",
    collapsible: false,
    itemIds: ["grammar", "vocab"],
   },
   {
    id: "knowledge-hanzi",
    messageKey: "navigation.sections.knowledgeHanzi",
    collapsible: true,
    itemIds: ["radicals", "inspector"],
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
    collapsible: false,
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
