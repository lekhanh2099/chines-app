import {
 Award,
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
 UserRound,
 Volume2,
 Workflow,
} from "lucide-react";
import type { AppMessages } from "@/i18n/messages";

type NavigationMessageKey = `navigation.items.${keyof AppMessages["Shell"]["navigation"]["items"]}`;
type NavigationItemConfig = {
 messageKey: NavigationMessageKey;
 icon: typeof Home;
 href: string;
};

export const navigationItems = {
 home: { messageKey: "navigation.items.home", icon: Home, href: "/" },
 lessons: { messageKey: "navigation.items.lessons", icon: BookOpenCheck, href: "/hanzihome" },
 reader: { messageKey: "navigation.items.reader", icon: BookOpenText, href: "/reader" },
 dailyReading: {
  messageKey: "navigation.items.dailyReading",
  icon: Newspaper,
  href: "/daily-reading",
 },
 hskReading: { messageKey: "navigation.items.hskReading", icon: BookMarked, href: "/hsk" },
 grammar: { messageKey: "navigation.items.grammar", icon: ListTree, href: "/grammar" },
 humanities: {
  messageKey: "navigation.items.humanities",
  icon: Landmark,
  href: "/humanities",
 },
 personalLearning: {
  messageKey: "navigation.items.personalLearning",
  icon: Brain,
  href: "/personal-learning",
 },
 notebook: { messageKey: "navigation.items.notebook", icon: NotebookTabs, href: "/notebook" },
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
 inspector: {
  messageKey: "navigation.items.inspector",
  icon: SearchCheck,
  href: "/inspector",
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
 dataQuality: {
  messageKey: "navigation.items.dataQuality",
  icon: ShieldCheck,
  href: "/data-quality",
 },
 vocab: { messageKey: "navigation.items.vocab", icon: Library, href: "/vocab" },
 radicals: { messageKey: "navigation.items.radicals", icon: Layers3, href: "/radicals" },
 notes: { messageKey: "navigation.items.notes", icon: NotebookPen, href: "/notes" },
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
 dailyReading: NavigationItemConfig;
 hskReading: NavigationItemConfig;
 grammar: NavigationItemConfig;
 humanities: NavigationItemConfig;
 personalLearning: NavigationItemConfig;
 notebook: NavigationItemConfig;
 dictation: NavigationItemConfig;
 translationStudio: NavigationItemConfig;
 tts: NavigationItemConfig;
 dictionary: NavigationItemConfig;
 memoryTips: NavigationItemConfig;
 inspector: NavigationItemConfig;
 conversation: NavigationItemConfig;
 learningLoop: NavigationItemConfig;
 dataQuality: NavigationItemConfig;
 vocab: NavigationItemConfig;
 radicals: NavigationItemConfig;
 notes: NavigationItemConfig;
 htmlArtifacts: NavigationItemConfig;
 apiDocs: NavigationItemConfig;
 settings: NavigationItemConfig;
};

export type NavigationItemId = keyof typeof navigationItems;

export const navigationGroups = [
 {
  id: "learning",
  messageKey: "navigation.groups.learning",
  icon: GraduationCap,
  itemIds: [
   "home",
   "lessons",
   "reader",
   "dailyReading",
   "hskReading",
   "grammar",
   "humanities",
   "personalLearning",
   "notebook",
  ],
 },
 {
  id: "practice",
  messageKey: "navigation.groups.practice",
  icon: Target,
  itemIds: [
   "dictation",
   "translationStudio",
   "tts",
   "dictionary",
   "memoryTips",
   "inspector",
   "conversation",
   "learningLoop",
   "dataQuality",
  ],
 },
 {
  id: "competency",
  messageKey: "navigation.groups.competency",
  icon: Award,
  itemIds: ["vocab", "radicals"],
 },
 {
  id: "personal",
  messageKey: "navigation.groups.personal",
  icon: UserRound,
  itemIds: ["notes", "htmlArtifacts", "apiDocs"],
 },
] satisfies ReadonlyArray<{
 id: string;
 messageKey: `navigation.groups.${string}`;
 icon: typeof Home;
 itemIds: readonly NavigationItemId[];
}>;

export const mobileNavigationItemIds = [
 "home",
 "lessons",
 "dictation",
 "notes",
] satisfies readonly NavigationItemId[];
export const mobileUtilityItemIds = ["settings"] satisfies readonly NavigationItemId[];
