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
 PlugZap,
 RefreshCcw,
 SearchCheck,
 Settings,
 ShieldCheck,
 Target,
 Volume2,
 Workflow,
} from "lucide-react";
import type { AppMessages } from "@/i18n/messages";

type NavigationMessageKey = `navigation.items.${keyof AppMessages["Shell"]["navigation"]["items"]}`;
type NavigationGroupMessageKey = `navigation.groups.${keyof AppMessages["Shell"]["navigation"]["groups"]}`;
type NavigationSectionMessageKey = `navigation.sections.${keyof AppMessages["Shell"]["navigation"]["sections"]}`;
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
  aliases: ["/reader?collection=core"],
 },
 dailyReading: {
  messageKey: "navigation.items.dailyReading",
  icon: Newspaper,
  href: "/daily-reading",
  aliases: ["/reader?collection=daily"],
 },
 readerPractice: {
  messageKey: "navigation.items.readerPractice",
  icon: RefreshCcw,
  href: "/reader/practice",
  aliases: ["/reader?collection=reinforcement"],
 },
 readerMock: {
  messageKey: "navigation.items.readerMock",
  icon: Target,
  href: "/reader/mock",
  aliases: ["/reader?collection=mock"],
 },
 hskReading: {
  messageKey: "navigation.items.hskReading",
  icon: BookMarked,
  href: "/hsk",
  match: "prefix",
  aliases: ["/reader/hsk", "/reader?collection=hsk"],
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
 tts: { messageKey: "navigation.items.tts", icon: Volume2, href: "/tts" },
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
 dataQuality: {
  messageKey: "navigation.items.dataQuality",
  icon: ShieldCheck,
  href: "/data-quality",
 },
 htmlArtifacts: {
  messageKey: "navigation.items.htmlArtifacts",
  icon: FileCode2,
  href: "/html-artifacts",
 },
 apiDocs: { messageKey: "navigation.items.apiDocs", icon: PlugZap, href: "/api-docs" },
 settings: {
  messageKey: "navigation.items.settings",
  icon: Settings,
  href: "/settings?section=app",
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
 grammar: NavigationItemConfig;
 humanities: NavigationItemConfig;
 personalLearning: NavigationItemConfig;
 notebook: NavigationItemConfig;
 notes: NavigationItemConfig;
 dictation: NavigationItemConfig;
 translationStudio: NavigationItemConfig;
 tts: NavigationItemConfig;
 dictionary: NavigationItemConfig;
 memoryTips: NavigationItemConfig;
 conversation: NavigationItemConfig;
 learningLoop: NavigationItemConfig;
 vocab: NavigationItemConfig;
 radicals: NavigationItemConfig;
 inspector: NavigationItemConfig;
 dataQuality: NavigationItemConfig;
 htmlArtifacts: NavigationItemConfig;
 apiDocs: NavigationItemConfig;
 settings: NavigationItemConfig;
};

export type NavigationItemId = keyof typeof navigationItems;

type NavigationSectionConfig = {
 id: string;
 messageKey: NavigationSectionMessageKey;
 itemIds: readonly NavigationItemId[];
};
type NavigationGroupConfig = {
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
    itemIds: ["home", "lessons", "humanities"],
   },
   {
    id: "learning-personal",
    messageKey: "navigation.sections.learningPersonal",
    itemIds: ["personalLearning", "notebook", "notes"],
   },
  ],
 },
 {
  id: "reading",
  messageKey: "navigation.groups.reading",
  icon: BookOpenText,
  sections: [
   {
    id: "reading-library",
    messageKey: "navigation.sections.readingLibrary",
    itemIds: ["reader", "readerCourse", "dailyReading"],
   },
   {
    id: "reading-practice",
    messageKey: "navigation.sections.readingPractice",
    itemIds: ["readerPractice", "readerMock"],
   },
  ],
 },
 {
  id: "hsk",
  messageKey: "navigation.groups.hsk",
  icon: BookMarked,
  sections: [
   {
    id: "hsk-reading",
    messageKey: "navigation.sections.hskReading",
    itemIds: ["hskReading"],
   },
  ],
 },
 {
  id: "practice",
  messageKey: "navigation.groups.practice",
  icon: Target,
  sections: [
   {
    id: "practice-listening-speaking",
    messageKey: "navigation.sections.practiceListeningSpeaking",
    itemIds: ["tts", "dictation", "conversation"],
   },
   {
    id: "practice-writing-translation",
    messageKey: "navigation.sections.practiceWritingTranslation",
    itemIds: ["translationStudio"],
   },
   {
    id: "practice-review",
    messageKey: "navigation.sections.practiceReview",
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
    itemIds: ["grammar", "vocab"],
   },
   {
    id: "knowledge-hanzi",
    messageKey: "navigation.sections.knowledgeHanzi",
    itemIds: ["radicals", "inspector"],
   },
  ],
 },
 {
  id: "system",
  messageKey: "navigation.groups.system",
  icon: Settings,
  sections: [
   {
    id: "system-data",
    messageKey: "navigation.sections.systemData",
    itemIds: ["dataQuality"],
   },
   {
    id: "system-tools",
    messageKey: "navigation.sections.systemTools",
    itemIds: ["htmlArtifacts", "apiDocs"],
   },
  ],
 },
] satisfies readonly NavigationGroupConfig[];

export const mobileNavigationItemIds = [
 "home",
 "lessons",
 "dictation",
 "notes",
] satisfies readonly NavigationItemId[];
export const mobileUtilityItemIds = ["settings"] satisfies readonly NavigationItemId[];
